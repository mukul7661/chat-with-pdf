import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: process.env.PORT || "8000",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },
  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    collection: process.env.QDRANT_COLLECTION || "langchainjs-testing",
  },
  uploads: {
    directory: process.env.UPLOAD_DIR || "uploads/",
  },
};
