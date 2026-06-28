import { Router } from "express";
import { chatWithAssistant, getChatHistory, generateCourseDescription } from "../controllers/aiController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.post("/chat", protect, chatWithAssistant);
router.get("/chat/history", protect, getChatHistory);
router.post("/generate-description", protect, restrictTo("instructor", "admin"), generateCourseDescription);

export default router;
