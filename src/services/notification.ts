import { Bot } from "grammy";
import { AppContext } from "../interfaces.js";
import { Order } from "../entities/order.js";
import { getOrderStatusText } from "../utils/helpers.js";

export class NotificationService {
  constructor(private bot: Bot<AppContext>) {}

  async sendNotification(chatId: number, message: string) {
    try {
      await this.bot.api.sendMessage(chatId, message);
    } catch (error) {
      console.error("Ошибка отправки уведомления:", error);
    }
  }

  async sendOrderStatusUpdate(order: Order) {
    const statusEmoji = {
      pending: "",
      processing: "🛠️",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    }[order.status];

    const message =
      `Статус вашего заказа #${order.orderNumber} изменен:\n` +
      `${statusEmoji} ${getOrderStatusText(order.status)}\n\n` +
      `Сумма заказа: ${order.totalAmount} руб.\n` +
      `Адрес доставки: ${order.deliveryAddress}`;

    await this.sendNotification(+order.user.telegramId, message);
  }

  async sendDeliveryNotification(order: Order) {
    const message =
      `🚚 Ваш заказ #${order.orderNumber} в пути!\n\n` +
      `Ожидаемое время доставки: 30-60 минут\n` +
      `Адрес доставки: ${order.deliveryAddress}\n\n` +
      `Сумма к оплате: ${order.totalAmount} руб.`;

    await this.sendNotification(+order.user.telegramId, message);
  }

  async sendPaymentNotification(order: Order, paymentUrl: string) {
    const message =
      `💳 Оплата заказа #${order.orderNumber}\n\n` +
      `Сумма к оплате: ${order.totalAmount} руб.\n\n` +
      `Для оплаты перейдите по ссылке:\n` +
      `${paymentUrl}\n\n` +
      `Ссылка действительна 30 минут.`;

    await this.sendNotification(+order.user.telegramId, message);
  }
}
