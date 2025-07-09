import { Advice } from "../../entities/advice.js";
import { User } from "../../entities/user.js";
import { AppContext } from "../../interfaces.js";
import { AppDataSource } from "../../services/database.js";

export const adviceEventsInit = async (ctx: AppContext) => {
  if (!ctx.session.adviceStep) return;
  switch (ctx.session.adviceStep) {
    case "waiting_text":
      await handleAddAdvice(ctx);
      break;
  }
};

const handleAddAdvice = async (ctx: AppContext) => {
  if (!ctx.message || typeof ctx.message.text !== "string") {
    await ctx.reply("Пожалуйста, введите текст совета.");
    return;
  }
  const text = ctx.message.text.trim();
  if (!text) {
    await ctx.reply("Пожалуйста, введите текст совета.");
    return;
  }
  // Получаем пользователя
  const userRepo = AppDataSource.getRepository(User);
  let user = await userRepo.findOne({
    where: { telegramId: ctx.from.id.toString() },
  });
  if (!user) {
    user = userRepo.create({
      telegramId: ctx.from.id.toString(),
      name: ctx.from.first_name,
    });
    await userRepo.save(user);
  }
  // Сохраняем совет
  const adviceRepo = AppDataSource.getRepository(Advice);
  const advice = adviceRepo.create({ user, text });
  await adviceRepo.save(advice);
  ctx.session.adviceStep = undefined;
  await ctx.reply("Спасибо за ваш совет! Мы обязательно его учтём.");
  return;
};
