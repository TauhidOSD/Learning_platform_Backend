import { Request, Response } from "express";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import Review from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

// GET /api/courses?search=&category=&level=&minPrice=&maxPrice=&sort=&page=&limit=
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, level, minPrice, maxPrice, sort = "-createdAt", page = "1", limit = "8" } = req.query as Record<string, string>;

  const filter: Record<string, any> = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "name avatarUrl")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Course.countDocuments(filter),
  ]);

  res.json({
    courses,
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) || 1, limit: limitNum },
  });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id).populate("instructor", "name avatarUrl bio");
  if (!course) throw new AppError("Course not found.", 404);

  const [reviews, related] = await Promise.all([
    Review.find({ course: course.id }).populate("user", "name avatarUrl").sort("-createdAt").limit(20),
    Course.find({ category: course.category, _id: { $ne: course.id } }).limit(4),
  ]);

  res.json({ course, reviews, related });
});

export const createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.create({ ...req.body, instructor: req.user!.id });
  res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError("Course not found.", 404);

  const isOwner = course.instructor.toString() === req.user!.id;
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("You can only edit your own courses.", 403);
  }

  Object.assign(course, req.body);
  await course.save();
  res.json({ course });
});

export const deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError("Course not found.", 404);

  const isOwner = course.instructor.toString() === req.user!.id;
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("You can only delete your own courses.", 403);
  }

  await course.deleteOne();
  res.json({ message: "Course deleted." });
});

export const enrollInCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError("Course not found.", 404);

  const existing = await Enrollment.findOne({ user: req.user!.id, course: course.id });
  if (existing) throw new AppError("You are already enrolled in this course.", 409);

  const enrollment = await Enrollment.create({ user: req.user!.id, course: course.id });
  res.status(201).json({ enrollment });
});

export const addReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) throw new AppError("Rating and comment are required.", 400);

  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError("Course not found.", 404);

  const review = await Review.create({ course: course.id, user: req.user!.id, rating, comment });

  const allReviews = await Review.find({ course: course.id });
  course.ratingCount = allReviews.length;
  course.rating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await course.save();

  res.status(201).json({ review });
});
