"use client";

import { useDocumentOperation, type DocumentActionComponent } from "sanity";
import { isApprovedAsIs, reviewContentHash, type ReviewState } from "@/lib/review-hash";

type ReviewDoc = ReviewState | null | undefined;

function currentStatus(draft: ReviewDoc, published: ReviewDoc): string {
  if (typeof draft?.reviewStatus === "string") return draft.reviewStatus;
  if (typeof published?.reviewStatus === "string") return published.reviewStatus;
  return "draft";
}

/** The document an editor is looking at: the draft if there is one, else the published copy. */
function shown(draft: ReviewDoc, published: ReviewDoc): ReviewDoc {
  return draft ?? published;
}

export const SendForReviewAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  if (props.type !== "mission" && props.type !== "lesson") return null;
  const draft = props.draft as ReviewDoc;
  const published = props.published as ReviewDoc;
  const status = currentStatus(draft, published);
  // An approved document that was edited afterwards must go back through review.
  const changedSinceApproval = status === "approved" && !isApprovedAsIs(shown(draft, published));
  if (status === "inReview" || (status === "approved" && !changedSinceApproval)) return null;
  return {
    label: changedSinceApproval ? "Send for review again" : "Send for review",
    title: changedSinceApproval
      ? "This was edited after it was approved. Send it for review again before publishing."
      : "Move this document to in review. Players still cannot see it.",
    onHandle: () => {
      patch.execute([{ set: { reviewStatus: "inReview" } }, { unset: ["approvedHash"] }]);
      props.onComplete();
    },
  };
};

export const ApproveAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  if (props.type !== "mission" && props.type !== "lesson") return null;
  const draft = props.draft as ReviewDoc;
  const published = props.published as ReviewDoc;
  const status = currentStatus(draft, published);
  const ready = status === "inReview";
  return {
    label: "Approve",
    disabled: !ready,
    title: ready
      ? "Mark this approved. Publish afterward so the town can load it."
      : "Send the document for review before approving it.",
    onHandle: () => {
      const document = shown(draft, published) ?? {};
      patch.execute([{ set: { reviewStatus: "approved", approvedHash: reviewContentHash(document) } }]);
      props.onComplete();
    },
  };
};

/**
 * Wraps Sanity's Publish action so only approved, unchanged content can be published.
 * The game still filters on reviewStatus == "approved"; this stops a draft that skipped
 * review (or was edited after approval) from reaching the published perspective.
 */
export function withReviewGate(publish: DocumentActionComponent): DocumentActionComponent {
  const Gated: DocumentActionComponent = (props) => {
    const original = publish(props);
    if (!original) return original;
    if (props.type !== "mission" && props.type !== "lesson") return original;
    const draft = props.draft as ReviewDoc;
    if (!draft || isApprovedAsIs(draft)) return original;
    const status = currentStatus(draft, props.published as ReviewDoc);
    return {
      ...original,
      disabled: true,
      title:
        status === "approved"
          ? "This was edited after it was approved. Send it for review again, then approve it, before publishing."
          : "Only approved content can be published. Send it for review, then approve it.",
    };
  };
  Gated.action = publish.action;
  Gated.displayName = `ReviewGated(${publish.displayName ?? "Publish"})`;
  return Gated;
}
