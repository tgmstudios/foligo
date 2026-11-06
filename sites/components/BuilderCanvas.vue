<template>
  <div
    class="builder-site"
    :style="{
      '--accent': document.theme.accent,
      background: document.theme.background,
      color: document.theme.text,
      fontFamily: document.theme.font,
    }"
  >
    <nav class="site-nav">
      <a href="/" @click="navigate($event, '/')">{{ document.name }}</a>
      <div>
        <a
          v-for="p in navigation"
          :key="p.id"
          :href="p.path"
          @click="navigate($event, p.path)"
          >{{ p.name }}</a
        >
      </div>
    </nav>
    <main v-if="page">
      <section
        v-for="(b, index) in page.blocks"
        :key="b.id"
        :class="[
          'site-block',
          b.type,
          b.tone,
          { selected: editing && selected === b.id },
        ]"
        :style="{
          textAlign: b.align,
          padding: `${b.spacing}px clamp(20px, 5vw, 80px)`,
        }"
        :draggable="editing"
        :tabindex="editing ? 0 : undefined"
        @click="editing && $emit('select', b.id)"
        @keydown.enter="editing && $emit('select', b.id)"
        @dragstart.stop="startDrag($event, index)"
        @dragover.prevent
        @drop.stop.prevent="drop($event, index)"
      >
        <span v-if="editing" class="block-tag"
          >{{ b.type }} · drag to move</span
        >
        <template v-if="b.type === 'post-list'">
          <div :class="['post-cards', b.layout || 'grid']">
            <a
              v-for="post in paginated(b)"
              :key="post.id"
              :href="contentHref(post)"
              @click="followLink($event, contentHref(post))"
            >
              <img
                v-if="b.showImage !== false && post.featuredImage"
                :src="safeUrl(post.featuredImage)"
                :alt="post.title"
                loading="lazy"
              />
              <div class="post-card-copy">
                <time v-if="b.showDate !== false && post.createdAt">{{
                  postDate(post.createdAt)
                }}</time>
                <h2>{{ post.title }}</h2>
                <p v-if="b.showExcerpt !== false">{{ post.excerpt }}</p>
              </div>
            </a>
          </div>
          <p v-if="!items.length" class="block-copy">No published posts yet.</p>
          <div v-if="items.length > (b.pageSize || 9)" class="post-pagination">
            <button
              :disabled="currentPage(b) === 1"
              @click.stop="turnPage(b, -1)"
            >
              ← Previous</button
            ><span
              >Page {{ currentPage(b) }} of
              {{ Math.ceil(items.length / (b.pageSize || 9)) }}</span
            ><button
              :disabled="
                currentPage(b) >= Math.ceil(items.length / (b.pageSize || 9))
              "
              @click.stop="turnPage(b, 1)"
            >
              Next →
            </button>
          </div>
        </template>
        <template v-else-if="b.type === 'post-header' && item">
          <a
            class="post-back"
            :href="archivePath"
            @click="followLink($event, archivePath)"
            >← Back to {{ contentDefinition?.label }}</a
          >
          <time v-if="b.showDate !== false && item.createdAt">{{
            postDate(item.createdAt)
          }}</time>
          <h1>{{ item.title }}</h1>
          <p v-if="b.showExcerpt !== false" class="block-copy">
            {{ item.excerpt }}
          </p>
          <img
            v-if="b.showImage !== false && item.featuredImage"
            :src="safeUrl(item.featuredImage)"
            :alt="item.title"
          />
        </template>
        <SitesMarkdown
          v-else-if="b.type === 'post-content' && item"
          class="post-body"
          :content="item.content || ''"
        />
        <hr v-else-if="b.type === 'divider'" />
        <div v-else-if="b.type === 'spacer'" aria-hidden="true">&nbsp;</div>
        <template v-else-if="b.type === 'image'"
          ><img
            v-if="b.image"
            :src="safeUrl(b.image)"
            :alt="b.alt"
            loading="lazy"
          />
          <div v-else class="image-placeholder">
            Add an image in the inspector
          </div>
          <p v-if="b.text">{{ b.text }}</p></template
        >
        <template v-else-if="b.type === 'button'"
          ><a
            class="site-cta"
            :href="safeUrl(b.url)"
            @click="followLink($event, b.url)"
            :target="embedded ? '_blank' : undefined"
            rel="noopener noreferrer"
            >{{ b.label }}</a
          ></template
        >
        <template v-else>
          <p v-if="b.type === 'hero'" class="eyebrow">{{ document.name }}</p>
          <h1 v-if="b.type === 'hero'">{{ b.title }}</h1>
          <h2 v-else>{{ b.title }}</h2>
          <SitesMarkdown
            v-if="b.type === 'text'"
            class="block-copy"
            :content="b.text || ''"
          />
          <p v-else class="block-copy">{{ b.text }}</p>
          <div
            v-if="['features', 'gallery'].includes(b.type)"
            class="site-grid"
          >
            <article v-for="(item, i) in b.items" :key="i">
              <img
                v-if="b.type === 'gallery' && item.image"
                :src="safeUrl(item.image)"
                :alt="item.title"
                loading="lazy"
              /><span v-if="b.type === 'features'" class="feature-number"
                >0{{ i + 1 }}</span
              >
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </article>
          </div>
          <div v-if="b.type === 'faq'" class="site-faq">
            <details v-for="(item, i) in b.items" :key="i">
              <summary>{{ item.title }}</summary>
              <p>{{ item.text }}</p>
            </details>
          </div>
          <a
            v-if="['hero', 'contact'].includes(b.type)"
            class="site-cta"
            :href="safeUrl(b.url)"
            @click="followLink($event, b.url)"
            :target="embedded ? '_blank' : undefined"
            rel="noopener noreferrer"
            >{{ b.label }} <span aria-hidden="true">↗</span></a
          >
        </template>
      </section>
    </main>
    <main v-else class="missing-page">
      <h1>Page not found</h1>
      <a href="/">Return home</a>
    </main>
    <footer>© {{ new Date().getFullYear() }} {{ document.name }}</footer>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import {
  contentTypes,
  contentItems,
  contentHref,
  resolveBuilderContent,
  samplePost,
} from "../utils/builder-content.mjs";
import SitesMarkdown from "./SitesMarkdown.vue";
import { safeUrl } from "../utils/builder.mjs";
const props = defineProps({
  document: { type: Object, required: true },
  path: { type: String, default: "/" },
  editing: Boolean,
  embedded: Boolean,
  selected: String,
  templateId: String,
  previewPostId: String,
  collections: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["select", "move", "navigate", "insert"]);
const resolved = computed(() => {
  if (props.embedded) {
    const page =
      props.document.pages.find((p) => p.id === props.templateId) ||
      props.document.pages.find((p) => p.path === props.path);
    if (page) {
      const posts = contentItems(props.collections, page.contentType);
      return {
        page,
        items: posts,
        item:
          posts.find((p) => p.id === props.previewPostId) ||
          posts[0] ||
          samplePost(page.contentType),
      };
    }
  }
  return resolveBuilderContent(props.document, props.path, props.collections);
});
const page = computed(() => resolved.value?.page);
const items = computed(() => resolved.value?.items || []);
const item = computed(() => resolved.value?.item);
const contentDefinition = computed(() =>
  contentTypes.find((t) => t.type === page.value?.contentType),
);
const archivePath = computed(() => contentDefinition.value?.path || "/");
const navigation = computed(() => {
  const pages = props.document.pages.filter((p) => p.kind !== "single");
  return [
    ...pages,
    ...contentTypes
      .filter(
        (t) =>
          contentItems(props.collections, t.type).length &&
          !pages.some((p) => p.path === t.path),
      )
      .map((t) => ({ id: t.type, name: t.label, path: t.path })),
  ];
});
const pageNumbers = ref({});
watch(
  () => [props.path, props.templateId],
  () => {
    pageNumbers.value = {};
  },
);
function currentPage(b) {
  return Math.min(
    Math.max(1, Math.ceil(items.value.length / (b.pageSize || 9))),
    pageNumbers.value[b.id] || 1,
  );
}
function paginated(b) {
  const size = b.pageSize || 9;
  const start = (currentPage(b) - 1) * size;
  return items.value.slice(start, start + size);
}
function turnPage(b, delta) {
  pageNumbers.value[b.id] = Math.max(
    1,
    Math.min(
      Math.ceil(items.value.length / (b.pageSize || 9)),
      currentPage(b) + delta,
    ),
  );
}
function postDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}
function navigate(e, path) {
  if (props.editing || props.embedded) {
    e.preventDefault();
    emit("navigate", path);
  }
}
function followLink(e, url) {
  if (props.editing) {
    e.preventDefault();
    return;
  }
  if (
    props.embedded &&
    resolveBuilderContent(props.document, url, props.collections)
  ) {
    e.preventDefault();
    emit("navigate", url);
  }
}
function startDrag(e, index) {
  if (!props.editing) return;
  e.dataTransfer.setData("application/x-foligo-block", String(index));
  e.dataTransfer.effectAllowed = "move";
}
function drop(e, index) {
  if (!props.editing) return;
  const type = e.dataTransfer.getData("application/x-foligo-type");
  if (type) emit("insert", type, index);
  else {
    const from = e.dataTransfer.getData("application/x-foligo-block");
    if (from !== "") emit("move", Number(from), index);
  }
}
</script>
<style scoped>
.builder-site {
  min-height: 100%;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.site-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 24px 5%;
  border-bottom: 1px solid #8882;
}
.site-nav > a {
  font-weight: 800;
}
.site-nav div {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.builder-site a {
  color: inherit;
  text-decoration: none;
}
.site-block {
  position: relative;
}
.site-block.selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.block-tag {
  position: absolute;
  top: 0;
  left: 0;
  font: 11px sans-serif;
  background: var(--accent);
  color: white;
  padding: 4px 8px;
}
.site-block.dark {
  background: #20202a;
  color: #fff;
}
.site-block.accent {
  background: var(--accent);
  color: #fff;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 12px;
  margin-bottom: 24px;
}
h1 {
  font-size: clamp(36px, 5.5vw, 76px);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 1.06;
  max-width: 900px;
  margin: 0 auto 24px;
}
h2 {
  font-size: clamp(26px, 3vw, 40px);
  letter-spacing: -0.035em;
  font-weight: 600;
  margin: 0 0 16px;
}
h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 10px 0;
}
.block-copy {
  font-size: 18px;
  opacity: 0.8;
  max-width: 680px;
  white-space: pre-wrap;
  margin: 0 0 24px;
}
.hero .block-copy {
  margin: 0 auto 32px;
}
.site-cta {
  display: inline-flex;
  gap: 24px;
  padding: 13px 24px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff !important;
  font-weight: 600;
}
.accent .site-cta {
  background: #20202a;
}
.site-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 36px;
}
.site-grid article {
  padding: 24px;
  border: 1px solid #8883;
  border-radius: 12px;
}
.feature-number {
  color: var(--accent);
  font: 12px monospace;
}
.site-block img {
  max-width: 100%;
  max-height: 600px;
  object-fit: cover;
  border-radius: 12px;
  margin: auto;
}
.site-grid img {
  aspect-ratio: 4/3;
  object-fit: cover;
}
.image-placeholder {
  padding: 80px 20px;
  background: #8881;
  border: 1px dashed #8886;
  border-radius: 12px;
}
.site-faq details {
  padding: 16px 0;
  border-bottom: 1px solid #8883;
}
.site-faq summary {
  cursor: pointer;
  font-weight: 600;
}
.testimonial .block-copy {
  font:
    italic 26px Georgia,
    serif;
}
.builder-site footer {
  padding: 28px 5%;
  border-top: 1px solid #8883;
  font-size: 13px;
}
.missing-page {
  padding: 80px 5%;
}
@media (max-width: 600px) {
  .site-grid {
    grid-template-columns: 1fr;
  }
  .site-nav {
    align-items: flex-start;
    flex-direction: column;
  }
  .site-block {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }
}
@container (max-width:600px) {
  .site-grid {
    grid-template-columns: 1fr;
  }
  .site-nav {
    align-items: flex-start;
    flex-direction: column;
  }
  .site-block {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }
  h1 {
    font-size: 40px;
  }
}
.post-cards {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.post-cards > a {
  border: 1px solid #8883;
  border-radius: 12px;
  overflow: hidden;
}
.post-cards img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  border-radius: 0 !important;
}
.post-card-copy {
  padding: 24px;
}
.post-card-copy h2 {
  font-size: 24px;
}
.post-card-copy p {
  opacity: 0.8;
}
.post-cards.list {
  grid-template-columns: 1fr;
}
.post-cards.list > a {
  display: flex;
  gap: 24px;
}
.post-cards.list img {
  width: 30%;
  height: auto;
}
.post-pagination {
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
  margin-top: 30px;
}
.post-pagination button {
  border: 1px solid #8884;
  padding: 8px 12px;
  border-radius: 6px;
}
.post-pagination button:disabled {
  opacity: 0.4;
}
.post-header time,
.post-card-copy time {
  display: block;
  font-size: 12px;
  opacity: 0.65;
  margin-bottom: 16px;
}
.post-back {
  display: block;
  margin-bottom: 30px;
  color: var(--accent) !important;
}
.post-header h1 {
  margin-left: 0;
}
.post-body {
  max-width: 800px;
  margin: auto;
  line-height: 1.8;
}
.post-body :deep(h2),
.post-body :deep(h3) {
  margin-top: 1.5em;
}
.post-body :deep(p),
.post-body :deep(ul),
.post-body :deep(ol),
.post-body :deep(pre) {
  margin-bottom: 1.2em;
}
.post-body :deep(ul) {
  list-style: disc;
  padding-left: 24px;
}
.post-body :deep(ol) {
  list-style: decimal;
  padding-left: 24px;
}
.post-body :deep(a) {
  color: var(--accent);
  text-decoration: underline;
}
.post-body :deep(pre) {
  padding: 20px;
  background: #8881;
  overflow: auto;
  border-radius: 8px;
}
.post-body :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 20px;
  opacity: 0.8;
}
.post-body :deep(img) {
  max-width: 100%;
  height: auto;
}
@media (max-width: 600px) {
  .post-cards {
    grid-template-columns: 1fr;
  }
  .post-pagination {
    gap: 10px;
    font-size: 12px;
  }
}
@container (max-width:600px) {
  .post-cards {
    grid-template-columns: 1fr;
  }
  .post-cards.list > a {
    display: block;
  }
  .post-cards.list img {
    width: 100%;
  }
}
</style>
