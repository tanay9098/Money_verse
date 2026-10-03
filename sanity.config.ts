import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { ApproveAction, SendForReviewAction } from "@/sanity/actions/reviewActions";
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
    newDocumentOptions: (previous) => previous.filter((template) => template.templateId !== "playerProgress"),
    actions: (previous, context) => {
      if (context.schemaType === "playerProgress") {
        return previous.filter((action) => action.action !== "publish" && action.action !== "unpublish" && action.action !== "duplicate");
      }
      if (context.schemaType !== "mission" && context.schemaType !== "lesson") return previous;
      return [SendForReviewAction, ApproveAction, ...previous];
    },
  },
  schema: {
    types: schemaTypes,
  },
});
