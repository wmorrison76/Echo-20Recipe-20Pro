import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { githubRaw, githubZip } from "./routes/github";
import { handleNutritionAnalyze } from "./routes/nutrition";
import { handleRecipeImport } from "./routes/recipe";
import { proxyRecipeImage } from "./routes/recipeImage";
import { recipeDeploymentRouter } from "./routes/recipe-deployment";
import { rdLabsRouter } from "./routes/rdlabs";
import { rdLabsAdvancedRouter } from "./routes/rdlabs-advanced";
import rdLabsAIRouter from "./routes/rdlabs-ai";
import { rdLabsChatRouter } from "./routes/rdlabs-chat";
import { elevenLabsRouter } from "./routes/elevenlabs";
import vectorRouter from "./routes/vector-recipes";
import {
  proxyRecipeImage as proxyImageOptimized,
  serveRecipeImage,
  generateBlurhash,
  getImageMetadata
} from "./routes/images";

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

  // Image Optimization Routes (WebP support, LQIP, metadata)
  app.get("/api/images/proxy", proxyImageOptimized);
  app.get("/api/images/recipes/:recipeId/:imageId", serveRecipeImage);
  app.post("/api/images/blurhash", generateBlurhash);
  app.get("/api/images/metadata", getImageMetadata);

  // Recipe Deployment System
  app.use(recipeDeploymentRouter);

  // R&D Labs API
  app.use(rdLabsRouter);

  // R&D Labs Advanced Features (Molecular Gastronomy)
  app.use(rdLabsAdvancedRouter);

  // R&D Labs AI Features (Experiment Design, Validation, Production Bridge)
  app.use("/api/rdlabs/ai", rdLabsAIRouter);

  // R&D Labs Chat (ECHO Ai integration)
  app.use(rdLabsChatRouter);

  // ElevenLabs Text-to-Speech
  app.use(elevenLabsRouter);

  // Vector Search for Recipes (supports Pinecone and pgvector)
  app.use("/api/vector", vectorRouter);

  // Legacy Pinecone endpoint (redirects to vector endpoint)
  app.use("/api/pinecone", vectorRouter);

  return app;
}
