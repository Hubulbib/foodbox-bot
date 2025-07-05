import { Router } from "express";
import { Bot } from "grammy";

const router = Router();

// Добавляем новый эндпоинт для получения URL изображения
router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

    // Получаем информацию о файле
    const file = await bot.api.getFile(fileId);

    // Формируем URL для скачивания файла
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    res.json({ url: fileUrl });
  } catch (error) {
    console.error("Error getting image URL:", error);
    res.status(500).json({ error: "Failed to get image URL" });
  }
});

export const imageRouter = router;
