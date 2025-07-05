import { Router, Request, Response } from "express";
import { AppDataSource } from "../services/database.js";
import { User } from "../entities/user.js";
import { checkSubscription } from "../utils/helpers.js";

const router = Router();

router.get("/check", async (req: Request, res: Response) => {
  const userData = req["user"];

  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { telegramId: userData?.id } });
  if (!user) {
    res.status(401).end();
    return;
  }

  const check = await checkSubscription(user.id);

  res.json({ data: { isSubscriptionActive: check } });
});

export const subscriptionRouter = router;
