import { Bot, Keyboard } from "grammy";
import { AppContext } from "../../interfaces.js";

export const setupMenu = async (bot: Bot<AppContext>) => {
  // Устанавливаем команды меню
  // await bot.api.setMyCommands([
  //   { command: "start", description: "🏠 Главное меню" },
  // ]);

  // Устанавливаем тип меню как команды
  await bot.api.setChatMenuButton({
    menu_button: {
      text: "🍅 Каталог",
      type: "web_app",
      web_app: { url: process.env.WEB_APP_URL },
    },
  });
};

export const getMainMenu = (isAdmin: boolean) => {
  const keyboard = new Keyboard()

    .text("🌟 Подписка")
    .text("❓ Советы")
    .row()
    .text("ℹ️ О нас")
    .text("🧑‍💻 Поддержка");

  if (isAdmin) {
    keyboard.row().text("👨‍💼 Админ-панель");
  }

  keyboard.resized();

  return keyboard;
};
