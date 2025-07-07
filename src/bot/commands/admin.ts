import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { AdminAction, AppContext } from "../../interfaces.js";
import { AppDataSource } from "../../services/database.js";
import { Product } from "../../entities/product.js";
import { Category } from "../../entities/category.js";
import {
  Order,
  ORDER_STATUS_EMOJI,
  OrderStatus,
} from "../../entities/order.js";
import { isAdmin } from "../bot.js";
import { User } from "../../entities/user.js";
import { Advice } from "../../entities/advice.js";
import { Subscription } from "../../entities/subscription.js";
import { checkSubscription } from "../../utils/helpers.js";

export const setupAdminCommands = async (bot: Bot<AppContext>) => {
  // Команда для входа в админ-панель
  bot.command("admin", async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply("У вас нет доступа к админ-панели");
      return;
    }

    const keyboard = new Keyboard()
      .text("📦 Управление товарами")
      .row()
      .text("📑 Управление категориями")
      .row()
      .text("📋 Управление заказами")
      .row()
      .text("❓ Управление советами")
      .row()
      .text("👥 Пользователи")
      .row()
      .text("◀️ Назад")
      .resized();

    await ctx.reply("Админ-панель:", {
      reply_markup: keyboard,
    });
  });

  bot.hears("👨‍💼 Админ-панель", async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply("У вас нет доступа к админ-панели");
      return;
    }

    const keyboard = new Keyboard()
      .text("📦 Управление товарами")
      .row()
      .text("📑 Управление категориями")
      .row()
      .text("📋 Управление заказами")
      .row()
      .text("❓ Управление советами")
      .row()
      .text("👥 Пользователи")
      .row()
      .text("◀️ Назад")
      .resized();

    await ctx.reply("Админ-панель:", {
      reply_markup: keyboard,
    });
  });

  // Управление товарами
  bot.hears("📦 Управление товарами", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const keyboard = new Keyboard()
      .text("➕ Добавить товар")
      .row()
      .text("📝 Редактировать товары")
      .row()
      .text("🔙 Назад");

    await ctx.reply("Управление товарами:\n\n" + "Выберите действие:", {
      reply_markup: keyboard,
    });
  });

  // Добавление товара
  bot.hears("➕ Добавить товар", async (ctx) => {
    if (!isAdmin(ctx)) return;

    ctx.session.adminAction = "add_product";
    ctx.session.productData = {};
    await ctx.reply("Введите название товара:");
  });

  // Редактирование товаров
  bot.hears("📝 Редактировать товары", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      relations: ["category"],
      order: { name: "ASC" },
    });

    if (products.length === 0) {
      await ctx.reply("Товаров пока нет");
      return;
    }

    const message = "Выберите товар для редактирования:\n\n";
    const keyboard = new InlineKeyboard();

    products.forEach((product) => {
      keyboard
        .text(
          `${product.name} (${product.price} руб.)`,
          `edit_product_${product.id}`
        )
        .row();
    });

    keyboard.text("🔙 Назад", "admin_products_back");

    await ctx.reply(message, {
      reply_markup: keyboard,
    });
  });

  // Обработчик выбора товара для редактирования
  bot.callbackQuery(/^edit_product_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const productId = parseInt(ctx.match[1]);
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["category"],
    });

    if (product) {
      const keyboard = new InlineKeyboard()
        .text("✏️ Название", `edit_product_name_${product.id}`)
        .text("📝 Описание", `edit_product_description_${product.id}`)
        .row()
        .text("💰 Цена", `edit_product_price_${product.id}`)
        .text("💳 Цена подписки", `edit_product_subscription_${product.id}`)
        .row()
        .text("🖼 Фото", `edit_product_photo_${product.id}`)
        .text("📑 Категория", `edit_product_category_${product.id}`)
        .row()
        .text("❌ Удалить товар", `delete_product_${product.id}`)
        .text("🔙 Назад", "admin_products_back");

      await ctx.editMessageText(
        `Редактирование товара:\n\n` +
          `Название: ${product.name}\n` +
          `Описание: ${product.description}\n` +
          `Цена: ${product.price} руб.\n` +
          `Цена подписки: ${product.subscriptionPrice} руб.\n` +
          `Категория: ${product.category?.name || "Не выбрана"}\n\n` +
          `Выберите, что хотите изменить:`,
        { reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery(/^delete_product_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const productId = parseInt(ctx.match[1]);

    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOneBy({ id: productId });

    if (!product) {
      await ctx.reply("Произошла ошибка. Товар не найден");
      return;
    }

    await productRepo.delete(productId);

    await ctx.editMessageText("✅ Товар успешно удален");
  });

  // Обработчики редактирования отдельных полей
  bot.callbackQuery(/^edit_product_(.+)_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const field = ctx.match[1];
    const productId = parseInt(ctx.match[2]);

    ctx.session.adminAction = `edit_product_${field}` as AdminAction;
    ctx.session.adminEditingProductId = productId;

    switch (field) {
      case "name":
        await ctx.editMessageText("Введите новое название товара:");
        break;
      case "description":
        await ctx.editMessageText("Введите новое описание товара:");
        break;
      case "price":
        await ctx.editMessageText("Введите новую цену товара (только число):");
        break;
      case "subscription":
        await ctx.editMessageText(
          "Введите новую цену подписки (только число):"
        );
        break;
      case "photo":
        await ctx.editMessageText("Отправьте новую фотографию товара:");
        break;
      case "category":
        const categoryRepo = AppDataSource.getRepository(Category);
        const categories = await categoryRepo.find();
        const keyboard = new InlineKeyboard();

        categories.forEach((category) => {
          keyboard
            .text(
              category.name,
              `set_product_category_${productId}_${category.id}`
            )
            .row();
        });

        await ctx.editMessageText("Выберите новую категорию:", {
          reply_markup: keyboard,
        });
        break;
    }
  });

  // Обработчик установки категории
  bot.callbackQuery(/^set_product_category_(\d+)_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const productId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);

    const productRepo = AppDataSource.getRepository(Product);
    const categoryRepo = AppDataSource.getRepository(Category);
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["category"],
    });
    const category = await categoryRepo.findOneBy({ id: categoryId });

    if (product && category) {
      product.category = category;
      await productRepo.save(product);

      await ctx.editMessageText(
        `✅ Категория товара "${product.name}" изменена на "${category.name}"`
      );
    }
  });

  // Управление категориями
  bot.hears("📑 Управление категориями", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const keyboard = new Keyboard()
      .text("➕ Добавить категорию")
      .row()
      .text("📝 Редактировать категории")
      .row()
      .text("🔙 Назад")
      .resized();

    await ctx.reply("Управление категориями:\n\n" + "Выберите действие:", {
      reply_markup: keyboard,
    });
  });

  bot.hears("➕ Добавить категорию", async (ctx) => {
    if (!isAdmin(ctx)) return;

    ctx.session.adminAction = "add_category";
    await ctx.reply("Введите название новой категории:");
  });

  bot.hears("📝 Редактировать категории", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const categoryRepo = AppDataSource.getRepository(Category);
    const categories = await categoryRepo.find({
      relations: { products: true },
    });

    const message = "📋 Список категорий:\n\n";

    const backKeyboard = new Keyboard().text("🔙 Назад").resized();

    await ctx.reply(message, {
      reply_markup: backKeyboard,
    });

    await Promise.all(
      categories.map(async (category) => {
        const keyboard = new InlineKeyboard()
          .text("✏️ Редактировать", `edit_category_${category.id}`)
          .text("🗑 Удалить", `delete_category_${category.id}`);

        const message = `${category.name} (товаров: ${category.products.length})\n`;

        await ctx.reply(message, {
          reply_markup: keyboard,
        });
      })
    );
  });

  // Обработчик редактирования категории
  bot.callbackQuery(/^edit_category_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const categoryId = parseInt(ctx.match[1]);
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOneBy({ id: categoryId });

    if (category) {
      ctx.session.adminAction = "edit_category";
      ctx.session.adminEditingCategoryId = categoryId;

      await ctx.editMessageText(
        `Редактирование категории "${category.name}"\nВведите новое название:`
      );
    }
  });

  // Обработчик удаления категории
  bot.callbackQuery(/^delete_category_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const categoryId = parseInt(ctx.match[1]);
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({
      where: { id: categoryId },
      relations: { products: true },
    });

    if (category) {
      // if (category.products.length > 0) {
      //   await ctx.editMessageText(
      //     `❌ Невозможно удалить категорию "${category.name}"\nВ ней есть товары (${category.products.length} шт.)`,
      //     {
      //       reply_markup: new InlineKeyboard()
      //         .text("🔙 Назад", "admin_categories")
      //     }
      //   );
      //   return;
      // }

      await categoryRepo.delete(categoryId);
      await ctx.reply(`✅ Категория "${category.name}" успешно удалена`);
    }
  });

  // Управление заказами
  bot.hears("📋 Управление заказами", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const keyboard = new InlineKeyboard()
      .text("🛠️ В обработке", "filter_orders_processing")
      .text("✅ Принят", "filter_orders_accepted")
      .row()
      .text("📦 Сборка", "filter_orders_assembling")
      .text("🚚 Передан курьеру", "filter_orders_courier")
      .row()
      .text("🚴 В пути", "filter_orders_transit")
      .text("✅ Доставлен", "filter_orders_delivered")
      .text("❌ Отменён", "filter_orders_canceled")
      .row()
      .text("📋 Все заказы", "filter_orders_all")
      .row()
      .text("🔙 Назад", "admin_back");

    await ctx.reply("Выберите статус заказов для просмотра:", {
      reply_markup: keyboard,
    });
  });

  // Обработчик фильтрации заказов
  bot.callbackQuery(/^filter_orders_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const getStatus = (): OrderStatus | null => {
      switch (ctx.match[1]) {
        case "processing":
          return OrderStatus.PROCESSING;
        case "accepted":
          return OrderStatus.ACCEPTED;
        case "assembling":
          return OrderStatus.ASSEMBLING;
        case "courier":
          return OrderStatus.TRANSFERRED_TO_COURIER;
        case "transit":
          return OrderStatus.IN_TRANSIT;
        case "delivered":
          return OrderStatus.DELIVERED;
        case "canceled":
          return OrderStatus.CANCELED;
        case "all":
          return null;
      }
    };

    const status = getStatus();
    const orderRepo = AppDataSource.getRepository(Order);

    const where = status === null ? {} : { status };

    const orders = await orderRepo.find({
      where,
      relations: ["user", "items", "items.product"],
      order: { createdAt: "DESC" },
      take: 10,
    });

    const message = `Заказы${
      status === null ? "" : ` (статус: ${status})`
    }:\n\n`;

    await ctx.reply(message);

    for (const order of orders) {
      const statusEmoji = ORDER_STATUS_EMOJI[order.status];

      const message =
        `Заказ #${order.orderNumber}\n` +
        `Время: ${new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(order.createdAt)}\n` +
        `Статус: ${statusEmoji} ${order.status}\n` +
        `Сумма: ${order.totalAmount} руб.\n` +
        `Клиент: ${order.customerName}\n` +
        `Телефон: ${order.customerPhone}\n` +
        `Адрес: ${order.deliveryAddress}\n\n` +
        `ЖК: ${order.residentialComplex}\n\n`;

      // Добавляем кнопки для изменения статуса
      const statusKeyboard = new InlineKeyboard();
      const availableStatuses = {
        PROCESSING: "🛠️ В обработке",
        ACCEPTED: "✅ Принят",
        ASSEMBLING: "📦 Сборка",
        TRANSFERRED_TO_COURIER: "🚚 Передан куьеру",
        IN_TRANSIT: "🚴 В пути",
        DELIVERED: "✅ Доставлен",
        CANCELED: "❌ Отменен",
      };

      Object.entries(availableStatuses).forEach(
        ([statusKey, statusText], ind) => {
          if (statusKey !== order.status) {
            statusKeyboard.text(
              statusText,
              `change_status_${order.id}_${statusKey}`
            );
            if (ind % 2 !== 0) statusKeyboard.row();
          }
        }
      );

      statusKeyboard.row().text("🔙 Назад", "admin_back");

      await ctx.reply(message, {
        reply_markup: statusKeyboard,
      });
    }
  });

  // Обработчик изменения статуса заказа
  bot.callbackQuery(/^change_status_(\d+)_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const orderId = parseInt(ctx.match[1]);
    const newStatus = OrderStatus[ctx.match[2]];

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOneBy({ id: orderId });

    if (order) {
      order.status = newStatus;
      await orderRepo.save(order);

      const statusEmoji = ORDER_STATUS_EMOJI[newStatus];

      await ctx.editMessageText(
        `✅ Статус заказа #${order.orderNumber} изменён на: ${statusEmoji} ${newStatus}`
      );
    }
  });

  bot.hears("🔙 Назад", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const keyboard = new Keyboard()
      .text("📦 Управление товарами")
      .row()
      .text("📑 Управление категориями")
      .row()
      .text("📋 Управление заказами")
      .row()
      .text("❓ Управление советами")
      .row()
      .text("👥 Пользователи")
      .row()
      .text("◀️ Назад")
      .resized();

    await ctx.reply("Админ-панель:", {
      reply_markup: keyboard,
    });
  });

  // Добавляем обработчик выбора категории
  bot.callbackQuery(/^admin_set_category_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const categoryId = parseInt(ctx.match[1]);
    const productData = ctx.session.productData;

    if (productData) {
      const productRepo = AppDataSource.getRepository(Product);
      const categoryRepo = AppDataSource.getRepository(Category);
      const category = await categoryRepo.findOneBy({ id: categoryId });

      if (category) {
        const product = productRepo.create({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          subscriptionPrice: productData.subscriptionPrice,
          imageUrl: productData.imageUrl,
          category: category,
        });

        await productRepo.save(product);

        // Очищаем данные сессии
        ctx.session.adminAction = undefined;
        ctx.session.productData = undefined;

        const keyboard = new Keyboard().text("🔙 Назад").resized();

        await ctx.reply(
          `✅ Товар "${product.name}" успешно добавлен в категорию "${category.name}"`,
          { reply_markup: keyboard }
        );
      }
    }
  });

  // Обработчик кнопки "Назад" в списке товаров
  bot.callbackQuery("admin_products_back", async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const keyboard = new Keyboard()
      .text("➕ Добавить товар")
      .row()
      .text("📝 Редактировать товары")
      .row()
      .text("🔙 Назад");

    await ctx.reply("Управление товарами:\n\nВыберите действие:", {
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery("admin_back", async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const keyboard = new Keyboard()
      .text("📦 Управление товарами")
      .row()
      .text("📑 Управление категориями")
      .row()
      .text("📋 Управление заказами")
      .row()
      .text("❓ Управление советами")
      .row()
      .text("👥 Пользователи")
      .row()
      .text("◀️ Назад")
      .resized();

    await ctx.reply("Админ-панель", {
      reply_markup: keyboard,
    });
  });

  bot.hears("❓ Управление советами", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const adviceRepo = AppDataSource.getRepository(Advice);
    const advices = await adviceRepo.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: 10,
      skip: 0,
    });
    const totalAdvices = await adviceRepo.count();

    let message = "Последние советы пользователей:\n\n";
    for (const advice of advices) {
      message += `📝 ${advice.text}\n👤 ${
        advice.user?.name || "Неизвестно"
      } | ${advice.createdAt.toLocaleString("ru-RU")}\n\n`;
    }

    const keyboard = new InlineKeyboard();
    if (totalAdvices > 10) {
      keyboard.text("📥 Показать еще", "load_more_advices_10");
    }
    keyboard.text("🔙 Назад", "admin_back");

    await ctx.reply(message, {
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery(/^load_more_advices_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const skip = parseInt(ctx.match[1]);
    const adviceRepo = AppDataSource.getRepository(Advice);
    const advices = await adviceRepo.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: 10,
      skip,
    });
    const totalAdvices = await adviceRepo.count();

    let message = "Последние советы пользователей:\n\n";
    for (const advice of advices) {
      message += `📝 ${advice.text}\n👤 ${
        advice.user?.name || "Неизвестно"
      } | ${advice.createdAt.toLocaleString("ru-RU")}\n\n`;
    }

    const keyboard = new InlineKeyboard();
    if (totalAdvices > skip + 10) {
      keyboard.text("📥 Показать еще", `load_more_advices_${skip + 10}`);
    }
    keyboard.text("🔙 Назад", "admin_back");

    await ctx.editMessageText(message, {
      reply_markup: keyboard,
    });
  });

  bot.hears("👥 Пользователи", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
      where: { subscription: { isActive: true } },
      relations: ["subscription"],
      order: { id: "DESC" },
      take: 10,
      skip: 0,
    });

    if (users.length === 0) {
      const keyboard = new InlineKeyboard().text("🔙 Назад", "admin_back");

      await ctx.reply("Пользователей с активной подпиской пока нет", {
        reply_markup: keyboard,
      });
      return;
    }

    let message = "*Пользователи с активной подпиской:*\n\n";

    for (const user of users) {
      const subscriptionRepo = AppDataSource.getRepository(Subscription);
      const subscription = (
        await subscriptionRepo.findOne({
          where: { userId: user.id },
          order: { endDate: "DESC" },
        })
      )[0];

      if (subscription && (await checkSubscription(user.id))) {
        const subscriptionEndDate =
          new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(subscription.endDate) || "Нет данных";
        const daysLeft = user.subscription
          ? Math.ceil(
              (subscription.endDate.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        message +=
          `👤 *Пользователь #${user.id}*\n` +
          `📱 Telegram ID: ${user.telegramId}\n` +
          `👤 Имя: ${user.name || "Не указано"}\n` +
          `📞 Телефон: ${user.phone || "Не указан"}\n` +
          `📍 Адрес: ${user.address || "Не указан"}\n` +
          `📅 Подписка до: ${subscriptionEndDate}\n` +
          `⏳ Осталось дней: ${daysLeft}\n\n`;
      }
    }

    const keyboard = new InlineKeyboard();

    // Если есть еще пользователи, добавляем кнопку "Показать еще"
    const totalUsers = await userRepo.count({
      where: { subscription: { isActive: true } },
    });

    if (totalUsers > 10) {
      keyboard.text("📥 Показать еще", "load_more_users_10");
    }

    keyboard.text("🔙 Назад", "admin_back");

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });

  // Добавляем обработчик для кнопки "Показать еще"
  bot.callbackQuery(/^load_more_users_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    await ctx.answerCallbackQuery();

    const skip = parseInt(ctx.match[1]);
    const userRepo = AppDataSource.getRepository(User);

    const users = await userRepo.find({
      where: { subscription: { isActive: true } },
      relations: ["subscription"],
      order: { id: "DESC" },
      take: 10,
      skip: skip,
    });

    let message = "*Пользователи с активной подпиской:*\n\n";

    for (const user of users) {
      const subscriptionRepo = AppDataSource.getRepository(Subscription);
      const subscription = (
        await subscriptionRepo.findOne({
          where: { userId: user.id },
          order: { endDate: "DESC" },
        })
      )[0];

      if (subscription && (await checkSubscription(user.id))) {
        const subscriptionEndDate =
          new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(subscription.endDate) || "Нет данных";
        const daysLeft = user.subscription
          ? Math.ceil(
              (subscription.endDate.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        message +=
          `👤 *Пользователь #${user.id}*\n` +
          `📱 Telegram ID: ${user.telegramId}\n` +
          `👤 Имя: ${user.name || "Не указано"}\n` +
          `📞 Телефон: ${user.phone || "Не указан"}\n` +
          `📍 Адрес: ${user.address || "Не указан"}\n` +
          `📅 Подписка до: ${subscriptionEndDate}\n` +
          `⏳ Осталось дней: ${daysLeft}\n\n`;
      }
    }

    const keyboard = new InlineKeyboard();

    // Проверяем, есть ли еще пользователи
    const totalUsers = await userRepo.count({
      where: { subscription: { isActive: true } },
    });

    if (totalUsers > skip + 10) {
      keyboard.text("📥 Показать еще", `load_more_users_${skip + 10}`);
    }

    keyboard.text("🔙 Назад", "admin_back");

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  });
};
