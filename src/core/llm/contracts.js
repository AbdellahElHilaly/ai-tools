import { z } from "zod";

export const levelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  topics: z.array(z.string().min(1)).min(2).max(8)
});

export const quizPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  levels: z.array(levelSchema).min(2).max(6)
});

export const questionSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1)
});

export const questionBatchSchema = z.object({
  levelId: z.string().min(1),
  questions: z.array(questionSchema).min(4).max(12)
});
