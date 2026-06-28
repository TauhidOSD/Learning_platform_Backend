import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db";
import User from "./models/User";
import Course from "./models/Course";
import Enrollment from "./models/Enrollment";
import Review from "./models/Review";
import mongoose from "mongoose";

const run = async () => {
  await connectDB();
  console.log("Clearing existing demo data...");
  await Promise.all([User.deleteMany({}), Course.deleteMany({}), Enrollment.deleteMany({}), Review.deleteMany({})]);

  const admin = await User.create({ name: "Admin User", email: "admin@learnix.dev", password: "Admin123!", role: "admin" });
  const instructor = await User.create({ name: "Maria Chen", email: "instructor@learnix.dev", password: "Instructor123!", role: "instructor", bio: "Full-stack engineer and educator with 9 years of industry experience." });
  const student = await User.create({ name: "Sam Rahman", email: "student@learnix.dev", password: "Student123!", role: "student" });

  const courseData = [
    { title: "Modern JavaScript from First Principles", shortDescription: "Build a rock-solid mental model of JavaScript before frameworks.", overview: "This course walks through closures, the event loop, prototypes, and async patterns using real debugging exercises. You will leave able to explain why code behaves the way it does, not just copy syntax.", category: "Programming", level: "Beginner", price: 0, durationHours: 12, tags: ["javascript", "fundamentals"] },
    { title: "React & TypeScript for Production Apps", shortDescription: "Component architecture, type-safe state, and testing patterns.", overview: "Go beyond tutorials and build a multi-page app with routing, forms, and API integration. Covers component composition, custom hooks, and common TypeScript pitfalls in React.", category: "Programming", level: "Intermediate", price: 49, durationHours: 18, tags: ["react", "typescript"] },
    { title: "Node.js & Express API Design", shortDescription: "Design REST APIs that scale and stay maintainable.", overview: "Learn middleware design, error handling strategy, authentication, and database modeling with MongoDB. Includes a full project building a production-style API.", category: "Programming", level: "Intermediate", price: 39, durationHours: 15, tags: ["node", "express", "api"] },
    { title: "UI/UX Design Foundations", shortDescription: "Design interfaces people actually enjoy using.", overview: "Covers visual hierarchy, color theory, typography, and usability testing. You will redesign a real interface and defend your decisions with design principles.", category: "Design", level: "Beginner", price: 29, durationHours: 10, tags: ["design", "ux"] },
    { title: "Advanced Figma for Product Teams", shortDescription: "Component systems, auto layout, and design handoff.", overview: "A practical deep-dive into building a scalable design system in Figma, with auto layout, variants, and developer-friendly handoff practices.", category: "Design", level: "Advanced", price: 59, durationHours: 8, tags: ["figma", "design-systems"] },
    { title: "Digital Marketing Analytics", shortDescription: "Turn campaign data into decisions, not just dashboards.", overview: "Learn to set up funnels, interpret attribution models, and run statistically sound A/B tests. Ends with a capstone analysis project.", category: "Marketing", level: "Intermediate", price: 45, durationHours: 14, tags: ["marketing", "analytics"] },
    { title: "Financial Modeling in Excel", shortDescription: "Build models investors and finance teams trust.", overview: "Covers three-statement modeling, sensitivity analysis, and presenting assumptions clearly. Built for analysts moving into FP&A or investment roles.", category: "Business", level: "Intermediate", price: 55, durationHours: 16, tags: ["finance", "excel"] },
    { title: "Public Speaking for Engineers", shortDescription: "Explain technical work clearly to any audience.", overview: "Practical structure for technical talks, demos, and stakeholder updates, with recorded practice sessions and feedback frameworks.", category: "Business", level: "Beginner", price: 0, durationHours: 6, tags: ["communication", "career"] },
  ];

  const courses = await Course.insertMany(
    courseData.map((c) => ({
      ...c,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(c.title)}/640/400`,
      instructor: instructor._id,
      curriculum: [
        { title: "Orientation & setup", durationMinutes: 20 },
        { title: "Core concepts", durationMinutes: 90 },
        { title: "Applied project", durationMinutes: 120 },
        { title: "Review & next steps", durationMinutes: 30 },
      ],
    }))
  );

  await Enrollment.create({ user: student._id, course: courses[0]._id, progressPercent: 80 });
  await Enrollment.create({ user: student._id, course: courses[1]._id, progressPercent: 35 });
  await Enrollment.create({ user: student._id, course: courses[3]._id, progressPercent: 100 });

  await Review.create({ course: courses[0]._id, user: student._id, rating: 5, comment: "Finally understood closures after years of guessing." });
  for (const c of courses) {
    c.ratingCount = 1;
    c.rating = 5;
  }
  await Course.bulkSave(courses);

  console.log("Seed complete.");
  console.log("Admin login: admin@learnix.dev / Admin123!");
  console.log("Instructor login: instructor@learnix.dev / Instructor123!");
  console.log("Student login: student@learnix.dev / Student123!");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
