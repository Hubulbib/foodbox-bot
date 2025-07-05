import { Bot } from "grammy";
import { AppContext } from "../../interfaces.js";
import { PaymentService } from "../../services/payment.js";
import { AppDataSource } from "../../services/database.js";
import { Order } from "../../entities/order.js";
export const setupPaymentHandlers = (
  bot: Bot<AppContext>,
  paymentService: PaymentService
) => {
  // Обработка предварительного запроса
  bot.on("pre_checkout_query", async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  // Успешный платеж
  bot.on("message:successful_payment", async (ctx) => {
    const paymentInfo = ctx.message?.successful_payment;
    if (!paymentInfo) return;

    if (paymentInfo.invoice_payload.startsWith("subscription_")) {
      const success = await paymentService.processSubscriptionPayment(
        ctx,
        paymentInfo
      );

      if (success) {
        await ctx.reply(
          "🎉 Подписка успешно оформлена!\n\n" +
            "Теперь вы получаете специальные цены на все товары."
        );
      } else {
        await ctx.reply(
          "⚠️ Произошла ошибка при обработке подписки. Свяжитесь с поддержкой."
        );
      }
    } else if (paymentInfo.invoice_payload.startsWith("order_")) {
      const success = await paymentService.processOrderPayment(
        ctx,
        paymentInfo
      );

      if (success) {
        await ctx.reply(
          "✅ Заказ успешно оплачен!\n\n" +
            "Мы начали его обработку. О статусе заказа вы будете получать уведомления."
        );
      } else {
        await ctx.reply(
          "⚠️ Произошла ошибка при обработке платежа. Свяжитесь с поддержкой."
        );
      }
    }
  });

  // Обработка кнопки оплаты заказа
  bot.callbackQuery(/^pay_order_(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1]);

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ["user"],
    });

    if (!order) {
      await ctx.answerCallbackQuery("Заказ не найден");
      return;
    }

    try {
      await paymentService.createInvoiceForOrder(ctx, order);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка создания платежа:", error);
      await ctx.answerCallbackQuery("Ошибка создания платежа");
    }
  });

  // Обработка кнопки оформления подписки
  bot.callbackQuery("create_subscription", async (ctx) => {
    await ctx.answerCallbackQuery();

    try {
      await ctx.api.sendInvoice(
        ctx.chat.id,
        "FOODBOX Premium подписка",
        "Подписка на 1 месяц со скидками на все товары",
        "subscription_1_month",
        process.env.PAYMENT_PROVIDER_TOKEN!,
        [{ label: "Подписка на 1 месяц", amount: 29900 }], // 299 рублей в копейках
        {
          provider_data: JSON.stringify({
            subscription_type: "premium_monthly",
          }),
          photo_url: "https://your-logo-url.com/logo.png", // URL вашего логотипа
          photo_width: 500,
          photo_height: 500,
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          is_flexible: false,
        }
      );
    } catch (error) {
      console.error("Ошибка создания платежа:", error);
      await ctx.reply(
        "Произошла ошибка при создании платежа. Попробуйте позже."
      );
    }
  });
};
