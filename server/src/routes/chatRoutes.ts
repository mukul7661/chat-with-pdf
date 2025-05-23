import { Router } from "express";
import {
  handleChatQuery,
  handleChatStream,
} from "../controllers/chatController.js";

const router: Router = Router();

// Chat routes
router.get("/chat", handleChatQuery);
router.get("/chat/stream", handleChatStream);

export default router;
