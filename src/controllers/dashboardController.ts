import { Response } from "express";
import User from "../models/User";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

// Real, dynamic figures derived from the database — no mocked chart data.
export const getStudentOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const enrollments = await Enrollment.find({ user: userId }).populate("course");

  const totalCourses = enrollments.length;
  const completed = enrollments.filter((e) => e.progressPercent >= 100).length;
  const avgProgress = totalCourses
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / totalCourses)
    : 0;

  const progressByCourse = enrollments.map((e: any) => ({
    course: e.course?.title || "Untitled",
    progress: e.progressPercent,
  }));

  res.json({
    cards: { totalCourses, completed, inProgress: totalCourses - completed, avgProgress },
    progressByCourse,
  });
});

export const getInstructorOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const instructorId = req.user!.id;
  const courses = await Course.find({ instructor: instructorId });
  const courseIds = courses.map((c) => c.id);

  const enrollments = await Enrollment.find({ course: { $in: courseIds } });
  const totalStudents = new Set(enrollments.map((e) => e.user.toString())).size;
  const totalRevenue = enrollments.reduce((sum, e) => {
    const course = courses.find((c) => c.id === e.course.toString());
    return sum + (course?.price || 0);
  }, 0);

  const enrollmentsByCourse = courses.map((c) => ({
    course: c.title,
    students: enrollments.filter((e) => e.course.toString() === c.id).length,
  }));

  res.json({
    cards: { totalCourses: courses.length, totalStudents, totalRevenue, avgRating: courses.length ? +(courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1) : 0 },
    enrollmentsByCourse,
  });
});

export const getAdminOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [totalUsers, totalCourses, totalEnrollments, usersByRole] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  const coursesByCategory = await Course.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  res.json({
    cards: { totalUsers, totalCourses, totalEnrollments },
    usersByRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
    coursesByCategory: coursesByCategory.map((c) => ({ category: c._id, count: c.count })),
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, bio, avatarUrl } = req.body;
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatarUrl: user.avatarUrl } });
});

export const listAllUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select("-password").sort("-createdAt");
  res.json({ users });
});
