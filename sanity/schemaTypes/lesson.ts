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
      title: "Lesson text",
      type: "text",
      rows: 6,
      description: "Age 8–12. Use fictional game coins. Do not give personal financial advice.",
      validation: (rule) => rule.required().max(1200),
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
    select: { title: "title", subtitle: "topic" },
  },
});
