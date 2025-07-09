import { parse } from "@telegram-apps/init-data-node";
import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../services/database.js";
import { User } from "../entities/user.js";
import { Cart } from "../entities/cart.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const initData = req.headers["x-telegram-init-data"] as string;

  if (!initData) {
    res.status(401).end();
    return next();
  }

  try {
    // Декодируем URL-encoded строку перед парсингом
    const decodedInitData = decodeURIComponent(initData);
    const parsedData = parse(decodedInitData);

    if (!parsedData.user) {
      res.status(401).end();
      return next();
    }

    const userRepo = AppDataSource.getRepository(User);
    const cartRepo = AppDataSource.getRepository(Cart);

    let user = await userRepo.findOne({
      where: { telegramId: parsedData.user.id.toString() },
    });
    if (!user) {
      user = userRepo.create({
        telegramId: parsedData.user.id.toString(),
        name: parsedData.user.first_name,
      });
      await userRepo.save(user);
    }

    let cart = await cartRepo.findOne({ where: { user: { id: user.id } } });
    if (!cart) {
      cart = cartRepo.create({ user });
      await cartRepo.save(cart);
    }

    req["user"] = parsedData.user;
    next();
  } catch (err) {
    res.status(401).json({ err });
    return next(err);
  }
};
