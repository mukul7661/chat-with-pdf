import express from "express";
import { setupMiddleware } from "./middleware/index.js";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { fileQueue } from "./services/queueService.js";
import fs from "fs";
import path from "path";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), env.uploads.directory);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Setup middleware
setupMiddleware(app);

// Register routes
app.use(routes);

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server started on PORT:${PORT}`);
  console.log(
    `Queue is connected to Redis at ${env.redis.host}:${env.redis.port}`
  );
});
