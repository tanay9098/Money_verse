import { defineField, defineType } from "sanity";

const slugId = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "string",
    description: "Lowercase letters, numbers, and hyphens. Players never see this id.",
    validation: (rule) => rule.required().regex(/^[a-z0-9-]{1,80}$/, { name: "id" }),
  });

export const choiceOption = defineType({
  name: "choiceOption",
  title: "Choice",
  type: "object",
  fields: [
    slugId("id", "Id"),
    defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required().max(120) }),
    defineField({
      name: "detail",
      title: "Detail",
      type: "string",
      description: "Shown before the player chooses. Mention if it is a need, a want, or saving.",
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: "coinDelta",
      title: "Coin change",
      type: "number",
      description: "Use a negative number for a spend, or 0 to keep coins. Spending is checked before any bonus.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(-1000).max(1000),
    }),
    defineField({
      name: "bonusCoins",
      title: "Bonus coins",
      type: "number",
      description: "Extra coins added after the spend, such as 3 for the simple-interest example.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0).max(1000),
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      initialValue: "spend",
      options: {
        list: [
          { title: "Need", value: "need" },
          { title: "Want", value: "want" },
          { title: "Save", value: "save" },
          { title: "Other spend", value: "spend" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meetsNeed",
      title: "Meets a need",
      type: "boolean",
      initialValue: false,
      description: "Turn on when this choice covers a health, safety, or learning need.",
    }),
    defineField({
      name: "feedbackTitle",
      title: "Feedback title",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "feedbackBody",
      title: "Feedback",
      type: "text",
      rows: 4,
      description: "Kind, specific, and about this choice. Do not shame the player.",
      validation: (rule) => rule.required().max(500),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "tag" },
  },
});

export const missionStep = defineType({
  name: "missionStep",
  title: "Step",
  type: "object",
  fields: [
    slugId("id", "Id"),
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required().max(80) }),
    defineField({ name: "prompt", title: "Prompt", type: "text", rows: 3, validation: (rule) => rule.required().max(400) }),
    defineField({
      name: "income",
      title: "Income this step",
      type: "number",
      description: "Game coins added when the step begins, before the choice.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0).max(1000),
    }),
    defineField({
      name: "incomeLabel",
      title: "Income label",
      type: "string",
      description: "Example: Helper pay, which is income. Leave blank if income is 0.",
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: "choices",
      title: "Choices",
      type: "array",
      of: [{ type: "choiceOption" }],
      validation: (rule) => rule.required().min(2).max(4),
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});

export const supplyOption = defineType({
  name: "supplyOption",
  title: "Supply batch",
  type: "object",
  fields: [
    slugId("id", "Id"),
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required().max(80) }),
    defineField({ name: "detail", title: "Detail", type: "string", validation: (rule) => rule.required().max(240) }),
    defineField({
      name: "cost",
      title: "Cost in game coins",
      type: "number",
      validation: (rule) => rule.required().integer().min(0).max(10000),
    }),
    defineField({
      name: "cups",
      title: "Cups available",
      type: "number",
      validation: (rule) => rule.required().integer().min(1).max(1000),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "cost" },
  },
});

export const priceOption = defineType({
  name: "priceOption",
  title: "Price",
  type: "object",
  fields: [
    defineField({
      name: "price",
      title: "Price per cup",
      type: "number",
      validation: (rule) => rule.required().integer().min(1).max(1000),
    }),
    defineField({
      name: "customers",
      title: "Customers at this price",
      type: "number",
      description: "Deterministic demand. Cups sold = the smaller of customers and cups available.",
      validation: (rule) => rule.required().integer().min(0).max(1000),
    }),
    defineField({ name: "note", title: "Note", type: "string", validation: (rule) => rule.required().max(200) }),
  ],
  preview: {
    select: { title: "price", subtitle: "customers" },
    prepare({ title, subtitle }) {
      return { title: `${title} game coins`, subtitle: `${subtitle} customers` };
    },
  },
});

export const quizChoice = defineType({
  name: "quizChoice",
  title: "Answer",
  type: "object",
  fields: [
    slugId("id", "Id"),
    defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required().max(200) }),
    defineField({
      name: "correct",
      title: "Correct answer",
      type: "boolean",
      initialValue: false,
      description: "Mark exactly one answer as correct.",
    }),
    defineField({
      name: "explanation",
      title: "Explanation",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(400),
    }),
  ],
  preview: {
    select: { title: "label", correct: "correct" },
    prepare({ title, correct }) {
      return { title, subtitle: correct ? "Correct" : "Practice answer" };
    },
  },
});

export const quizQuestion = defineType({
  name: "quizQuestion",
  title: "Quiz question",
  type: "object",
  fields: [
    slugId("id", "Id"),
    defineField({ name: "prompt", title: "Question", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({
      name: "choices",
      title: "Answers",
      type: "array",
      of: [{ type: "quizChoice" }],
      validation: (rule) =>
        rule.required().min(2).max(4).custom((choices) => {
          if (!Array.isArray(choices)) return true;
          const correct = choices.filter((choice) => (choice as { correct?: boolean }).correct).length;
          return correct === 1 ? true : "Mark exactly one correct answer.";
        }),
    }),
  ],
  preview: {
    select: { title: "prompt" },
  },
});

export const reward = defineType({
  name: "reward",
  title: "Reward",
  type: "object",
  fields: [
    defineField({
      name: "xp",
      title: "XP for the first finish",
      type: "number",
      initialValue: 40,
      validation: (rule) => rule.required().integer().min(0).max(500),
    }),
    defineField({
      name: "coins",
      title: "Town-wallet game coins for the first finish",
      type: "number",
      initialValue: 12,
      description: "Replays do not grant these coins again.",
      validation: (rule) => rule.required().integer().min(0).max(500),
    }),
    defineField({
      name: "badgeId",
      title: "Badge id",
      type: "string",
      validation: (rule) => rule.required().regex(/^[a-z0-9-]{1,80}$/, { name: "id" }),
    }),
    defineField({ name: "badgeName", title: "Badge name", type: "string", validation: (rule) => rule.required().max(80) }),
    defineField({
      name: "badgeDescription",
      title: "Badge description",
      type: "string",
      validation: (rule) => rule.required().max(200),
    }),
  ],
});
