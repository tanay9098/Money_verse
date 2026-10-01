import { defineField } from "sanity";

export const reviewFields = [
  defineField({
    name: "reviewStatus",
    title: "Review status",
    type: "string",
    description: "The town loads a lesson or mission only after it is approved and published.",
    initialValue: "draft",
    options: {
      list: [
        { title: "Draft", value: "draft" },
        { title: "In review", value: "inReview" },
        { title: "Approved", value: "approved" },
      ],
      layout: "radio",
    },
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "reviewerNote",
    title: "Reviewer note",
    type: "text",
    rows: 3,
    description: "A note for the next person in the review. Players never see this.",
    validation: (rule) => rule.max(400),
  }),
];
