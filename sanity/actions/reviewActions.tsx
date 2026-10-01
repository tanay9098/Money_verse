"use client";

import { useDocumentOperation, type DocumentActionComponent } from "sanity";

type ReviewDoc = { reviewStatus?: string } | null | undefined;

function currentStatus(draft: ReviewDoc, published: ReviewDoc): string {
  if (typeof draft?.reviewStatus === "string") return draft.reviewStatus;
  if (typeof published?.reviewStatus === "string") return published.reviewStatus;
  return "draft";
}

export const SendForReviewAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  if (props.type !== "mission" && props.type !== "lesson") return null;
  const status = currentStatus(props.draft as ReviewDoc, props.published as ReviewDoc);
  if (status === "inReview" || status === "approved") return null;
  return {
    label: "Send for review",
    title: "Move this document to in review. Players still cannot see it.",
    onHandle: () => {
      patch.execute([{ set: { reviewStatus: "inReview" } }]);
      props.onComplete();
    },
  };
};

export const ApproveAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  if (props.type !== "mission" && props.type !== "lesson") return null;
  const status = currentStatus(props.draft as ReviewDoc, props.published as ReviewDoc);
  const ready = status === "inReview";
  return {
    label: "Approve",
    disabled: !ready,
    title: ready
      ? "Mark this approved. Publish afterward so the town can load it."
      : "Send the document for review before approving it.",
    onHandle: () => {
      patch.execute([{ set: { reviewStatus: "approved" } }]);
      props.onComplete();
    },
  };
};
