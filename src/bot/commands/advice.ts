import { Bot, InlineKeyboard } from "grammy";
import { AppContext } from "../../interfaces.js";

export const setupAdviceCommands = async (bot: Bot<AppContext>) => {
  bot.callbackQuery("create_advice", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.adviceStep = "waiting_text";
    await ctx.editMessageText(
      "Пожалуйста, напишите какого товара вам не хватает в ассортименте:",
      {
        reply_markup: new InlineKeyboard().text(
          "🔙 Назад в меню",
          "back_to_menu"
        ),
      }
    );
  });
};
