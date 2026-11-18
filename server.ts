import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

interface RoomImageRequestBody {
  furnitureName?: string;
  category?: string;
  materialsSummary?: string;
  roomStyle?: string;
  lightingMood?: string;
  imageSize?: string;
  aspectRatio?: string;
  customNotes?: string;
}

const VALID_IMAGE_SIZES = new Set(["1K", "2K", "4K"]);
const VALID_ASPECT_RATIOS = new Set(["16:9", "4:3", "1:1", "3:4"]);

async function createServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/generate-room-image", async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(401).json({
        error:
          "A paid Gemini API key is required for gemini-3-pro-image-preview. Please configure GEMINI_API_KEY in Settings > Secrets.",
      });
      return;
    }

    const body = (req.body ?? {}) as RoomImageRequestBody;
    const furnitureName = (body.furnitureName ?? "Architectural Sofa").trim();
    const category = (body.category ?? "Living Room").trim();
    const materialsSummary = (
      body.materialsSummary ?? "Oiled American Walnut, Belgian Oat Bouclé, Brushed Bronze"
    ).trim();
    const roomStyle = (body.roomStyle ?? "Sunlit Parisian Haussmann Salon").trim();
    const lightingMood = (body.lightingMood ?? "Soft Morning Sunlight").trim();
    const imageSize = VALID_IMAGE_SIZES.has(body.imageSize ?? "")
      ? (body.imageSize as "1K" | "2K" | "4K")
      : "1K";
    const aspectRatio = VALID_ASPECT_RATIOS.has(body.aspectRatio ?? "")
      ? (body.aspectRatio as string)
      : "16:9";
    const customNotes = (body.customNotes ?? "").trim();

    const prompt = [
      `Architectural Digest editorial interior photograph of a luxury showroom room featuring the "${furnitureName}" (${category}).`,
      `Furniture materials rendered true to life: ${materialsSummary}.`,
      `Interior architecture setting: ${roomStyle}, warm ivory limestone surfaces, subtle blush plaster architectural walls, fine brushed brass detailing, wide-plank European walnut flooring.`,
      `Lighting & atmosphere: ${lightingMood}, natural window shadows, realistic reflections, photorealistic materials, zero cartoon or artificial gloss.`,
      customNotes ? `Bespoke styling detail: ${customNotes}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let modelNote = "";

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          modelNote += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          error:
            modelNote ||
            "The model completed without returning an image buffer. Try simplifying the styling prompt.",
        });
        return;
      }

      res.json({
        imageUrl,
        imageSize,
        aspectRatio,
        model: "gemini-3-pro-image-preview",
        promptUsed: prompt,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate interior render.";
      const lower = message.toLowerCase();
      const status =
        lower.includes("403") || lower.includes("permission")
          ? 403
          : lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")
            ? 429
            : lower.includes("400") || lower.includes("invalid")
              ? 400
              : 500;
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Maison Rosé & Co. showroom running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
