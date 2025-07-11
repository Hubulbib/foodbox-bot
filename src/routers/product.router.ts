import { type Request, type Response, Router } from "express";
import { AppDataSource } from "../services/database.js";
import { Product } from "../entities/product.js";
import { ImageService } from "../services/image.js";

const router = Router();

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const productRepo = AppDataSource.getRepository(Product);

  const product = await productRepo.findOne({
    where: { id: +id },
    relations: { category: true },
  });

  product.imageUrl = await ImageService.getImage(product.imageUrl);

  res.json({ data: product });
});

export const productRouter = router;
