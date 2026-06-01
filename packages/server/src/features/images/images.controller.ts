import { Request, Response } from "express";
import { ImagesService } from "./images.service.js";
import fs from "fs/promises";

export class ImagesController {
  static async proxyImage(req: Request, res: Response): Promise<void> {
    const { url, width, height, quality } = req.query;

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "El parámetro 'url' es requerido y debe ser una cadena de texto." });
      return;
    }

    // Validar formato básico de URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "El parámetro 'url' proporcionado no es una URL válida." });
      return;
    }

    const optWidth = width ? parseInt(width as string, 10) : undefined;
    const optHeight = height ? parseInt(height as string, 10) : undefined;
    const optQuality = quality ? parseInt(quality as string, 10) : undefined;

    if (optWidth && isNaN(optWidth)) {
      res.status(400).json({ error: "El parámetro 'width' debe ser un número entero válido." });
      return;
    }

    if (optHeight && isNaN(optHeight)) {
      res.status(400).json({ error: "El parámetro 'height' debe ser un número entero válido." });
      return;
    }

    if (optQuality && isNaN(optQuality)) {
      res.status(400).json({ error: "El parámetro 'quality' debe ser un número entero válido." });
      return;
    }

    try {
      const cachedFilePath = await ImagesService.getOptimizedImage({
        url,
        width: optWidth,
        height: optHeight,
        quality: optQuality,
      });

      const imageBuffer = await fs.readFile(cachedFilePath);

      // Establecer cabeceras para una óptima caché en navegador
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      res.send(imageBuffer);
    } catch (error: any) {
      console.error("Error en el proxy de imágenes:", error.message || error);
      res.status(500).json({ error: "Error al procesar y servir la imagen optimizada." });
    }
  }
}
