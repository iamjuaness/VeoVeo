import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import fs from "fs/promises";
import path from "path";

// Buffer de imagen GIF de 1x1 píxeles válida
const mockImageBuffer = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

describe("Image Proxy API", () => {
  beforeAll(() => {
    // Mockear fetch global para evitar llamadas de red en los tests
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (url === "https://example.com/invalid-image.png") {
        return Promise.resolve({
          ok: false,
          statusText: "Not Found",
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer),
      } as unknown as Response);
    });
  });

  it("debe retornar error 400 si falta el parámetro url", async () => {
    const response = await request(app).get("/api/images");
    expect(response.status).toBe(400);
    expect(response.body.error).toContain("El parámetro 'url' es requerido");
  });

  it("debe retornar error 400 si la url no es válida", async () => {
    const response = await request(app).get("/api/images?url=no-es-una-url");
    expect(response.status).toBe(400);
    expect(response.body.error).toContain("no es una URL válida");
  });

  it("debe procesar, optimizar y servir la imagen en formato webp", async () => {
    const response = await request(app).get(
      "/api/images?url=https://example.com/test.jpg&width=50&quality=75",
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("image/webp");
    expect(response.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );

    // El cuerpo debe ser una imagen optimizada
    expect(response.body).toBeInstanceOf(Buffer);
  });
});
