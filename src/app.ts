import "dotenv/config";
import "reflect-metadata";
import { Bot, session, webhookCallback } from "grammy";
import { DatabaseService } from "./services/database.js";
import { setupBot } from "./bot/bot.js";
import { AppContext, SessionData } from "./interfaces.js";
import express from "express";
import cors from "cors";
import { cartRouter } from "./routers/cart.router.js";
import { catalogRouter } from "./routers/catalog.router.js";
import { orderRouter } from "./routers/order.router.js";
import { productRouter } from "./routers/product.router.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { imageRouter } from "./routers/image.router.js";
import { subscriptionRouter } from "./routers/subscription.router.js";

async function bootstrap() {
  // Создание экземпляра бота
  const bot = new Bot<AppContext>(process.env.TELEGRAM_BOT_TOKEN!);

  // Инициализация базы данных
  const databaseService = new DatabaseService();
  await databaseService.initialize();

  // Настройка сессий
  bot.use(
    session({
      initial: (): SessionData => ({
        cart: [],
        orderStep: undefined,
        orderName: undefined,
        orderPhone: undefined,
        orderAddress: undefined,
        hasSubscription: false,
      }),
    })
  );

  // Настройка бота
  await setupBot(bot);

  // Запуск бота
  //bot.start().catch((err) => console.log(err));
  //console.log("Bot is running...");

  const app = express();
  const PORT = +process.env.PORT;

  app.use(express.json());
  app.use("/api/bot", webhookCallback(bot, "express"));
  app.use(cors({ origin: process.env.WEB_APP_URL }));
  app.use(asyncHandler(authMiddleware));
  app.use("/api/cart", cartRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/order", orderRouter);
  app.use("/api/product", productRouter);
  app.use("/api/image", imageRouter);
  app.use("/api/subscription", subscriptionRouter);

  app.listen(PORT, () => console.log(`Server has been started on ${PORT}`));

  // Обработка завершения работы
  process.once("SIGINT", () => bot.stop());
  process.once("SIGTERM", () => bot.stop());
}

bootstrap().catch(console.error);
