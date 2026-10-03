import { defineField, defineType } from "sanity";

/**
 * One unpublished document per signed-in player. The game writes it from the
 * server. It is not lesson content and is not part of the town query.
 */
export const playerProgress = defineType({
  name: "playerProgress",
  title: "Player progress",
  type: "document",
  fields: [
    defineField({
      name: "playerKey",
      title: "Player key",
      type: "string",
      description: "Provider-scoped account id, such as google:<sub>. Not an email address.",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
      readOnly: true,
      initialValue: "google",
    }),
    defineField({
      name: "revision",
      title: "Revision",
      type: "number",
      readOnly: true,
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "lastMutationId",
      title: "Last mutation id",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "progressJson",
      title: "Progress JSON",
      type: "text",
      readOnly: true,
      description: "Versioned town wallet, mission results, badges, and fictional game coins.",
    }),
  ],
});
