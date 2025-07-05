import { type Request, type Response, Router } from "express";
import { AppDataSource } from "../services/database.js";
import { Product } from "../entities/product.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const productRepo = AppDataSource.getRepository(Product);

  const productList = await productRepo.find({ relations: { category: true } });

  const grouped = productList.reduce((acc, product) => {
    const categoryName = product.category?.name || "Без категории";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, typeof productList>);

  res.json({ data: grouped });
});

export const catalogRouter = router;
