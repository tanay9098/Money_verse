import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { ApproveAction, SendForReviewAction, withReviewGate } from "@/sanity/actions/reviewActions";
import { schemaTypes } from "@/sanity/schemaTypes";
import { defaultDocumentNode, structure } from "@/sanity/structure";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "moneyverse",
  title: "MoneyVerse Studio",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure,
      defaultDocumentNode,
    }),
  ],
  document: {
    actions: (previous, context) => {
      if (context.schemaType !== "mission" && context.schemaType !== "lesson") return previous;
      const gated = previous.map((action) => (action.action === "publish" ? withReviewGate(action) : action));
      return [SendForReviewAction, ApproveAction, ...gated];
    },
  },
  schema: {
    types: schemaTypes,
  },
});
