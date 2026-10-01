import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "@/sanity/schemaTypes";

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
      structure: (S) =>
        S.list()
          .title("MoneyVerse")
          .items([S.documentTypeListItem("mission").title("Missions"), S.documentTypeListItem("lesson").title("Lessons")]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
