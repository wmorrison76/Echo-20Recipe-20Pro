import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { githubRaw, githubZip } from "./routes/github";
import { handleNutritionAnalyze } from "./routes/nutrition";
import { handleRecipeImport } from "./routes/recipe";
import { proxyRecipeImage } from "./routes/recipeImage";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // GitHub proxy endpoints to import recipes from repos (CORS-safe)
  app.get("/api/github/raw", githubRaw);
  app.get("/api/github/zip", githubZip);

  // Nutrition + Import
  app.post("/api/nutrition/analyze", handleNutritionAnalyze);
  app.post("/api/recipe/import", handleRecipeImport);
  app.get("/api/recipe/image", proxyRecipeImage);

  return app;
}
