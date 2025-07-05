import { Bot, InlineKeyboard } from "grammy";
import { AppContext } from "../../interfaces.js";
import { AppDataSource } from "../../services/database.js";
import { Subscription } from "../../entities/subscription.js";
import { User } from "../../entities/user.js";
import { CONSTANTS } from "../../const.js";

export const setupSubscriptionCommands = async (bot: Bot<AppContext>) => {
  // Обработка кнопки подписки
  bot.callbackQuery("menu_subscription", async (ctx) => {
    await ctx.answerCallbackQuery();

    const message = CONSTANTS.SUBSCRIPTION_TEXT;

    const keyboard = new InlineKeyboard();

    if (ctx.session.hasSubscription) {
      keyboard.text("✅ У вас уже есть подписка", "already_subscribed");
    } else {
      keyboard
        .text("💳 Оформить подписку", "create_subscription")
        .row()
        .text("ℹ️ Подробнее", "subscription_info");
    }

    keyboard.row().text("🔙 Назад в меню", "back_to_menu");

    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  });

  // Оформление подписки
  bot.callbackQuery("create_subscription", async (ctx) => {
    const keyboard = new InlineKeyboard().text(
      "🔙 Назад в меню",
      "back_to_menu"
    );

    await ctx.reply("Данная функция находится в разработке. Попробуйте позже", {
      reply_markup: keyboard,
    });

    // await ctx.answerCallbackQuery();

    // const userRepo = AppDataSource.getRepository(User);
    // const subscriptionRepo = AppDataSource.getRepository(Subscription);

    // const user = await userRepo.findOne({
    //   where: { telegramId: ctx.from?.id },
    // });

    // if (!user) {
    //   await ctx.editMessageText("Ошибка: пользователь не найден");
    //   return;
    // }

    // const newSubscription = subscriptionRepo.create({
    //   user,
    //   startDate: new Date(),
    //   endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    //   isActive: true,
    // });

    // await subscriptionRepo.save(newSubscription);
    // ctx.session.hasSubscription = true;

    // const keyboard = new InlineKeyboard().text(
    //   "🔙 Назад в меню",
    //   "back_to_menu"
    // );

    // await ctx.editMessageText(
    //   `🎉 <b>Подписка оформлена!</b>\n\n` +
    //     `Действует до: ${newSubscription.endDate.toLocaleDateString()}`,
    //   {
    //     parse_mode: "HTML",
    //     reply_markup: keyboard,
    //   }
    // );
  });

  // Информация о подписке
  bot.callbackQuery("subscription_info", async (ctx) => {
    await ctx.answerCallbackQuery();

    const keyboard = new InlineKeyboard()
      .text("💳 Оформить подписку", "create_subscription")
      .row()
      .text("🔙 Назад", "menu_subscription");

    await ctx.editMessageText(
      `ℹ️ <b>Подробнее о подписке</b>\n\n` +
        `• Скидка 10-30% на все товары\n` +
        `• Бесплатная доставка от 1000 руб.\n` +
        `• Специальные предложения\n` +
        `• Приоритетная поддержка\n` +
        `• Доступ к закрытым акциям\n\n` +
        `Стоимость: 299 руб./месяц`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );
  });
};
