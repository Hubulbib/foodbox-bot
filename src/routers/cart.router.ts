import { type Request, type Response, Router } from "express";
import { AppDataSource } from "../services/database.js";
import { Product } from "../entities/product.js";
import { Cart } from "../entities/cart.js";
import { User } from "../entities/user.js";
import { CartItem } from "../entities/cart-item.js";
import { ImageService } from "../services/image.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);
  const cartRepo = AppDataSource.getRepository(Cart);

  const user = await userRepo.findOne({ where: { telegramId: userData?.id } });
  if (!user) {
    res.status(401).end();
    return;
  }

  let cart = await cartRepo.findOne({
    where: { user: { id: user.id } },
    relations: ["items", "items.product", "items.product.category"],
  });

  cart["items"] = await Promise.all(
    cart.items.map(async (el) => ({
      ...el,
      product: {
        ...el.product,
        imageUrl: await ImageService.getImage(el.product.imageUrl),
      },
    }))
  );

  res.json({ data: cart?.items || [] });
});

router.patch("/product/:id/inc", async (req: Request, res: Response) => {
  const { id } = req.params;

  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);
  const cartRepo = AppDataSource.getRepository(Cart);
  const cartItemRepo = AppDataSource.getRepository(CartItem);

  const user = await userRepo.findOne({ where: { telegramId: userData.id } });
  if (!user) return;

  const cart = await cartRepo.findOne({
    where: { user: { id: user.id } },
  });

  if (!cart) return;

  let cartItem = await cartItemRepo.findOne({
    where: { product: { id: +id }, cart: { id: cart.id } },
    relations: ["product"],
  });

  if (!cartItem) {
    cartItem = cartItemRepo.create({ cart, productId: +id, quantity: 1 });
    await cartItemRepo.save(cartItem);
  } else {
    await cartItemRepo.save({ ...cartItem, quantity: cartItem.quantity + 1 });
  }

  cartItem = await cartItemRepo.findOne({
    where: { id: cartItem.id },
    relations: ["product"],
  });

  res.json({ data: cartItem }).end();
});

router.patch("/product/:id/dec", async (req: Request, res: Response) => {
  const { id } = req.params;

  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);
  const cartRepo = AppDataSource.getRepository(Cart);
  const cartItemRepo = AppDataSource.getRepository(CartItem);

  const user = await userRepo.findOne({ where: { telegramId: userData.id } });
  if (!user) return;

  const cart = await cartRepo.findOne({
    where: { user: { id: user.id } },
  });

  if (!cart) return;

  // Проверяем, принадлежит ли товар корзине пользователя
  const cartItem = await cartItemRepo.findOne({
    where: { product: { id: +id }, cart: { id: cart.id } },
    relations: ["product"],
  });

  if (!cartItem) {
    res.status(400).end();
    return;
  }

  if (cartItem.quantity > 1) {
    await cartItemRepo.save({ ...cartItem, quantity: cartItem.quantity - 1 });
  } else {
    // Если количество 1, удаляем товар полностью
    await cartItemRepo.delete({ productId: +id });
  }
  res.json({ data: cartItem }).end();
});

router.delete("/product/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);
  const cartRepo = AppDataSource.getRepository(Cart);
  const cartItemRepo = AppDataSource.getRepository(CartItem);

  const user = await userRepo.findOne({ where: { telegramId: userData.id } });
  if (!user) return;

  const cart = await cartRepo.findOne({
    where: { user: { id: user.id } },
    relations: ["items"],
  });

  if (!cart) return;

  // Проверяем, принадлежит ли товар корзине пользователя
  const cartItem = await cartItemRepo.findOne({
    where: { id: +id, cart: { id: cart.id } },
    relations: ["product"],
  });

  if (!cartItem) {
    res.status(400).end();
    return;
  }

  // Удаляем товар из корзины
  await cartItemRepo.delete(+id);

  res.status(200).end();
});

export const cartRouter = router;
