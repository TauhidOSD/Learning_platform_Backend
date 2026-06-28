import { Router } from "express";
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse, enrollInCourse, addReview,
} from "../controllers/courseController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/", listCourses);
router.get("/:id", getCourse);
router.post("/", protect, restrictTo("instructor", "admin"), createCourse);
router.put("/:id", protect, restrictTo("instructor", "admin"), updateCourse);
router.delete("/:id", protect, restrictTo("instructor", "admin"), deleteCourse);
router.post("/:id/enroll", protect, restrictTo("student"), enrollInCourse);
router.post("/:id/reviews", protect, addReview);

export default router;
