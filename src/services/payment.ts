import { Bot } from "grammy";
import { Order, OrderStatus } from "../entities/order.js";
import { AppContext } from "../interfaces.js";
import { AppDataSource } from "./database.js";
import { NotificationService } from "./notification.js";
import { User } from "../entities/user.js";
import { Subscription } from "../entities/subscription.js";

export class PaymentService {
  constructor(
    private bot: Bot<AppContext>,
    private notificationService: NotificationService
  ) {}

  async createInvoiceForSubscription(ctx: AppContext) {
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
      console.error("Invoice creation error:", error);
      await ctx.reply("Произошла ошибка при создании платежа");
    }
  }

  async processSubscriptionPayment(
    ctx: AppContext,
    paymentInfo: any
  ): Promise<boolean> {
    const userRepo = AppDataSource.getRepository(User);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    try {
      const user = await userRepo.findOne({
        where: { telegramId: ctx.from?.id.toString() },
      });
      if (!user) throw new Error("User not found");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      let subscription = await subscriptionRepo.findOne({ where: { user } });
      if (!subscription) {
        subscription = subscriptionRepo.create({
          user,
          startDate,
          endDate,
          isActive: true,
        });
      } else {
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.isActive = true;
      }

      await subscriptionRepo.save(subscription);
      ctx.session.hasSubscription = true;

      // Отправляем уведомление об успешной оплате
      await this.notificationService.sendNotification(
        +user.telegramId,
        `🎉 Подписка FOODBOX Premium успешно оформлена!\n\n` +
          `Действует до: ${endDate.toLocaleDateString()}\n` +
          `Теперь вы получаете специальные цены на все товары.`
      );

      return true;
    } catch (error) {
      console.error("Subscription payment error:", error);
      return false;
    }
  }

  async createInvoiceForOrder(ctx: AppContext, order: Order) {
    try {
      // Создаем описание заказа
      const orderDescription =
        `Заказ #${order.orderNumber}\n` +
        `Доставка: ${order.deliveryAddress}\n` +
        `Телефон: ${order.customerPhone}`;

      // Создаем инвойс для оплаты
      await ctx.api.sendInvoice(
        ctx.chat.id,
        `Заказ #${order.orderNumber}`,
        orderDescription,
        `order_${order.id}`,
        process.env.PAYMENT_PROVIDER_TOKEN!,
        [
          {
            label: `Заказ #${order.orderNumber}`,
            amount: Math.round(order.totalAmount * 100), // Конвертируем в копейки
          },
        ],
        {
          provider_data: JSON.stringify({
            order_id: order.id,
            order_number: order.orderNumber,
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
      console.error("Invoice creation error:", error);
      await ctx.reply("Произошла ошибка при создании платежа");
    }
  }

  async processOrderPayment(ctx: AppContext, paymentInfo: any) {
    const orderRepo = AppDataSource.getRepository(Order);
    const orderId = parseInt(paymentInfo.invoice_payload.split("_")[1]);

    try {
      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ["user"],
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Обновляем статус заказа
      order.status = OrderStatus.ACCEPTED;
      order.paymentId = paymentInfo.telegram_payment_charge_id;
      await orderRepo.save(order);

      // Отправляем уведомление пользователю
      await this.notificationService.sendNotification(
        +order.user.telegramId,
        `✅ Заказ #${order.orderNumber} успешно оплачен!\n\n` +
          `Мы начали его обработку. О статусе заказа вы будете получать уведомления.`
      );

      return true;
    } catch (error) {
      console.error("Payment processing error:", error);
      return false;
    }
  }
}
