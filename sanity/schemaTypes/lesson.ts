import { defineField, defineType } from "sanity";
import { reviewFields } from "@/sanity/schemaTypes/review";

export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    ...reviewFields,
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required().max(120) }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 2, validation: (rule) => rule.required().max(240) }),
    defineField({
      name: "body",
      title: "Introduction",
      type: "text",
      rows: 4,
      description: "Two or three friendly sentences for ages 8–12. Use fictional game coins. Do not give personal financial advice.",
      validation: (rule) => rule.required().max(1200),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      initialValue: "easy",
      options: {
        list: [
          { title: "Easy", value: "easy" },
          { title: "Medium", value: "medium" },
          { title: "Hard", value: "hard" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "objectives",
      title: "Learning objectives",
      type: "array",
      of: [{ type: "string", validation: (rule) => rule.required().max(200) }],
      description: "Up to 5 short “you can…” statements.",
      validation: (rule) => rule.max(5),
    }),
    defineField({
      name: "sections",
      title: "Lesson sections",
      type: "array",
      of: [{ type: "lessonSection" }],
      description: "Shown in this order. Up to 6.",
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "quiz",
      title: "Quiz questions",
      type: "array",
      of: [{ type: "quizQuestion" }],
      description: "Single-choice questions, up to 5. Each needs 2–4 answers with exactly one marked correct. Leave empty for a read-only lesson.",
      validation: (rule) => rule.max(5),
    }),
    defineField({
      name: "passPercent",
      title: "Percent right to complete",
      type: "number",
      initialValue: 66,
      description: "For 3 questions, 66 means 2 right. 100 means every answer must be right.",
      validation: (rule) => rule.required().integer().min(1).max(100),
    }),
    defineField({
      name: "rewards",
      title: "Quiz reward (optional)",
      type: "lessonReward",
      description: "Paid once, the first time the quiz is passed. Ignored when there is no quiz.",
    }),
    defineField({ name: "topic", title: "Topic", type: "string", validation: (rule) => rule.required().max(80) }),
    defineField({
      name: "ageMin",
      title: "Minimum age",
      type: "number",
      initialValue: 8,
      validation: (rule) => rule.required().integer().min(8).max(12),
    }),
    defineField({
      name: "ageMax",
      title: "Maximum age",
      type: "number",
      initialValue: 12,
      validation: (rule) => rule.required().integer().min(8).max(12),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      initialValue: 1,
      validation: (rule) => rule.required().integer().min(1).max(99),
    }),
  ],
  validation: (rule) =>
    rule.custom((doc) => {
      if (!doc?.ageMin || !doc.ageMax) return true;
      return doc.ageMax >= doc.ageMin ? true : "Maximum age should be at least the minimum age.";
    }),
  preview: {
    select: { title: "title", topic: "topic", status: "reviewStatus", quiz: "quiz" },
    prepare({ title, topic, status, quiz }) {
      const questions = Array.isArray(quiz) ? quiz.length : 0;
      return { title, subtitle: `${status ?? "draft"} · ${topic ?? ""} · ${questions} question${questions === 1 ? "" : "s"}` };
    },
  },
});
