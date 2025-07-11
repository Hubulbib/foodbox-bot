import { type Request, type Response, Router } from "express";
import { AppDataSource } from "../services/database.js";
import { Product } from "../entities/product.js";
import { ImageService } from "../services/image.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const productRepo = AppDataSource.getRepository(Product);

  let productList = await productRepo.find({ relations: { category: true } });
  productList = await Promise.all(
    productList.map(async (el) => ({
      ...el,
      imageUrl: await ImageService.getImage(el.imageUrl),
    }))
  );

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
