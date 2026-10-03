import { defineField } from "sanity";

export const reviewFields = [
  defineField({
    name: "reviewStatus",
    title: "Review status",
    type: "string",
    description:
      "Two things must both be true before children see this: (1) Review status is Approved, and (2) the document is Published (green Publish button). Review status is our checklist. Publishing is Sanity's own switch. Drafts are never shown.",
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
