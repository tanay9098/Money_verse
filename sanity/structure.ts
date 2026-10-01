import type { DefaultDocumentNodeResolver, StructureResolver } from "sanity/structure";
import { MissionPreview } from "@/sanity/components/MissionPreview";

function statusList(S: Parameters<StructureResolver>[0], type: "mission" | "lesson", title: string) {
  return S.list()
    .title(title)
    .items([
      S.listItem()
        .title("In review")
        .child(S.documentList().title(`${title} in review`).filter(`_type == "${type}" && reviewStatus == "inReview"`)),
      S.listItem()
        .title("Approved")
        .child(S.documentList().title(`Approved ${title.toLowerCase()}`).filter(`_type == "${type}" && reviewStatus == "approved"`)),
      S.listItem()
        .title("Drafts")
        .child(S.documentList().title(`Draft ${title.toLowerCase()}`).filter(`_type == "${type}" && reviewStatus == "draft"`)),
      S.documentTypeListItem(type).title(`All ${title.toLowerCase()}`),
    ]);
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("MoneyVerse")
    .items([
      S.listItem().title("Missions").child(statusList(S, "mission", "Missions")),
      S.listItem().title("Lessons").child(statusList(S, "lesson", "Lessons")),
    ]);

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (schemaType !== "mission") return S.document().views([S.view.form()]);
  return S.document().views([S.view.form(), S.view.component(MissionPreview).title("Play preview")]);
};
