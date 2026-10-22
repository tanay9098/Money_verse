import { defineField } from "sanity";

export const reviewFields = [
  defineField({
    name: "reviewStatus",
    title: "Review status",
    type: "string",
    description:
      "Two things must both be true before children see this: (1) Review status is Approved, and (2) the document is Published (green Publish button). Use the Send for review and Approve actions to change this. Publish stays disabled until the document is approved, and an edit after approval needs a new review. Drafts are never shown.",
    initialValue: "draft",
    // Changed only by the "Send for review" and "Approve" actions, so the review step cannot be skipped.
    readOnly: true,
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
  defineField({
    name: "approvedHash",
    title: "Approved content fingerprint",
    type: "string",
    description: "Set by the Approve action. Publishing is blocked when the content no longer matches it.",
    hidden: true,
    readOnly: true,
  }),
];
