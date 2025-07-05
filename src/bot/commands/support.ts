import { Bot } from "grammy";
import { AppContext } from "../../interfaces.js";

export const setupSupportCommands = async (bot: Bot<AppContext>) => {
  // Обработка команды "О нас / Поддержка"
  bot.hears("ℹ️ О нас / Поддержка", async (ctx) => {
    await ctx.reply(
      `<b>FOODBOX</b> - сервис доставки свежих продуктов\n\n` +
        `📞 Поддержка: @foodbox_support\n` +
        `⏰ Время работы: 9:00 - 21:00\n` +
        `🚚 Доставка: ежедневно с 10:00 до 22:00`,
      { parse_mode: "HTML" }
    );
  });
};
