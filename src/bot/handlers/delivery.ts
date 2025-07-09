import { Bot } from "grammy";
import { AppContext } from "../../interfaces.js";
import { AppDataSource } from "../../services/database.js";
import { Order, OrderStatus } from "../../entities/order.js";
import { NotificationService } from "../../services/notification.js";

export const setupDeliveryHandlers = (
  bot: Bot<AppContext>,
  notificationService: NotificationService
) => {
  // Обработка изменения статуса заказа
  bot.callbackQuery(/^order_status_(\d+)_(\w+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1]);
    const newStatus = ctx.match[2] as OrderStatus;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ["user"],
    });

    if (!order) {
      await ctx.answerCallbackQuery("Заказ не найден");
      return;
    }

    order.status = newStatus;
    await orderRepo.save(order);

    // Уведомляем пользователя
    if (order.user.telegramId) {
      const statusEmoji = {
        processing: "🛠️",
        shipped: "🚚",
        delivered: "✅",
        cancelled: "❌",
      }[newStatus];

      await notificationService.sendNotification(
        +order.user.telegramId,
        `Статус вашего заказа #${order.orderNumber} изменен:\n` +
          `${statusEmoji} ${newStatus}`
      );
    }

    await ctx.answerCallbackQuery("Статус заказа обновлен");
  });
};
