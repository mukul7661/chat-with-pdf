import { Router } from "express";
import fileRoutes from "./fileRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router: Router = Router();

router.get("/", (req, res) => {
  return res.json({ status: "All Good!" });
});

// Register all routes
router.use(fileRoutes);
router.use(chatRoutes);

export default router;
