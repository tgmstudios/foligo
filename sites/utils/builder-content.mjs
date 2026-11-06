import { newBlock } from "./builder.mjs";
export const contentTypes = [
  {
    type: "BLOG",
    label: "Blog posts",
    singular: "Blog post",
    path: "/blog",
    collection: "blogs",
  },
  {
    type: "PROJECT",
    label: "Projects",
    singular: "Project",
    path: "/projects",
    collection: "projects",
  },
  {
    type: "EXPERIENCE",
    label: "Experience",
    singular: "Experience entry",
    path: "/experiences",
    collection: "experiences",
  },
  {
    type: "SKILL",
    label: "Skills",
    singular: "Skill",
    path: "/skills",
    collection: "skills",
  },
];
export function newContentTemplate(type, kind) {
  const definition = contentTypes.find((t) => t.type === type);
  if (!definition || !["archive", "single"].includes(kind))
    throw Error("Unknown content template");
  const blocks =
    kind === "archive"
      ? [newBlock("text"), newBlock("post-list")]
      : [newBlock("post-header"), newBlock("post-content")];
  blocks.forEach((b, i) => {
    b.id = `template-${type}-${kind}-${i}`;
  });
  if (kind === "archive") {
    blocks[0].title = definition.label;
    blocks[0].text = "Explore the latest work and stories.";
  }
  return {
    id: `template-${type}-${kind}`,
    kind,
    contentType: type,
    name: `${definition.label} · ${kind === "archive" ? "Archive" : "Single post"}`,
    path: definition.path + (kind === "single" ? "/:slug" : ""),
    metaTitle: "",
    metaDescription: "",
    blocks,
  };
}
export function contentItems(collections, type) {
  const definition = contentTypes.find((t) => t.type === type);
  return (collections[definition?.collection] || []).filter(
    (item) =>
      item.contentType === type &&
      (!item.status || item.status === "PUBLISHED"),
  );
}
export function contentHref(item) {
  const definition = contentTypes.find((t) => t.type === item.contentType);
  return definition && item.slug
    ? `${definition.path}/${encodeURIComponent(item.slug)}`
    : "#";
}
export function resolveBuilderContent(document, path, collections = {}) {
  if (typeof path !== "string") return null;
  const normalized = path.replace(/\/$/, "") || "/";
  const staticPage = document.pages.find(
    (p) => (!p.kind || p.kind === "page") && p.path === normalized,
  );
  if (staticPage)
    return { page: staticPage, kind: "page", items: [], item: null };
  const definition = contentTypes.find(
    (t) => normalized === t.path || normalized.startsWith(t.path + "/"),
  );
  if (!definition) return null;
  const items = contentItems(collections, definition.type);
  const suffix = normalized.slice(definition.path.length);
  const kind = suffix ? "single" : "archive";
  let item = null;
  if (suffix) {
    if (!/^\/[^/]+$/.test(suffix)) return null;
    let slug;
    try {
      slug = decodeURIComponent(suffix.slice(1));
    } catch {
      return null;
    }
    item = items.find((i) => i.slug === slug);
    if (!item) return null;
  }
  const page =
    document.pages.find(
      (p) => p.kind === kind && p.contentType === definition.type,
    ) || newContentTemplate(definition.type, kind);
  return { page, kind, items, item };
}
export function samplePost(type) {
  const definition = contentTypes.find((t) => t.type === type);
  return {
    id: `sample-${type}`,
    title: `Your ${definition?.singular.toLowerCase() || "post"} title`,
    excerpt:
      "A preview of your post excerpt. Published content fills these fields automatically.",
    content:
      "## Your story\n\nYour post content appears here automatically. Edit this template to change the layout for every post of this type.",
    contentType: type,
    slug: "sample-post",
    createdAt: "2026-01-01T12:00:00Z",
  };
}

export function builderPageMetadata(resolved, document) {
  if (!resolved) return {};
  const { page, item } = resolved;
  const values = {
    title: item?.title || page.name,
    excerpt: item?.excerpt || "",
    siteName: document.name,
  };
  const expand = (value) =>
    String(value || "").replace(
      /\{\{(title|excerpt|siteName)\}\}/g,
      (_, key) => values[key],
    );
  return {
    title: expand(page.metaTitle || item?.title || page.name),
    description: expand(page.metaDescription || item?.excerpt || ""),
  };
}
