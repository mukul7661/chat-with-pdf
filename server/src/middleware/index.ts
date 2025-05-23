import express, { Express } from "express";
import cors from "cors";

export function setupMiddleware(app: Express): void {
  app.use(cors());
  app.use(express.json());
}
