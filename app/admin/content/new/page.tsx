import { AdminRecordForm } from "@/app/admin/_components/admin-record-form";
import { createContentAction } from "@/app/admin/actions";

export default function AdminNewContentPage() {
  return (
    <AdminRecordForm
      title="Create content"
      detail="Add a draft article or tutorial. Slugs are derived automatically unless you supply one."
      submitLabel="Create content"
      action={createContentAction}
      fields={[
        {
          name: "kind",
          label: "Kind",
          kind: "select",
          options: [
            { label: "Article", value: "article" },
            { label: "Tutorial", value: "tutorial" },
          ],
        },
        {
          name: "subtype",
          label: "Subtype",
          kind: "select",
          options: [
            { label: "News", value: "news" },
            { label: "Blog", value: "blog" },
            { label: "Analysis", value: "analysis" },
            { label: "Roundup", value: "roundup" },
            { label: "Guide", value: "guide" },
            { label: "Release note", value: "release-note" },
          ],
        },
        {
          name: "status",
          label: "Status",
          kind: "select",
          options: [
              { label: "Draft", value: "draft" },
              { label: "Review", value: "review" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Published", value: "published" },
              { label: "Archived", value: "archived" },
          ],
        },
        {
          name: "title",
          label: "Title",
          kind: "text",
          required: true,
          placeholder: "What changed in coding agents this week",
        },
        {
          name: "slug",
          label: "Slug override",
          kind: "text",
          placeholder: "leave blank to derive automatically",
        },
        {
          name: "excerpt",
          label: "Excerpt",
          kind: "textarea",
          rows: 3,
          placeholder: "Short summary for cards and metadata.",
        },
        {
          name: "body",
          label: "Body",
          kind: "textarea",
          rows: 10,
          placeholder: "Write the article or tutorial body here.",
        },
        {
          name: "heroImageUrl",
          label: "Hero image URL",
          kind: "url",
          placeholder: "https://agentriot.com/og/hero.png",
        },
        {
          name: "canonicalUrl",
          label: "Canonical URL override",
          kind: "url",
          placeholder: "https://agentriot.com/articles/custom-canonical",
        },
        {
          name: "seoTitle",
          label: "SEO title override",
          kind: "text",
          placeholder: "Optional title used for metadata",
        },
        {
          name: "seoDescription",
          label: "SEO description override",
          kind: "textarea",
          rows: 3,
          placeholder: "Optional description used for metadata",
        },
        {
          name: "publishedAt",
          label: "Published at",
          kind: "datetime-local",
        },
        {
          name: "scheduledFor",
          label: "Scheduled for",
          kind: "datetime-local",
        },
      ]}
    />
  );
}
