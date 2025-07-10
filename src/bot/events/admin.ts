import { InlineKeyboard, Keyboard } from "grammy";
import { Category } from "../../entities/category.js";
import { Product } from "../../entities/product.js";
import { AppContext } from "../../interfaces.js";
import { AppDataSource } from "../../services/database.js";

export const adminEventsInit = async (
  ctx: AppContext,
  isAdmin: (ctx: AppContext) => boolean
) => {
  if (!isAdmin(ctx) || !ctx.session.adminAction) return;

  switch (ctx.session.adminAction) {
    case "add_product":
      await handleAddProduct(ctx);
      break;
    case "add_category":
      await handleAddCategory(ctx);
      break;
    case "edit_category":
      await handleEditCategory(ctx);
      break;
    case "edit_product_name":
    case "edit_product_description":
    case "edit_product_price":
    case "edit_product_subscription":
    case "edit_product_photo":
    case "edit_product_pername":
      await handleEditProduct(ctx);
      break;
  }
};

async function handleAddProduct(ctx: AppContext) {
  const categoryRepo = AppDataSource.getRepository(Category);

  if (!ctx.session.productData) {
    ctx.session.productData = {};
  }

  const productData = ctx.session.productData;

  // Определяем текущий шаг добавления товара
  if (!productData.name) {
    // Шаг 1: Название товара
    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, введите название товара:");
      return;
    }
    productData.name = ctx.message.text;
    await ctx.reply("Введите описание товара:");
  } else if (!productData.description) {
    // Шаг 2: Описание товара
    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, введите описание товара:");
      return;
    }
    productData.description = ctx.message.text;
    await ctx.reply("Введите цену товара (только число):");
  } else if (!productData.price) {
    // Шаг 3: Цена товара
    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, введите цену товара (только число):");
      return;
    }
    const price = parseFloat(ctx.message.text);
    if (isNaN(price)) {
      await ctx.reply("Пожалуйста, введите корректное число для цены:");
      return;
    }
    productData.price = price;
    await ctx.reply("Введите цену подписки (только число):");
  } else if (!productData.subscriptionPrice) {
    // Шаг 4: Цена подписки
    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, введите цену подписки (только число):");
      return;
    }
    const subscriptionPrice = parseFloat(ctx.message.text);
    if (isNaN(subscriptionPrice)) {
      await ctx.reply(
        "Пожалуйста, введите корректное число для цены подписки:"
      );
      return;
    }
    productData.subscriptionPrice = subscriptionPrice;
    await ctx.reply(
      "Введите единицу измерения товара (только название: 1 кг, 100 г, 1 лоток и тд):"
    );
  } else if (!productData.pername) {
    // Шаг 5: Единица измерения
    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, введите единицу измерения:");
      return;
    }
    productData.pername = ctx.message.text;

    await ctx.reply("Отправьте фотографию товара: ");
  } else if (!productData.imageUrl) {
    // Шаг 6: Фотография товара
    if (!ctx.message.photo) {
      await ctx.reply("Пожалуйста, отправьте фотографию товара:");
      return;
    }
    // Получаем file_id последней (самой большой) фотографии
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    productData.imageUrl = photo.file_id;

    // Шаг 7: Выбор категории
    const categories = await categoryRepo.find();
    const keyboard = new InlineKeyboard();

    categories.forEach((category) => {
      keyboard.text(category.name, `admin_set_category_${category.id}`).row();
    });

    await ctx.reply("Выберите категорию для товара:", {
      reply_markup: keyboard,
    });
  }
}

async function handleAddCategory(ctx: AppContext) {
  const categoryRepo = AppDataSource.getRepository(Category);

  const category = categoryRepo.create({
    name: ctx.message.text,
  });

  await categoryRepo.save(category);
  ctx.session.adminAction = undefined;

  const keyboard = new Keyboard().text("🔙 Назад").resized();

  await ctx.reply(`Категория "${category.name}" создана`, {
    reply_markup: keyboard,
  });
}

// Функция обработки редактирования категории
async function handleEditCategory(ctx: AppContext) {
  if (!ctx.session.adminEditingCategoryId) return;

  const categoryRepo = AppDataSource.getRepository(Category);
  const category = await categoryRepo.findOneBy({
    id: ctx.session.adminEditingCategoryId,
  });

  if (category) {
    const oldName = category.name;
    category.name = ctx.message.text;
    await categoryRepo.save(category);

    ctx.session.adminAction = undefined;
    ctx.session.adminEditingCategoryId = undefined;

    const keyboard = new Keyboard().text("🔙 Назад").resized();

    await ctx.reply(
      `✅ Категория переименована:\n"${oldName}" → "${category.name}"`,
      { reply_markup: keyboard }
    );
  }
}

// Функция обработки редактирования товара
async function handleEditProduct(ctx: AppContext) {
  if (!ctx.session.adminEditingProductId) return;

  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({
    where: { id: ctx.session.adminEditingProductId },
    relations: ["category"],
  });

  if (!product) return;

  const action = ctx.session.adminAction;

  if (action === "edit_product_name" && ctx.message.text) {
    product.name = ctx.message.text;
  } else if (action === "edit_product_description" && ctx.message.text) {
    product.description = ctx.message.text;
  } else if (action === "edit_product_price" && ctx.message.text) {
    const price = parseFloat(ctx.message.text);
    if (isNaN(price)) {
      await ctx.reply("Пожалуйста, введите корректное число для цены:");
      return;
    }
    product.price = price;
  } else if (action === "edit_product_subscription" && ctx.message.text) {
    const subscriptionPrice = parseFloat(ctx.message.text);
    if (isNaN(subscriptionPrice)) {
      await ctx.reply(
        "Пожалуйста, введите корректное число для цены подписки:"
      );
      return;
    }
    product.subscriptionPrice = subscriptionPrice;
  } else if (action === "edit_product_pername" && ctx.message.text) {
    product.pername = ctx.message.text;
  } else if (action === "edit_product_photo" && ctx.message.photo) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    product.imageUrl = photo.file_id;
  } else {
    await ctx.reply("Пожалуйста, отправьте корректные данные:");
    return;
  }

  await productRepo.save(product);
  ctx.session.adminAction = undefined;
  ctx.session.adminEditingProductId = undefined;

  const keyboard = new InlineKeyboard()
    .text("✏️ Продолжить редактирование", `edit_product_${product.id}`)
    .row()
    .text("🔙 Назад к списку", "admin_products_back");

  await ctx.reply(`✅ Товар "${product.name}" успешно обновлен`, {
    reply_markup: keyboard,
  });
}
