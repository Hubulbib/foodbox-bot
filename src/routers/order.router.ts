import { type Request, type Response, Router } from "express";
import { AppDataSource } from "../services/database.js";
import { User } from "../entities/user.js";
import { Order, OrderStatus } from "../entities/order.js";
import { Cart } from "../entities/cart.js";
import { OrderItem } from "../entities/order-item.js";
import { checkSubscription } from "../utils/helpers.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const userData = req["user"];
  const userRepo = AppDataSource.getRepository(User);
  const orderRepo = AppDataSource.getRepository(Order);

  const user = await userRepo.findOne({
    where: { telegramId: userData.id },
    relations: ["orders"],
  });

  const orders = await orderRepo.find({
    where: { user: { id: user.id } },
    order: { createdAt: "DESC" },
    relations: ["items", "items.product"],
  });

  res.json({ data: orders });
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const userData = req["user"];
  const userRepo = AppDataSource.getRepository(User);
  const orderRepo = AppDataSource.getRepository(Order);

  const user = await userRepo.findOne({
    where: { telegramId: userData.id },
    relations: ["orders"],
  });

  const order = await orderRepo.findOne({
    where: { user: { id: user.id }, id: +id },
    relations: ["items", "items.product", "items.product.category"],
  });

  res.json({ data: order });
});

router.post("/", async (req: Request, res: Response) => {
  const { name, phone, address, residentialComplex } = req.body;

  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);
  const cartRepo = AppDataSource.getRepository(Cart);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);

  const user = await userRepo.findOne({ where: { telegramId: userData.id } });
  if (!user) {
    res.status(401).end();
    return;
  }

  const cart = await cartRepo.findOne({
    where: { user: { id: user.id } },
    relations: ["items", "items.product"],
  });

  if (cart.items.length === 0) {
    res.status(400).end();
    return;
  }

  const hasSubscription = await checkSubscription(user.id);

  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      (hasSubscription ? item.product.subscriptionPrice : item.product.price) *
        item.quantity,
    0
  );

  // Создаем заказ
  const order = orderRepo.create({
    orderNumber: `FB${Date.now().toString().slice(-6)}`,
    status: OrderStatus.PROCESSING,
    totalAmount: total,
    deliveryAddress: address,
    customerPhone: phone,
    customerName: name,
    residentialComplex: residentialComplex,
    user,
  });

  await orderRepo.save(order);

  // Добавляем товары в заказ
  for (const item of cart.items) {
    const orderItem = orderItemRepo.create({
      order,
      product: item.product,
      quantity: item.quantity,
      price: hasSubscription
        ? item.product.subscriptionPrice
        : item.product.price,
    });
    await orderItemRepo.save(orderItem);
  }

  // Очищаем корзину
  await cartRepo.remove(cart);
  await cartRepo.save(cartRepo.create({ userId: user.id }));

  res.status(201).end();
});

export const orderRouter = router;
