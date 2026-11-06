import { Marked } from "marked";
import { parseFragment, serializeOuter } from "parse5";

export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );

// URLs are checked after HTML entity decoding by parse5. Markdown also supports
// relative file links; builder button URL rules deliberately remain separate.
export function safeMarkdownUrl(value, media = false) {
  if (
    typeof value !== "string" ||
    !value ||
    /[\u0000-\u0020\u007f-\u009f<>"'\\]/u.test(value) ||
    value.startsWith("//")
  )
    return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (!(media ? /^https?:\/\//i : /^(https?:\/\/|mailto:|tel:)/i).test(value))
      return "";
    if (/^https?:/i.test(value)) {
      try {
        const url = new URL(value);
        if (!url.hostname) return "";
      } catch {
        return "";
      }
    }
  }
  return value;
}
const tags = new Set(
  "a abbr article b blockquote br button caption code col colgroup dd del details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img input kbd li mark ol p pre s samp small source span strong sub summary sup table tbody td th thead time tr track u ul video audio iframe".split(
    " ",
  ),
);
const voidTags = new Set([
  "br",
  "hr",
  "img",
  "input",
  "source",
  "track",
  "col",
]);
const attrsFor = {
  a: ["href", "title"],
  img: ["src", "alt", "title", "width", "height"],
  video: ["src", "poster", "width", "height"],
  audio: ["src"],
  source: ["src", "type"],
  track: ["src", "kind", "srclang", "label", "default"],
  th: ["align", "colspan", "rowspan", "scope"],
  td: ["align", "colspan", "rowspan"],
  col: ["span"],
  ol: ["start", "reversed"],
  li: ["value"],
  time: ["datetime"],
  abbr: ["title"],
  details: ["open"],
  button: ["type"],
  input: ["type", "checked"],
};
function embedUrl(value) {
  if (!safeMarkdownUrl(value, true)) return "";
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      ((["www.youtube.com", "www.youtube-nocookie.com"].includes(u.hostname) &&
        /^\/embed\/[\w-]+$/.test(u.pathname)) ||
        (u.hostname === "player.vimeo.com" &&
          /^\/video\/\d+$/.test(u.pathname)))
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function sanitizeSiteHtml(html) {
  const fragment = parseFragment(html);
  function nodeHtml(node, depth = 0) {
    if (depth > 150) return "";
    if (node.nodeName === "#text") return escapeHtml(node.value);
    if (!node.tagName) return "";
    const tag = node.tagName;
    if (!tags.has(tag) || node.namespaceURI !== "http://www.w3.org/1999/xhtml")
      return escapeHtml(serializeOuter(node));
    const source = Object.fromEntries(node.attrs.map((a) => [a.name, a.value]));
    if (tag === "iframe") {
      const src = embedUrl(source.src);
      return src
        ? `<iframe src="${escapeHtml(src)}" title="${escapeHtml(source.title || "Embedded video")}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
        : "";
    }
    if (tag === "input" && source.type !== "checkbox") return "";
    if (
      tag === "button" &&
      !(source.class || "").split(/\s+/).includes("site-md-copy")
    )
      return "";
    const result = [];
    for (const key of attrsFor[tag] || []) {
      if (source[key] === undefined) continue;
      let value = source[key];
      if (["href", "src", "poster"].includes(key)) {
        value = safeMarkdownUrl(value, key !== "href");
        if (!value) continue;
      }
      if (
        [
          "width",
          "height",
          "colspan",
          "rowspan",
          "span",
          "start",
          "value",
        ].includes(key) &&
        !/^-?\d{1,5}$/.test(value)
      )
        continue;
      if (key === "align" && !["left", "right", "center"].includes(value))
        continue;
      if (
        key === "type" &&
        tag === "source" &&
        !/^(video|audio)\/[\w.+-]+$/.test(value)
      )
        continue;
      if (key === "type" && tag === "button") value = "button";
      result.push(`${key}="${escapeHtml(value)}"`);
    }
    const classes = (source.class || "")
      .split(/\s+/)
      .filter((c) =>
        /^(site-md-[\w-]+|language-[\w+-]+|task-list-item|contains-task-list)$/.test(
          c,
        ),
      );
    if (classes.length) result.push(`class="${classes.join(" ")}"`);
    if (source.id && /^(?:[\p{L}\p{N}][\p{L}\p{N}_-]*)$/u.test(source.id))
      result.push(`id="${escapeHtml(source.id)}"`);
    if (source["aria-label"] && !classes.includes("site-md-table"))
      result.push(`aria-label="${escapeHtml(source["aria-label"])}"`);
    if (tag === "a") result.push('rel="noopener noreferrer"');
    if (tag === "img") result.push('loading="lazy" decoding="async"');
    if (["video", "audio"].includes(tag))
      result.push(
        'controls preload="metadata"' + (tag === "video" ? " playsinline" : ""),
      );
    if (tag === "input") result.push("disabled");
    if (classes.includes("site-md-table"))
      result.push('role="region" tabindex="0" aria-label="Table"');
    const open = `<${tag}${result.length ? " " + result.join(" ") : ""}>`;
    return (
      open +
      (voidTags.has(tag)
        ? ""
        : (node.childNodes || []).map((n) => nodeHtml(n, depth + 1)).join("") +
          `</${tag}>`)
    );
  }
  return fragment.childNodes.map((n) => nodeHtml(n)).join("");
}

export function renderSiteMarkdown(content) {
  if (typeof content !== "string" || !content.trim()) return "";
  const headings = new Map();
  // A fresh, private parser: Studio/chat marked.use() calls cannot change Sites.
  const markdown = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
      html(token) {
        return token.text;
      },
      heading(token) {
        const base =
          token.text
            .replace(/<[^>]*>/g, "")
            .normalize("NFKD")
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s_-]/gu, "")
            .trim()
            .replace(/\s+/g, "-") || "section";
        const count = (headings.get(base) || 0) + 1;
        headings.set(base, count);
        return `<h${token.depth} id="${escapeHtml(base + (count > 1 ? "-" + count : ""))}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
      },
      code(token) {
        const lang = (token.lang || "").trim().split(/\s+/)[0].toLowerCase();
        if (lang === "drawio") return ""; // The exported image is visible; this fence is editable XML metadata.
        if (lang === "mermaid")
          return `<figure class="site-md-diagram"><figcaption>Diagram</figcaption><pre class="site-md-mermaid-source"><code>${escapeHtml(token.text)}</code></pre></figure>\n`;
        const language = /^[a-z0-9_+-]+$/.test(lang) ? lang : "";
        return `<figure class="site-md-code-block"><figcaption>${escapeHtml(language || "Code")}<button type="button" class="site-md-copy" aria-label="Copy code">Copy</button></figcaption><pre><code${language ? ` class="language-${language}"` : ""}>${escapeHtml(token.text)}\n</code></pre></figure>\n`;
      },
      table(token) {
        const cell = (c, tag, align) =>
          `<${tag}${tag === "th" ? ' scope="col"' : ""}${align ? ` align="${align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        return `<div class="site-md-table"><table><thead><tr>${token.header.map((c, i) => cell(c, "th", token.align[i])).join("")}</tr></thead><tbody>${token.rows.map((row) => `<tr>${row.map((c, i) => cell(c, "td", token.align[i])).join("")}</tr>`).join("")}</tbody></table></div>\n`;
      },
    },
  });
  return sanitizeSiteHtml(markdown.parse(content));
}
