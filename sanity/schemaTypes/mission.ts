import { defineField, defineType } from "sanity";
import { CoinField } from "@/sanity/components/CoinField";
import { reviewFields } from "@/sanity/schemaTypes/review";

export const mission = defineType({
  name: "mission",
  title: "Mission",
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
    defineField({ name: "summary", title: "Card summary", type: "text", rows: 2, validation: (rule) => rule.required().max(240) }),
    defineField({ name: "story", title: "Intro story", type: "text", rows: 5, validation: (rule) => rule.required().max(900) }),
    defineField({
      name: "learningGoal",
      title: "Learning goal",
      type: "string",
      validation: (rule) => rule.required().max(240),
    }),
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
    defineField({ name: "topic", title: "Topic", type: "string", validation: (rule) => rule.required().max(80) }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      initialValue: 1,
      validation: (rule) => rule.required().integer().min(1).max(99),
    }),
    defineField({
      name: "engine",
      title: "Play style",
      type: "string",
      initialValue: "choices",
      options: {
        list: [
          { title: "Choices", value: "choices" },
          { title: "Lemonade stand", value: "lemonade" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startingCoins",
      title: "Starting mission coins",
      type: "number",
      description: "Practice coins for this mission only. They are not the town wallet.",
      initialValue: 20,
      components: { input: CoinField },
      validation: (rule) => rule.required().integer().min(0).max(10000),
    }),
    defineField({
      name: "goalAmount",
      title: "Savings goal",
      type: "number",
      description: "Optional. If set, the mission succeeds when the practice jar ends at or above this amount.",
      validation: (rule) => rule.integer().min(1).max(100000),
    }),
    defineField({
      name: "needsRequired",
      title: "Needs required",
      type: "number",
      description: "Used when there is no savings goal. Success means at least this many choices marked “meets a need”.",
      initialValue: 0,
      validation: (rule) => rule.integer().min(0).max(20),
    }),
    defineField({
      name: "successHeadline",
      title: "Success headline",
      type: "string",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "practiceHeadline",
      title: "Practice headline",
      type: "string",
      description: "Shown when the goal was not met. Keep it encouraging.",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "steps",
      title: "Steps",
      type: "array",
      of: [{ type: "missionStep" }],
      hidden: ({ parent }) => parent?.engine !== "choices",
    }),
    defineField({
      name: "supplies",
      title: "Supply batches",
      type: "array",
      of: [{ type: "supplyOption" }],
      hidden: ({ parent }) => parent?.engine !== "lemonade",
    }),
    defineField({
      name: "prices",
      title: "Prices",
      type: "array",
      of: [{ type: "priceOption" }],
      hidden: ({ parent }) => parent?.engine !== "lemonade",
    }),
    defineField({
      name: "lemonadeIntro",
      title: "Stand instructions",
      type: "text",
      rows: 3,
      hidden: ({ parent }) => parent?.engine !== "lemonade",
    }),
    defineField({
      name: "quiz",
      title: "Knowledge check",
      type: "array",
      of: [{ type: "quizQuestion" }],
      validation: (rule) => rule.required().min(1).max(6),
    }),
    defineField({ name: "rewards", title: "Reward", type: "reward", validation: (rule) => rule.required() }),
  ],
  validation: (rule) =>
    rule.custom((doc) => {
      if (!doc) return true;
      const value = doc as {
        ageMin?: number;
        ageMax?: number;
        engine?: string;
        steps?: unknown[];
        supplies?: unknown[];
        prices?: unknown[];
        lemonadeIntro?: string;
      };
      if (value.ageMin && value.ageMax && value.ageMax < value.ageMin) {
        return "Maximum age should be at least the minimum age.";
      }
      if (value.engine === "choices" && (!Array.isArray(value.steps) || value.steps.length < 1)) {
        return "Choice missions need at least one step.";
      }
      if (value.engine === "lemonade") {
        if (!Array.isArray(value.supplies) || value.supplies.length < 1) return "Add at least one supply batch.";
        if (!Array.isArray(value.prices) || value.prices.length < 1) return "Add at least one price.";
        if (!value.lemonadeIntro) return "Add stand instructions.";
      }
      return true;
    }),
  preview: {
    select: { title: "title", subtitle: "topic", engine: "engine" },
    prepare({ title, subtitle, engine }) {
      return { title, subtitle: `${engine ?? "mission"} · ${subtitle ?? ""}` };
    },
  },
});
