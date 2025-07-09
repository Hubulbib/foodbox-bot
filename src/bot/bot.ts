import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { AppContext } from "../interfaces.js";
import { setupAdminCommands } from "./commands/admin.js";
import { setupSubscriptionCommands } from "./commands/subscription.js";
import { setupSupportCommands } from "./commands/support.js";
import { getMainMenu, setupMenu } from "./commands/menu.js";
import { NotificationService } from "../services/notification.js";
import { PaymentService } from "../services/payment.js";
import { checkSubscription } from "../utils/helpers.js";
import { setupDeliveryHandlers } from "./handlers/delivery.js";
import { setupPaymentHandlers } from "./handlers/payment.js";
import { AppDataSource } from "../services/database.js";
import { User } from "../entities/user.js";
import { adminEventsInit } from "./events/admin.js";
import { CONSTANTS } from "../const.js";
import { setupAdviceCommands } from "./commands/advice.js";
import { adviceEventsInit } from "./events/advice.js";
import { Subscription } from "../entities/subscription.js";

const ADMIN_IDS = process.env.ADMIN_IDS?.split(",").map(Number) || [];

export const isAdmin = (ctx: AppContext) => {
  return ctx.from && ADMIN_IDS.includes(ctx.from.id);
};

export const setupBot = async (bot: Bot<AppContext>) => {
  // Инициализация сервисов
  const notificationService = new NotificationService(bot);
  const paymentService = new PaymentService(bot, notificationService);

  // Настройка меню
  await setupMenu(bot);

  // Проверка подписки при каждом сообщении
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      ctx.session.hasSubscription = await checkSubscription(ctx.from.id);
    }
    await next();
  });

  bot.on("message", async (ctx, next) => {
    if (ctx.session.adviceStep) {
      await adviceEventsInit(ctx);
      return next();
    } else if (isAdmin(ctx) && ctx.session.adminAction) {
      await adminEventsInit(ctx, isAdmin);
      return next();
    } else {
      await ctx.reply("Выберите действие:", {
        reply_markup: getMainMenu(isAdmin(ctx)),
      });
      return next();
    }
  });

  // Приветственное сообщение
  bot.command("start", async (ctx) => {
    const isAdmin = ctx.from && ADMIN_IDS.includes(ctx.from.id);

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

    await ctx.reply(CONSTANTS.HELLO_TEXT, {
      parse_mode: "HTML",
      reply_markup: getMainMenu(isAdmin),
    });
  });

  bot.hears("🌟 Подписка", async (ctx) => {
    if (!ctx.from) return;

    let message = CONSTANTS.SUBSCRIPTION_TEXT;

    const keyboard = new InlineKeyboard();

    if (ctx.session.hasSubscription) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { telegramId: ctx.from.id.toString() },
        relations: ["subscription"],
      });

      const subscriptionRepo = AppDataSource.getRepository(Subscription);
      const subscription = (
        await subscriptionRepo.findOne({
          where: { userId: user.id },
          order: { endDate: "DESC" },
        })
      )[0];

      if (subscription && (await checkSubscription(user.id))) {
        const daysLeft = Math.ceil(
          (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        message +=
          `\n\n✅ У вас активна подписка!\n` +
          `Действует до: ${new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(subscription.endDate)}\n` +
          `Осталось дней: ${daysLeft}`;

        keyboard.text("🔄 Продлить подписку", "create_subscription");
      }
    } else {
      keyboard.text("💳 Оформить подписку", "create_subscription");
    }

    keyboard.row().text("🔙 Назад в меню", "back_to_menu");

    await ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  });

  bot.hears("❓ Советы", async (ctx) => {
    const inlineKeyboard = new InlineKeyboard()
      .text("✍️ Написать совет", "create_advice")
      .row()
      .text("🔙 Назад в меню", "back_to_menu");

    await ctx.reply(CONSTANTS.ADVICE_TEXT, { reply_markup: inlineKeyboard });
  });

  bot.hears("ℹ️ О нас", async (ctx) => {
    await ctx.reply(CONSTANTS.ABOUT_TEXT, { parse_mode: "HTML" });
  });

  bot.hears("🧑‍💻 Поддержка", async (ctx) => {
    await ctx.reply(CONSTANTS.SUPPORT_TEXT, { parse_mode: "HTML" });
  });

  bot.hears("◀️ Назад", async (ctx) => {
    const isAdmin = ctx.from && ADMIN_IDS.includes(ctx.from.id);

    await ctx.reply("Главное меню:", {
      reply_markup: getMainMenu(isAdmin),
    });
  });

  // Добавляем обработчик для кнопки "Назад в меню"
  bot.callbackQuery("back_to_menu", async (ctx) => {
    await ctx.answerCallbackQuery();

    const isAdmin = ctx.from && ADMIN_IDS.includes(ctx.from.id);

    await ctx.editMessageText("Главное меню:");

    await ctx.reply("Выберите действие: ", {
      reply_markup: getMainMenu(isAdmin),
    });
  });

  // Настройка команд
  await setupAdminCommands(bot);
  await setupSubscriptionCommands(bot);
  await setupSupportCommands(bot);
  await setupAdviceCommands(bot);

  // Настройка обработчиков
  setupPaymentHandlers(bot, paymentService);
  setupDeliveryHandlers(bot, notificationService);

  // Обработка ошибок
  bot.catch((err) => {
    console.error("Ошибка бота:", err);
  });
};
