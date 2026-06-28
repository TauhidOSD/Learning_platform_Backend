import { Response } from "express";
import OpenAI from "openai";
import ChatMessage from "../models/ChatMessage";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError("OPENAI_API_KEY is not configured on the server.", 500);
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// AI Feature 1: Context-aware chat assistant for student doubt-solving.
// Keeps the last few turns of the user's own history as context.
export const chatWithAssistant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    throw new AppError("A message is required.", 400);
  }

  const client = getClient();
  const userId = req.user!.id;

  const history = await ChatMessage.find({ user: userId }).sort("-createdAt").limit(10);
  const orderedHistory = history.reverse();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a patient, encouraging tutor for an online learning platform. Answer the student's question clearly, use short paragraphs or bullet points, and suggest a follow-up resource or practice idea when relevant. Keep answers under 200 words unless the student asks for more detail.",
      },
      ...orderedHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ],
    max_tokens: 500,
  });

  const reply = completion.choices[0]?.message?.content || "I couldn't generate a response, please try again.";

  await ChatMessage.create([
    { user: userId, role: "user", content: message },
    { user: userId, role: "assistant", content: reply },
  ]);

  res.json({ reply });
});

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await ChatMessage.find({ user: req.user!.id }).sort("createdAt").limit(50);
  res.json({ history });
});

// AI Feature 2: Course description generator for instructors creating new courses.
export const generateCourseDescription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, topics, audience, tone } = req.body;
  if (!title || !topics) {
    throw new AppError("Course title and a list of topics are required.", 400);
  }

  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write concise, persuasive, plain-language marketing copy for online course listings. Never use placeholder text. Return only valid JSON with keys: shortDescription (max 160 characters) and overview (3 short paragraphs, no markdown headers).",
      },
      {
        role: "user",
        content: `Course title: ${title}\nKey topics covered: ${topics}\nTarget audience: ${audience || "general learners"}\nDesired tone: ${tone || "professional and motivating"}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: { shortDescription?: string; overview?: string } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("The AI returned an unexpected format. Please try again.", 502);
  }

  res.json(parsed);
});
