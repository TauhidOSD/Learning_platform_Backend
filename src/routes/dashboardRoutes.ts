import { Router } from "express";
import {
  getStudentOverview, getInstructorOverview, getAdminOverview, updateProfile, listAllUsers,
} from "../controllers/dashboardController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/student/overview", protect, restrictTo("student"), getStudentOverview);
router.get("/instructor/overview", protect, restrictTo("instructor"), getInstructorOverview);
router.get("/admin/overview", protect, restrictTo("admin"), getAdminOverview);
router.get("/admin/users", protect, restrictTo("admin"), listAllUsers);
router.put("/profile", protect, updateProfile);

export default router;
