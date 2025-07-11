import { Router } from "express";
import { Bot } from "grammy";

const router = Router();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

const imageCache = new Map();

// Добавляем новый эндпоинт для получения URL изображения
router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Проверка кэша
    if (imageCache.has(fileId)) {
      res.json({ url: imageCache.get(fileId) });
      return;
    }

    // Получаем информацию о файле
    const file = await bot.api.getFile(fileId);

    // Формируем URL для скачивания файла
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    imageCache.set(fileId, fileUrl);
    setTimeout(() => imageCache.delete(fileId), 60 * 60 * 1000);

    // Добавляем заголовки для мобильных устройств
    res.set({
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
      Connection: "keep-alive",
    });

    res.json({ url: fileUrl });
  } catch (error) {
    console.error("Error getting image URL:", error);
    res.status(500).json({ error: "Failed to get image URL" });
  }
});

export const imageRouter = router;
