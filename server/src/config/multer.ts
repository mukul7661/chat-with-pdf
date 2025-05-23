import multer from "multer";
import { env } from "./env.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, env.uploads.directory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({ storage: storage });
