import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const CACHE_DIR = path.join(process.cwd(), ".cache", "images");

// Asegurar que el directorio de caché existe
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Error al crear el directorio de caché:", error);
  }
}

export interface OptimizeOptions {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
}

export class ImagesService {
  /**
   * Genera un nombre de archivo único para la caché basado en los parámetros.
   */
  private static getCacheKey(options: OptimizeOptions): string {
    const data = JSON.stringify({
      url: options.url,
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
    });
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return `${hash}.webp`;
  }

  /**
   * Obtiene la imagen optimizada (de la caché o descargando y procesando la original).
   */
  static async getOptimizedImage(options: OptimizeOptions): Promise<string> {
    await ensureCacheDir();

    const cacheFilename = this.getCacheKey(options);
    const cacheFilePath = path.join(CACHE_DIR, cacheFilename);

    // 1. Verificar si ya existe en la caché
    try {
      await fs.access(cacheFilePath);
      return cacheFilePath;
    } catch {
      // Si fs.access falla, el archivo no existe, procedemos a procesarlo.
    }

    // 2. Descargar la imagen original
    let imageBuffer: Buffer;
    try {
      const response = await fetch(options.url);
      if (!response.ok) {
        throw new Error(`Error al descargar la imagen: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Error descargando la imagen desde ${options.url}:`, error);
      throw new Error("No se pudo descargar la imagen original.");
    }

    // 3. Procesar y optimizar con Sharp
    try {
      let pipeline = sharp(imageBuffer);

      // Redimensionar si se especifican dimensiones
      if (options.width || options.height) {
        pipeline = pipeline.resize({
          width: options.width,
          height: options.height,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convertir a WebP con calidad especificada
      const quality = options.quality ? Math.min(Math.max(options.quality, 1), 100) : 80;
      pipeline = pipeline.webp({ quality });

      // Guardar en la caché
      await pipeline.toFile(cacheFilePath);

      return cacheFilePath;
    } catch (error) {
      console.error("Error al procesar la imagen con Sharp:", error);
      throw new Error("Error en el procesamiento de la imagen.");
    }
  }
}
