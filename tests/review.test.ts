import { describe, expect, it } from "vitest";
import { isApprovedAsIs, reviewContentHash } from "@/lib/review-hash";

const doc = {
  _id: "drafts.lesson-a",
  _rev: "r1",
  _updatedAt: "2026-01-01T00:00:00Z",
  title: "Saving",
  quiz: [{ _key: "q1", id: "q1", prompt: "Why save?" }],
  reviewStatus: "inReview",
};

describe("review fingerprint", () => {
  it("ignores system and review fields, and key order", () => {
    const base = reviewContentHash(doc);
    expect(reviewContentHash({ ...doc, _rev: "r2", _updatedAt: "later", reviewStatus: "approved", reviewerNote: "ok" })).toBe(base);
    expect(reviewContentHash({ quiz: doc.quiz, title: doc.title })).toBe(base);
    expect(reviewContentHash({ ...doc, goalAmount: null })).toBe(base);
  });

  it("changes when content changes", () => {
    expect(reviewContentHash({ ...doc, title: "Saving!" })).not.toBe(reviewContentHash(doc));
    expect(reviewContentHash({ ...doc, quiz: [{ ...doc.quiz[0], prompt: "Why?" }] })).not.toBe(reviewContentHash(doc));
  });

  it("treats only approved, unedited documents as publishable", () => {
    const approved = { ...doc, reviewStatus: "approved", approvedHash: reviewContentHash(doc) };
    expect(isApprovedAsIs(approved)).toBe(true);
    expect(isApprovedAsIs({ ...approved, title: "Edited after approval" })).toBe(false);
    expect(isApprovedAsIs({ ...doc, reviewStatus: "approved" })).toBe(false);
    expect(isApprovedAsIs({ ...approved, reviewStatus: "inReview" })).toBe(false);
    expect(isApprovedAsIs(null)).toBe(false);
  });
});
