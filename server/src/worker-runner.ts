import { startWorker } from "./worker/index.js";
import "./config/env.js";
import fs from "fs";
import path from "path";
import { env } from "./config/env.js";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), env.uploads.directory);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log("Starting PDF processing worker...");
console.log(`Connecting to Redis at ${env.redis.host}:${env.redis.port}`);

const worker = startWorker();

process.on("SIGINT", async () => {
  console.log("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});
