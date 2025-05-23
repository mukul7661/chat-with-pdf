import { Router } from "express";
import { upload } from "../config/multer.js";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  getFileStatus,
  completeJob,
} from "../controllers/fileController.js";

const router = Router();

// File upload routes
router.post("/upload/pdf", upload.single("pdf"), uploadSingleFile);
router.post("/upload/pdfs", upload.array("pdfs", 10), uploadMultipleFiles);

// File status routes
router.get("/file-status", getFileStatus);
router.post("/complete-job", completeJob);

export default router;
