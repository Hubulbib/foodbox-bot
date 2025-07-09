import { Subscription } from "../entities/subscription.js";
import { AppDataSource } from "../services/database.js";

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    minimumFractionDigits: 2,
  }).format(price);
};

export const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "🕒 Ожидает обработки",
    processing: "🛠️ В обработке",
    shipped: "🚚 Передан курьеру",
    delivered: "✅ Доставлен",
    cancelled: "❌ Отменен",
  };
  return statusMap[status] || status;
};

export const generateOrderNumber = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters.charAt(
    Math.floor(Math.random() * letters.length)
  );
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${randomLetter}${randomNumber}`;
};

export const checkSubscription = async (tgId: number): Promise<boolean> => {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  const subscriptions = await subscriptionRepo.find({
    where: { user: { telegramId: tgId.toString() } },
    relations: ["user"],
    order: { endDate: "DESC" },
  });

  if (subscriptions.length === 0) return false;

  const subscription = subscriptions[0];

  const now = new Date();
  const isActive = subscription.isActive && subscription.endDate > now;

  // Автоматически деактивируем просроченную подписку
  if (subscription.isActive && subscription.endDate <= now) {
    subscription.isActive = false;
    await subscriptionRepo.save(subscription);
  }

  return isActive;
};
