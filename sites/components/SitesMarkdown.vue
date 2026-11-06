<template>
  <article
    ref="root"
    class="sites-markdown"
    v-html="html"
    @click="handleClick"
  />
</template>
<script setup>
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { renderSiteMarkdown } from "../utils/site-markdown.mjs";
import { renderSiteDiagram } from "../utils/site-markdown-diagrams.mjs";
const props = defineProps({ content: { type: String, default: "" } });
const html = computed(() => renderSiteMarkdown(props.content));
const root = ref(null);
let mounted = false,
  generation = 0;
async function enhance() {
  const token = ++generation;
  await nextTick();
  if (!mounted || !root.value) return;
  for (const source of root.value.querySelectorAll(".site-md-mermaid-source")) {
    if (source.dataset.rendered) continue;
    const code = source.textContent || "";
    try {
      const { svg } = await renderSiteDiagram(code);
      if (token !== generation || !source.isConnected) return;
      const diagram = document.createElement("div");
      diagram.className = "site-md-diagram-svg";
      diagram.innerHTML = svg;
      const details = document.createElement("details");
      details.className = "site-md-diagram-code";
      const summary = document.createElement("summary");
      summary.textContent = "Diagram source";
      details.append(summary);
      source.before(diagram, details);
      details.append(source);
      source.dataset.rendered = "true";
    } catch {
      if (token !== generation || !source.isConnected) return;
      source.dataset.rendered = "error";
      const message = document.createElement("p");
      message.className = "site-md-diagram-error";
      message.setAttribute("role", "status");
      message.textContent =
        "This diagram could not be rendered. Its source is shown below.";
      source.before(message);
    }
  }
}
async function handleClick(event) {
  const button = event.target.closest?.(".site-md-copy");
  if (!button || !root.value?.contains(button)) return;
  event.preventDefault();
  event.stopPropagation();
  const code = button
    .closest(".site-md-code-block")
    ?.querySelector("pre code")?.textContent;
  if (code === undefined) return;
  try {
    await navigator.clipboard.writeText(code.replace(/\n$/, ""));
    button.textContent = "Copied";
    button.setAttribute("aria-label", "Code copied");
  } catch {
    button.textContent = "Copy unavailable";
    button.setAttribute("aria-label", "Select and copy the code below");
  }
}
onMounted(() => {
  mounted = true;
  enhance();
});
watch(html, () => {
  if (mounted) enhance();
});
onBeforeUnmount(() => {
  mounted = false;
  generation++;
});
</script>
<style scoped>
.sites-markdown {
  line-height: 1.8;
  overflow-wrap: anywhere;
  min-width: 0;
  color: inherit;
  text-align: inherit;
}
.sites-markdown :deep(h1),
.sites-markdown :deep(h2),
.sites-markdown :deep(h3),
.sites-markdown :deep(h4),
.sites-markdown :deep(h5),
.sites-markdown :deep(h6) {
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.025em;
  margin: 1.6em 0 0.65em;
  scroll-margin-top: 32px;
  color: inherit;
}
.sites-markdown :deep(h1) {
  font-size: 2.4em;
}
.sites-markdown :deep(h2) {
  font-size: 1.8em;
}
.sites-markdown :deep(h3) {
  font-size: 1.4em;
}
.sites-markdown :deep(h4) {
  font-size: 1.2em;
}
.sites-markdown :deep(h5),
.sites-markdown :deep(h6) {
  font-size: 1em;
}
.sites-markdown :deep(p),
.sites-markdown :deep(ul),
.sites-markdown :deep(ol),
.sites-markdown :deep(dl) {
  margin: 0 0 1.15em;
}
.sites-markdown :deep(ul) {
  list-style: disc;
  padding-left: 1.7em;
}
.sites-markdown :deep(ol) {
  list-style: decimal;
  padding-left: 1.7em;
}
.sites-markdown :deep(li > ul),
.sites-markdown :deep(li > ol) {
  margin-bottom: 0;
}
.sites-markdown :deep(li) {
  margin: 0.25em 0;
}
.sites-markdown :deep(input[type="checkbox"]) {
  margin-right: 0.5em;
  accent-color: var(--accent, #6658e8);
}
.sites-markdown :deep(strong),
.sites-markdown :deep(b) {
  font-weight: 700;
}
.sites-markdown :deep(em),
.sites-markdown :deep(i) {
  font-style: italic;
}
.sites-markdown :deep(del),
.sites-markdown :deep(s) {
  text-decoration: line-through;
}
.sites-markdown :deep(a) {
  color: var(--accent, var(--primary-color, #6658e8));
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
.sites-markdown :deep(a:focus-visible),
.sites-markdown :deep(button:focus-visible),
.sites-markdown :deep(summary:focus-visible),
.sites-markdown :deep([tabindex]:focus-visible) {
  outline: 2px solid var(--accent, #6658e8);
  outline-offset: 3px;
}
.sites-markdown :deep(blockquote) {
  margin: 1.5em 0;
  padding: 0.2em 1.2em;
  border-left: 3px solid var(--accent, #6658e8);
  background: color-mix(in srgb, currentColor 4%, transparent);
}
.sites-markdown :deep(blockquote p:last-child) {
  margin-bottom: 0;
}
.sites-markdown :deep(hr) {
  margin: 2em 0;
  border: 0;
  border-top: 1px solid #8885;
}
.sites-markdown :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 1.4em auto;
}
.sites-markdown :deep(video) {
  display: block;
  width: 100%;
  max-height: 650px;
  border-radius: 8px;
  margin: 1.4em 0;
}
.sites-markdown :deep(audio) {
  max-width: 100%;
  width: 100%;
  margin: 1.4em 0;
}
.sites-markdown :deep(iframe) {
  width: 100%;
  aspect-ratio: 16/9;
  border: 0;
  border-radius: 8px;
  margin: 1.4em 0;
}
.sites-markdown :deep(pre) {
  overflow: auto;
  padding: 1.2em;
  background: color-mix(in srgb, currentColor 5%, transparent);
  border: 1px solid #8883;
  border-radius: 8px;
  margin: 1.2em 0;
  font:
    0.88em/1.7 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  white-space: pre;
  overflow-wrap: normal;
}
.sites-markdown :deep(:not(pre) > code),
.sites-markdown :deep(kbd) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.88em;
  background: color-mix(in srgb, currentColor 8%, transparent);
  padding: 0.15em 0.35em;
  border-radius: 4px;
}
.sites-markdown :deep(pre code) {
  font-family: inherit;
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
}
.sites-markdown :deep(code::before),
.sites-markdown :deep(code::after) {
  content: none;
}
.sites-markdown :deep(.site-md-code-block) {
  border: 1px solid #8883;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5em 0;
}
.sites-markdown :deep(.site-md-code-block figcaption) {
  padding: 8px 14px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  font: 12px system-ui;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sites-markdown :deep(.site-md-code-block pre) {
  margin: 0;
  border: 0;
  border-radius: 0;
}
.sites-markdown :deep(.site-md-copy) {
  padding: 4px 8px;
  border: 1px solid #8884;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.sites-markdown :deep(.site-md-table) {
  max-width: 100%;
  overflow-x: auto;
  margin: 1.5em 0;
  border: 1px solid #8884;
  border-radius: 8px;
}
.sites-markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.93em;
}
.sites-markdown :deep(th),
.sites-markdown :deep(td) {
  padding: 0.65em 0.9em;
  border: 1px solid #8883;
  min-width: 100px;
}
.sites-markdown :deep(th) {
  font-weight: 650;
  background: color-mix(in srgb, currentColor 5%, transparent);
}
.sites-markdown :deep([align="right"]) {
  text-align: right;
}
.sites-markdown :deep([align="center"]) {
  text-align: center;
}
.sites-markdown :deep([align="left"]) {
  text-align: left;
}
.sites-markdown :deep(details) {
  margin: 1em 0;
  border: 1px solid #8884;
  padding: 12px 16px;
  border-radius: 8px;
}
.sites-markdown :deep(summary) {
  cursor: pointer;
  font-weight: 600;
}
.sites-markdown :deep(dt) {
  font-weight: 650;
}
.sites-markdown :deep(dd) {
  margin-left: 1.5em;
}
.sites-markdown :deep(sub) {
  vertical-align: sub;
  font-size: 0.8em;
}
.sites-markdown :deep(sup) {
  vertical-align: super;
  font-size: 0.8em;
}
.sites-markdown :deep(mark) {
  background: #fef08a;
  color: #292524;
  padding: 0 0.15em;
}
.sites-markdown :deep(.site-md-diagram) {
  margin: 1.5em 0;
  padding: 16px;
  border: 1px solid #8883;
  border-radius: 8px;
  overflow: auto;
}
.sites-markdown :deep(.site-md-diagram > figcaption) {
  font-size: 12px;
  opacity: 0.65;
  margin-bottom: 12px;
}
.sites-markdown :deep(.site-md-diagram-svg) {
  background: white;
  border-radius: 4px;
  padding: 12px;
  min-width: 200px;
}
.sites-markdown :deep(.site-md-diagram-svg svg) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: auto;
}
.sites-markdown :deep(.site-md-diagram-error) {
  font-size: 0.9em;
  opacity: 0.7;
}
.sites-markdown :deep(.site-md-diagram-code) {
  font-size: 0.9em;
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .sites-markdown :deep(h1) {
    font-size: 2em;
  }
  .sites-markdown :deep(pre) {
    padding: 12px;
  }
  .sites-markdown :deep(th),
  .sites-markdown :deep(td) {
    padding: 0.5em;
  }
  .sites-markdown :deep(.site-md-diagram) {
    padding: 10px;
  }
}
</style>
