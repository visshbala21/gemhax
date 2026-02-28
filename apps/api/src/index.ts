import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import { generateRoute } from "./routes/generate.js";

const filePath = fileURLToPath(import.meta.url);
const dirPath = dirname(filePath);
// Load the monorepo root .env even when running from apps/api workspace cwd.
config({ path: resolve(dirPath, "../../../.env") });

const app: Express = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/generate", generateRoute);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});

export default app;
