<template>
  <div class="site-studio">
    <header class="studio-bar">
      <router-link to="/sites" class="back">←</router-link>
      <div class="brand-mark">
        <img :src="squiggleLogo" alt="Foligo" class="brand-logo" /><span
          >/ sites</span
        >
      </div>
      <span class="site-title">{{ doc?.name || "Site builder" }}</span
      ><span class="save-status" role="status">{{ status }}</span>
      <div class="bar-actions">
        <button :disabled="!canEdit || !past.length" @click="undo">
          ↶ Undo</button
        ><button :disabled="!canEdit || !future.length" @click="redo">
          ↷ Redo</button
        ><button @click="preview = !preview">
          {{ preview ? "Edit site" : "Preview" }}</button
        ><button :disabled="!canEdit || saving || conflict" @click="save">
          Save draft</button
        ><button
          class="primary"
          :disabled="!canPublish || saving || conflict"
          @click="publish"
        >
          Publish ↗
        </button>
      </div>
    </header>
    <div v-if="error" class="error" role="alert">
      {{ error }}
      <button v-if="conflict" @click="exportSite">Export my changes</button
      ><button @click="load">Reload saved site</button>
    </div>
    <div v-if="loading" class="loading">Opening your workspace…</div>
    <div v-else-if="doc" class="studio-body" :class="{ preview }">
      <aside v-if="!preview" class="left-panel">
        <div class="tabs">
          <SegmentedControl
            v-model="tab"
            :options="
              ['Build', 'Pages', 'Design', 'Media', 'Team', 'History'].map(
                (t) => ({ value: t, label: t }),
              )
            "
          />
        </div>
        <div v-if="tab === 'Build'" class="panel-content">
          <p class="kicker">YOUR TOOLKIT</p>
          <h2>A space for every idea.</h2>
          <p class="muted">Drag a block onto the canvas, or click to add.</p>
          <div class="block-library">
            <button
              v-for="(type, i) in availableBlocks"
              :key="type"
              :disabled="!canEdit"
              :draggable="canEdit"
              @dragstart="paletteDrag($event, type)"
              @click="insert(type)"
            >
              <span>{{
                ["◩", "T", "▧", "↗", "▦", "▥", "❞", "?", "✉", "―", "↕"][i] ||
                "▤"
              }}</span
              >{{ type.replaceAll("-", " ") }}
            </button>
          </div>
          <p class="kicker">LAYERS</p>
          <div
            v-for="(b, i) in page.blocks"
            :key="b.id"
            class="layer"
            :class="{ active: selected === b.id }"
          >
            <button @click="selected = b.id">
              {{ String(i + 1).padStart(2, "0") }} · {{ b.type }}</button
            ><button
              :disabled="!canEdit || i === 0"
              aria-label="Move up"
              @click="move(i, i - 1)"
            >
              ↑</button
            ><button
              :disabled="!canEdit || i === page.blocks.length - 1"
              aria-label="Move down"
              @click="move(i, i + 1)"
            >
              ↓
            </button>
          </div>
        </div>
        <div v-if="tab === 'Pages'" class="panel-content">
          <p class="kicker">SITE STRUCTURE</p>
          <div
            v-for="p in doc.pages.filter((p) => !p.kind || p.kind === 'page')"
            :key="p.id"
            class="page-row"
          >
            <button
              :class="{ active: pageId === p.id }"
              @click="
                pageId = p.id;
                selected = '';
              "
            >
              {{ p.name }} <small>{{ p.path }}</small></button
            ><button
              v-if="p.path !== '/'"
              :disabled="!canEdit"
              aria-label="Delete page"
              @click="deletePage(p.id)"
            >
              ×
            </button>
          </div>
          <p class="kicker">CONTENT TEMPLATES</p>
          <p class="muted">
            Design the listing and individual post layout for each content type.
          </p>
          <div
            v-for="type in contentTypes"
            :key="type.type"
            class="content-template-group"
          >
            <strong>{{ type.label }}</strong>
            <div class="inline-actions">
              <button
                v-for="kind in ['archive', 'single']"
                :key="kind"
                :disabled="
                  !canEdit &&
                  !doc.pages.some(
                    (p) => p.kind === kind && p.contentType === type.type,
                  )
                "
                :class="{
                  active: page.kind === kind && page.contentType === type.type,
                }"
                @click="editTemplate(type.type, kind)"
              >
                {{ kind === "archive" ? "Archive" : "Single post" }}
              </button>
            </div>
          </div>
          <p v-if="['archive', 'single'].includes(page.kind)" class="muted">
            Dynamic {{ page.kind }} template · {{ page.contentType }}. Changes
            apply to all published posts of this type.
          </p>
          <button :disabled="!canEdit" @click="addPage">+ Add page</button
          ><label
            >Page name<input
              :value="page.name"
              :disabled="!canEdit"
              @change="setPage('name', $event.target.value)" /></label
          ><label
            >URL path<input
              :value="page.path"
              :disabled="
                !canEdit ||
                page.path === '/' ||
                ['archive', 'single'].includes(page.kind)
              "
              @change="setPage('path', $event.target.value)" /></label
          ><label
            >SEO title<input
              :value="page.metaTitle"
              :disabled="!canEdit"
              @change="setPage('metaTitle', $event.target.value)" /></label
          ><label
            >SEO description<textarea
              :value="page.metaDescription"
              :disabled="!canEdit"
              @change="setPage('metaDescription', $event.target.value)"
            />
          </label>
          <p v-if="page.kind === 'single'" class="muted">
            SEO fields support <code v-pre>{{ title }}</code
            >, <code v-pre>{{ excerpt }}</code
            >, and <code v-pre>{{ siteName }}</code
            >. These fields use the current post automatically when left blank.
          </p>
        </div>
        <div v-if="tab === 'Design'" class="panel-content">
          <p class="kicker">MAKE IT YOURS</p>
          <label
            >Site name<input
              :value="doc.name"
              :disabled="!canEdit"
              @change="change(() => (doc.name = $event.target.value))" /></label
          ><label v-for="key in ['accent', 'background', 'text']" :key="key"
            >{{ key
            }}<input
              type="color"
              :value="doc.theme[key]"
              :disabled="!canEdit"
              @change="
                change(() => (doc.theme[key] = $event.target.value))
              " /></label
          ><label
            >Typography<select
              :value="doc.theme.font"
              :disabled="!canEdit"
              @change="change(() => (doc.theme.font = $event.target.value))"
            >
              <option>sans-serif</option>
              <option>serif</option>
              <option>monospace</option>
            </select></label
          >
          <p class="kicker">STARTING POINTS</p>
          <button
            v-for="t in ['studio', 'portfolio', 'business']"
            :key="t"
            class="template"
            :disabled="!canEdit"
            @click="applyTemplate(t)"
          >
            {{ t }} <span>↗</span></button
          ><button @click="exportSite">↓ Export site JSON</button
          ><label v-if="canEdit"
            >Import site JSON<input
              type="file"
              accept="application/json,.json"
              @change="importSite"
          /></label>
        </div>
        <div v-if="tab === 'Media'" class="panel-content">
          <p class="kicker">PROJECT MEDIA</p>
          <p class="muted">
            Upload an image, then select it to add an image section.
          </p>
          <label v-if="canEdit"
            >Upload image<input
              type="file"
              accept="image/*"
              :disabled="uploading"
              @change="uploadImage"
          /></label>
          <p v-if="uploading">Uploading…</p>
          <button @click="fetchMedia">Refresh library</button
          ><button
            v-for="m in media"
            :key="m.id"
            class="media-tile"
            :disabled="!canEdit"
            @click="insertImage(m)"
          >
            <img :src="m.publicUrl" :alt="m.altText || m.filename" /><span>{{
              m.filename
            }}</span>
          </button>
        </div>
        <div v-if="tab === 'Team'" class="panel-content">
          <p class="kicker">SHARED WORKSPACE</p>
          <h2>Better together.</h2>
          <p class="muted">
            Viewers preview. Editors build. Admins publish and manage members.
            The owner retains full access.
          </p>
          <p>
            Your role: <strong>{{ role }}</strong>
          </p>
          <div v-for="m in members" :key="m.userId" class="member">
            <strong>{{ m.user?.name || m.user?.email }}</strong
            ><small>{{ m.user?.email }}</small
            ><select
              :value="m.role"
              :disabled="!canPublish"
              @change="updateMember(m, $event.target.value)"
            >
              <option>VIEWER</option>
              <option>EDITOR</option>
              <option>ADMIN</option></select
            ><button v-if="canPublish" @click="removeMember(m)">Remove</button>
          </div>
          <form v-if="canPublish" @submit.prevent="addMember">
            <label
              >Existing member’s email<input
                v-model="memberEmail"
                type="email"
                required /></label
            ><label
              >Role<select v-model="memberRole">
                <option>VIEWER</option>
                <option>EDITOR</option>
                <option>ADMIN</option>
              </select></label
            ><button class="primary">Add teammate</button>
          </form>
          <p class="muted">
            Teammates must have a Foligo account. Saves detect concurrent edits;
            this editor does not merge live keystrokes.
          </p>
        </div>
        <div v-if="tab === 'History'" class="panel-content">
          <p class="kicker">PUBLISHED VERSIONS</p>
          <p class="muted">
            Restore a version to your draft, review it, then publish. The last
            10 publications are retained.
          </p>
          <div v-for="h in history" :key="h.revision" class="member">
            <strong>Revision {{ h.revision }}</strong
            ><small>{{ new Date(h.at).toLocaleString() }}</small
            ><button
              :disabled="!canEdit"
              @click="
                change(() => {
                  doc = copy(h.document);
                  pageId = doc.pages[0].id;
                  selected = '';
                })
              "
            >
              Restore to draft
            </button>
          </div>
          <p v-if="!history.length">No publications yet.</p>
          <button :disabled="!canPublish || saving" @click="unpublish">
            Unpublish site
          </button>
        </div>
      </aside>
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <span
            >{{ page.name }} <span class="muted">{{ page.path }}</span></span
          >
          <div>
            <button
              v-for="d in ['Desktop', 'Tablet', 'Mobile']"
              :key="d"
              :class="{ active: device === d }"
              @click="device = d"
            >
              {{ d }}
            </button>
          </div>
          <span class="muted">{{
            preview ? "Preview" : role === "VIEWER" ? "Read only" : "Draft"
          }}</span>
        </div>
        <div
          v-if="['archive', 'single'].includes(page.kind)"
          class="template-preview-bar"
        >
          <span
            >{{
              page.kind === "archive"
                ? "Archive template"
                : "Single post template"
            }}
            · {{ page.contentType }}</span
          ><label v-if="page.kind === 'single'"
            >Preview post<select v-model="previewPostId">
              <option value="">
                {{
                  previewPosts.length
                    ? "First published post"
                    : "Sample post (no published posts yet)"
                }}
              </option>
              <option
                v-for="post in previewPosts"
                :key="post.id"
                :value="post.id"
              >
                {{ post.title }}
              </option>
            </select></label
          ><span v-else class="muted"
            >{{ previewPosts.length }} published posts</span
          >
        </div>
        <div class="canvas-scroll">
          <div
            class="canvas-frame"
            :style="{
              width:
                device === 'Mobile'
                  ? '390px'
                  : device === 'Tablet'
                    ? '768px'
                    : '100%',
            }"
            @dragover.prevent
            @drop.prevent="canvasDrop"
          >
            <BuilderCanvas
              embedded
              :document="doc"
              :template-id="page.id"
              :collections="collections"
              :preview-post-id="previewPostId"
              :path="page.path"
              :editing="!preview && canEdit"
              :selected="selected"
              @select="selected = $event"
              @move="move"
              @insert="insert"
              @navigate="navigate"
            /><button
              v-if="!preview && canEdit"
              class="add-section"
              @click="insert('text')"
            >
              + Add a section
            </button>
          </div>
        </div>
        <div class="canvas-bottom">
          {{ doc.pages.length }} pages <span>·</span>
          {{ page.blocks.length }} blocks <span>·</span> Changes go live when
          you publish
        </div>
      </div>
      <aside v-if="!preview" class="inspector">
        <div class="panel-content">
          <p class="kicker">INSPECTOR</p>
          <template v-if="block"
            ><h2>{{ block.type }}</h2>
            <div class="inline-actions">
              <button :disabled="!canEdit" @click="duplicate">Duplicate</button
              ><button :disabled="!canEdit" @click="removeBlock">Delete</button>
            </div>
            <label v-for="key in textFields" :key="key"
              >{{ key
              }}<textarea
                v-if="key === 'text'"
                :value="block[key]"
                :disabled="!canEdit"
                rows="4"
                @change="setBlock(key, $event.target.value)" /><input
                v-else
                :value="block[key]"
                :disabled="!canEdit"
                @change="setBlock(key, $event.target.value)"
            /></label>
            <p v-if="block.type === 'text'" class="muted">
              Markdown supported: formatting, tables, code, diagrams, images,
              and media.
            </p>
            <template v-if="block.type.startsWith('post-')"
              ><p class="muted">
                This block uses the current post type’s published content
                automatically.
              </p>
              <template v-if="block.type !== 'post-content'"
                ><label
                  v-for="key in ['showImage', 'showExcerpt', 'showDate']"
                  :key="key"
                  >{{
                    {
                      showImage: "Show featured image",
                      showExcerpt: "Show excerpt",
                      showDate: "Show date",
                    }[key]
                  }}<input
                    type="checkbox"
                    :checked="block[key] !== false"
                    :disabled="!canEdit"
                    @change="
                      setBlock(key, $event.target.checked)
                    " /></label></template
              ><template v-if="block.type === 'post-list'"
                ><label
                  >Post list layout<select
                    :value="block.layout || 'grid'"
                    :disabled="!canEdit"
                    @change="setBlock('layout', $event.target.value)"
                  >
                    <option>grid</option>
                    <option>list</option>
                  </select></label
                ><label
                  >Posts per page<input
                    type="number"
                    min="1"
                    max="48"
                    :value="block.pageSize || 9"
                    :disabled="!canEdit"
                    @change="
                      setBlock('pageSize', Number($event.target.value))
                    " /></label></template
            ></template>
            <label
              >Alignment<select
                :value="block.align"
                :disabled="!canEdit"
                @change="setBlock('align', $event.target.value)"
              >
                <option>left</option>
                <option>center</option>
                <option>right</option>
              </select></label
            ><label
              >Color treatment<select
                :value="block.tone"
                :disabled="!canEdit"
                @change="setBlock('tone', $event.target.value)"
              >
                <option>light</option>
                <option>dark</option>
                <option>accent</option>
              </select></label
            ><label
              >Section spacing · {{ block.spacing }} px<input
                type="range"
                min="0"
                max="160"
                step="8"
                :value="block.spacing"
                :disabled="!canEdit"
                @change="
                  setBlock('spacing', Number($event.target.value))
                " /></label
            ><template
              v-if="['features', 'gallery', 'faq'].includes(block.type)"
              ><p class="kicker">ITEMS</p>
              <div
                v-for="(item, i) in block.items"
                :key="i"
                class="item-editor"
              >
                <label
                  >Title<input
                    :value="item.title"
                    :disabled="!canEdit"
                    @change="setItem(i, 'title', $event.target.value)" /></label
                ><label
                  >Text<textarea
                    :value="item.text"
                    :disabled="!canEdit"
                    @change="setItem(i, 'text', $event.target.value)"
                  /></label
                ><label v-if="block.type === 'gallery'"
                  >Image URL<input
                    :value="item.image"
                    :disabled="!canEdit"
                    @change="setItem(i, 'image', $event.target.value)" /></label
                ><button
                  :disabled="!canEdit"
                  @click="change(() => block.items.splice(i, 1))"
                >
                  Remove item
                </button>
              </div>
              <button
                :disabled="!canEdit || block.items.length >= 30"
                @click="
                  change(() =>
                    block.items.push({
                      title: 'New item',
                      text: 'Your description',
                      image: '',
                    }),
                  )
                "
              >
                + Add item
              </button></template
            ></template
          ><template v-else
            ><h2>The details matter.</h2>
            <p class="muted">
              Select a section on the canvas to edit its content, spacing, and
              appearance.
            </p>
            <div class="inspector-tip">
              Tip: use the layer arrows to reorder sections with a keyboard or
              on a touch screen.
            </div></template
          >
        </div>
      </aside>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import squiggleLogo from "@/assets/logos/squiggle.svg";
import SegmentedControl from "@/components/shared/SegmentedControl.vue";
import api from "@/services/api";
import {
  contentTypes,
  newContentTemplate,
  contentItems,
  resolveBuilderContent,
} from "../../../../sites/utils/builder-content.mjs";
import { uploadMedia, listMedia } from "@/services/media";
import { validateDocument } from "../../../../sites/utils/builder-validation.mjs";
import BuilderCanvas from "../../../../sites/components/BuilderCanvas.vue";
import {
  newSite,
  newBlock,
  blockTypes,
} from "../../../../sites/utils/builder.mjs";
const id = String(useRoute().params.id),
  doc = ref(null),
  pageId = ref(""),
  selected = ref(""),
  role = ref("VIEWER"),
  revision = ref(0),
  history = ref([]),
  members = ref([]);
const loading = ref(true),
  saving = ref(false),
  error = ref(""),
  status = ref(""),
  conflict = ref(false),
  dirty = ref(false),
  preview = ref(false),
  tab = ref("Build"),
  device = ref("Desktop"),
  past = ref([]),
  future = ref([]),
  memberEmail = ref(""),
  memberRole = ref("EDITOR"),
  media = ref([]),
  uploading = ref(false),
  collections = ref({}),
  previewPostId = ref("");
const copy = (v) => JSON.parse(JSON.stringify(v)),
  canEdit = computed(() => ["OWNER", "ADMIN", "EDITOR"].includes(role.value)),
  canPublish = computed(() => ["OWNER", "ADMIN"].includes(role.value)),
  page = computed(
    () =>
      doc.value.pages.find((p) => p.id === pageId.value) || doc.value.pages[0],
  ),
  block = computed(() =>
    page.value.blocks.find((b) => b.id === selected.value),
  );
const previewPosts = computed(() =>
  contentItems(collections.value, page.value.contentType),
);
const availableBlocks = computed(() =>
  blockTypes.filter(
    (type) =>
      !type.startsWith("post-") ||
      (page.value.kind === "archive"
        ? type === "post-list"
        : page.value.kind === "single" && type !== "post-list"),
  ),
);
const textFields = computed(() =>
  block.value
    ? {
        image: ["image", "alt", "text"],
        button: ["label", "url"],
        hero: ["title", "text", "label", "url"],
        contact: ["title", "text", "label", "url"],
        divider: [],
        spacer: [],
        "post-list": [],
        "post-header": [],
        "post-content": [],
      }[block.value.type] || ["title", "text"]
    : [],
);
let timer;
async function load() {
  if (
    dirty.value &&
    !window.confirm("Reload and discard unsaved local changes?")
  )
    return;
  loading.value = true;
  error.value = "";
  try {
    const [r, m] = await Promise.all([
      api.get(`/projects/${id}/site-builder`),
      api.get(`/projects/${id}/members`),
    ]);
    doc.value = r.data.builderDraft || newSite();
    if (!r.data.builderDraft && r.data.siteName)
      doc.value.name = r.data.siteName;
    role.value = r.data.role;
    revision.value = r.data.builderRevision || 0;
    history.value = r.data.builderHistory || [];
    members.value = m.data;
    pageId.value = doc.value.pages[0].id;
    dirty.value = false;
    conflict.value = false;
    past.value = [];
    future.value = [];
    status.value = "Draft ready";
    fetchMedia();
    fetchPreviewContent();
  } catch (e) {
    error.value = e.response?.data?.error || "Could not open site";
  } finally {
    loading.value = false;
  }
}
function change(fn) {
  if (!canEdit.value) return;
  past.value.push(copy(doc.value));
  if (past.value.length > 80) past.value.shift();
  future.value = [];
  fn();
  changed();
}
async function fetchPreviewContent() {
  try {
    const { data } = await api.get(`/projects/${id}`);
    const posts = (data.content || []).filter((p) => p.status === "PUBLISHED");
    collections.value = Object.fromEntries(
      contentTypes.map((t) => [
        t.collection,
        posts.filter((p) => p.contentType === t.type),
      ]),
    );
  } catch {
    error.value =
      "Could not load content previews. Templates can still be edited with sample content.";
  }
}
function editTemplate(type, kind) {
  let template = doc.value.pages.find(
    (p) => p.contentType === type && p.kind === kind,
  );
  if (!template) {
    if (!canEdit.value) return;
    if (
      doc.value.pages.some(
        (p) =>
          p.path ===
          contentTypes.find((t) => t.type === type).path +
            (kind === "single" ? "/:slug" : ""),
      )
    ) {
      error.value =
        "A static page already uses this content URL. Rename or remove it before creating this template.";
      return;
    }
    change(() => {
      template = newContentTemplate(type, kind);
      doc.value.pages.push(template);
    });
  }
  pageId.value = template.id;
  selected.value = "";
  previewPostId.value = "";
  tab.value = "Pages";
}
function changed() {
  dirty.value = true;
  status.value = "Unsaved changes";
  clearTimeout(timer);
  if (!conflict.value) timer = setTimeout(save, 1500);
}
function undo() {
  if (!past.value.length) return;
  future.value.push(copy(doc.value));
  doc.value = past.value.pop();
  selected.value = "";
  changed();
}
function redo() {
  if (!future.value.length) return;
  past.value.push(copy(doc.value));
  doc.value = future.value.pop();
  selected.value = "";
  changed();
}
function insert(type, index = page.value.blocks.length) {
  if (!availableBlocks.value.includes(type)) return;
  change(() => {
    const b = newBlock(type);
    page.value.blocks.splice(index, 0, b);
    selected.value = b.id;
  });
}
function move(from, to) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= page.value.blocks.length ||
    to >= page.value.blocks.length
  )
    return;
  change(() => {
    const [b] = page.value.blocks.splice(from, 1);
    page.value.blocks.splice(to, 0, b);
  });
}
function paletteDrag(e, type) {
  e.dataTransfer.setData("application/x-foligo-type", type);
  e.dataTransfer.effectAllowed = "copy";
}
function canvasDrop(e) {
  const type = e.dataTransfer.getData("application/x-foligo-type");
  if (type) insert(type);
}
function setBlock(key, value) {
  change(() => (block.value[key] = value));
}
function setItem(i, key, value) {
  change(() => (block.value.items[i][key] = value));
}
function setPage(key, value) {
  change(() => (page.value[key] = value));
}
function duplicate() {
  change(() => {
    const b = copy(block.value);
    b.id = crypto.randomUUID();
    page.value.blocks.splice(page.value.blocks.indexOf(block.value) + 1, 0, b);
    selected.value = b.id;
  });
}
function removeBlock() {
  change(() => {
    page.value.blocks = page.value.blocks.filter(
      (b) => b.id !== selected.value,
    );
    selected.value = "";
  });
}
function addPage() {
  change(() => {
    let n = doc.value.pages.length + 1;
    while (doc.value.pages.some((p) => p.path === `/page-${n}`)) n++;
    const p = {
      id: crypto.randomUUID(),
      name: `Page ${n}`,
      path: `/page-${n}`,
      metaTitle: "",
      metaDescription: "",
      blocks: [],
    };
    doc.value.pages.push(p);
    pageId.value = p.id;
    selected.value = "";
  });
}
function deletePage(pid) {
  if (!window.confirm("Delete this page? You can undo this.")) return;
  change(() => {
    doc.value.pages = doc.value.pages.filter((p) => p.id !== pid);
    pageId.value = doc.value.pages[0].id;
    selected.value = "";
  });
}
function navigate(path) {
  const resolved = resolveBuilderContent(doc.value, path, collections.value);
  if (!resolved) return;
  if (!doc.value.pages.some((p) => p.id === resolved.page.id)) {
    if (!canEdit.value) return;
    change(() => doc.value.pages.push(resolved.page));
  }
  pageId.value = resolved.page.id;
  previewPostId.value = resolved.item?.id || "";
  selected.value = "";
}
function applyTemplate(t) {
  if (
    window.confirm("Replace your draft with this template? You can undo this.")
  )
    change(() => {
      doc.value = newSite(t);
      pageId.value = doc.value.pages[0].id;
      selected.value = "";
    });
}
async function save() {
  clearTimeout(timer);
  if (saving.value) {
    if (dirty.value) timer = setTimeout(save, 1500);
    return false;
  }
  if (conflict.value || !canEdit.value) return false;
  saving.value = true;
  error.value = "";
  const snapshot = JSON.stringify(doc.value);
  try {
    validateDocument(doc.value);
    const r = await api.put(`/projects/${id}/site-builder`, {
      document: JSON.parse(snapshot),
      revision: revision.value,
    });
    revision.value = r.data.builderRevision;
    dirty.value = JSON.stringify(doc.value) !== snapshot;
    status.value = dirty.value ? "Unsaved changes" : "All changes saved";
    if (dirty.value) timer = setTimeout(save, 1500);
    return !dirty.value;
  } catch (e) {
    conflict.value = e.response?.status === 409;
    error.value =
      e.response?.data?.error ||
      e.message ||
      "Save failed. Your changes are still in this tab.";
    status.value = "Save failed";
    return false;
  } finally {
    saving.value = false;
  }
}
async function publish() {
  if (!(await save())) return;
  saving.value = true;
  try {
    const r = await api.post(`/projects/${id}/site-builder/publish`, {
      revision: revision.value,
    });
    revision.value = r.data.builderRevision;
    history.value = r.data.builderHistory;
    status.value = "Site published";
  } catch (e) {
    conflict.value = e.response?.status === 409;
    error.value = e.response?.data?.error || "Publish failed";
  } finally {
    saving.value = false;
  }
}
async function unpublish() {
  if (!window.confirm("Take this site offline?")) return;
  try {
    await api.post(`/projects/${id}/publish`, { isPublished: false });
    status.value = "Site unpublished";
  } catch (e) {
    error.value = e.response?.data?.error || "Unable to unpublish";
  }
}
function exportSite() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(doc.value, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "site.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importSite(e) {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) throw Error("File is too large");
    const d = JSON.parse(await file.text());
    validateDocument(d);
    if (
      d.version !== 1 ||
      !d.theme ||
      !Array.isArray(d.pages) ||
      !d.pages.length ||
      d.pages.some((p) => !Array.isArray(p.blocks))
    )
      throw Error("Invalid site document");
    if (window.confirm("Replace the draft with this file?"))
      change(() => {
        doc.value = d;
        pageId.value = d.pages[0].id;
        selected.value = "";
      });
  } catch (e) {
    error.value = e.message;
  }
  e.target.value = "";
}
async function fetchMedia() {
  try {
    media.value = (
      await listMedia({ projectId: id, mimeType: "image", limit: 100 })
    ).media;
  } catch (e) {
    error.value = e.response?.data?.error || "Could not load media";
  }
}
function insertImage(m) {
  change(() => {
    const b = newBlock("image");
    b.image = m.publicUrl;
    b.alt = m.altText || m.filename;
    b.text = "";
    page.value.blocks.push(b);
    selected.value = b.id;
  });
}
async function uploadImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  uploading.value = true;
  try {
    const m = await uploadMedia(file, id);
    media.value.unshift(m);
    insertImage(m);
  } catch (e) {
    error.value = e.response?.data?.error || "Upload failed";
  } finally {
    uploading.value = false;
    e.target.value = "";
  }
}
async function refreshMembers() {
  members.value = (await api.get(`/projects/${id}/members`)).data;
}
async function addMember() {
  try {
    await api.post(`/projects/${id}/members`, {
      email: memberEmail.value,
      role: memberRole.value,
    });
    memberEmail.value = "";
    await refreshMembers();
  } catch (e) {
    error.value = e.response?.data?.message || "Could not add teammate";
  }
}
async function updateMember(m, r) {
  try {
    await api.put(`/projects/${id}/members/${m.userId}`, { role: r });
    await refreshMembers();
  } catch (e) {
    error.value = e.response?.data?.message || "Could not update role";
  }
}
async function removeMember(m) {
  if (!window.confirm("Remove this teammate’s access?")) return;
  try {
    await api.delete(`/projects/${id}/members/${m.userId}`);
    await refreshMembers();
  } catch (e) {
    error.value = e.response?.data?.message || "Could not remove teammate";
  }
}
function beforeUnload(e) {
  if (dirty.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
function shortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    save();
  }
  if (
    (e.ctrlKey || e.metaKey) &&
    e.key === "z" &&
    !["INPUT", "TEXTAREA"].includes(e.target.tagName)
  ) {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  }
}
onMounted(() => {
  load();
  window.addEventListener("beforeunload", beforeUnload);
  window.addEventListener("keydown", shortcuts);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  window.removeEventListener("beforeunload", beforeUnload);
  window.removeEventListener("keydown", shortcuts);
});
onBeforeRouteLeave(
  () =>
    !dirty.value ||
    window.confirm(
      "Leave with unsaved changes? Export your work first if a save failed.",
    ),
);
</script>
<style scoped>
.media-tile {
  width: 100%;
  margin-top: 12px;
  text-align: left;
}
.media-tile img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 5px;
}
.media-tile span {
  display: block;
  overflow-wrap: anywhere;
  margin-top: 6px;
}
.template-preview-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 0 24px 12px;
  color: #7768cb;
}
.template-preview-bar label {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0;
  gap: 12px;
}
.content-template-group {
  border-bottom: 1px solid #eee;
  padding-top: 12px;
}
.site-studio {
  height: 100dvh;
  background: var(--canvas);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  font:
    13px/1.5 var(--font-text),
    system-ui,
    sans-serif;
}
.studio-bar {
  animation: fade-in 240ms ease-out backwards;
  min-height: 72px;
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 12px 24px;
  background: var(--surface);
  box-shadow: var(--shadow-1);
  flex-wrap: wrap;
}
.back {
  font-size: 22px;
  color: var(--muted);
}
.brand-mark {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  height: 28px;
  width: auto;
}
.brand-mark span {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.site-title {
  border-left: 1px solid var(--hairline);
  padding-left: 20px;
}
.save-status {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--faint);
}
.bar-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
button {
  border: 0;
  border-radius: var(--r-md);
  padding: 8px 11px;
  background: var(--surface-hover);
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  box-shadow: var(--ring);
  transition:
    background 0.16s ease,
    transform 0.14s var(--ease-out);
}
button:hover {
  background: var(--hairline);
}
button:active:not(:disabled) {
  transform: scale(0.97);
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
button.primary {
  position: relative;
  isolation: isolate;
  background: var(--primary);
  color: white;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.14),
    0 1px 2px rgb(0 0 0 / 0.3);
}
button.primary::after {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  background: var(--thread);
  filter: blur(14px);
  opacity: 0;
  transition: opacity 260ms ease;
}
.studio-body {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr) 260px;
  flex: 1;
  min-height: 0;
}
.studio-body.preview {
  grid-template-columns: 1fr;
}
.left-panel,
.inspector {
  background: var(--surface);
  overflow: auto;
}
.left-panel {
  border-right: 1px solid var(--hairline);
}
.inspector {
  border-left: 1px solid var(--hairline);
}
.panel-content {
  padding: 22px;
  animation: enter-rise 260ms var(--ease-out) backwards;
}
.panel-content > * {
  animation: enter-rise 300ms var(--ease-out) backwards;
}
.panel-content > :nth-child(2) {
  animation-delay: 40ms;
}
.panel-content > :nth-child(3) {
  animation-delay: 80ms;
}
.panel-content > :nth-child(4) {
  animation-delay: 120ms;
}
.panel-content > :nth-child(5) {
  animation-delay: 160ms;
}
.panel-content > :nth-child(n + 6) {
  animation-delay: 200ms;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 12px;
  gap: 4px;
  border-bottom: 1px solid var(--hairline);
}
.tabs :deep(.seg-button) {
  background: transparent;
  box-shadow: none;
  padding: 7px;
}
.active {
  background: var(--pale-iris) !important;
  color: var(--primary-ink) !important;
}
.kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--faint);
  margin: 12px 0 16px;
}
h2 {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: -0.4px;
  margin-bottom: 12px;
  text-transform: none;
}
.muted {
  color: var(--muted);
  font-size: 12px;
}
.block-library {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 22px 0 30px;
}
.block-library > * {
  animation: pop-in 260ms var(--ease-out) backwards;
}
.block-library > :nth-child(2) {
  animation-delay: 40ms;
}
.block-library > :nth-child(3) {
  animation-delay: 80ms;
}
.block-library > :nth-child(4) {
  animation-delay: 120ms;
}
.block-library > :nth-child(n + 5) {
  animation-delay: 160ms;
}
.block-library button {
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: capitalize;
  padding: 14px 10px;
}
.block-library span {
  font-size: 20px;
  color: var(--iris);
}
.layer {
  animation: blur-in 220ms ease-out backwards;
  display: flex;
  margin: 5px 0;
  border-radius: 6px;
}
.layer button {
  background: transparent;
  box-shadow: none;
  padding: 7px;
}
.layer button:first-child {
  flex: 1;
  text-align: left;
  text-transform: capitalize;
}
.canvas-area {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 24px;
}
.canvas-toolbar button {
  background: transparent;
  box-shadow: none;
}
.canvas-scroll {
  overflow: auto;
  flex: 1;
  padding: 12px 30px 30px;
}
.canvas-frame {
  animation: materialize 560ms var(--ease-out) backwards;
  margin: 0 auto;
  background: white;
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08),
    0 24px 60px -20px rgb(0 0 0 / 0.7);
  min-height: 100%;
  max-width: 100%;
  container-type: inline-size;
}
.canvas-bottom {
  padding: 12px 30px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  display: flex;
  gap: 12px;
}
.add-section {
  width: calc(100% - 40px);
  margin: 20px;
  border-style: dashed;
  color: var(--iris);
}
.inline-actions {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 16px 0;
  text-transform: capitalize;
  font-size: 11px;
  color: var(--muted);
}
input,
textarea,
select {
  width: 100%;
  border: 0;
  background: var(--canvas);
  color: var(--ink);
  border-radius: var(--r-md);
  padding: 9px;
  font-size: 12px;
  box-shadow: inset 0 0 0 1px var(--hairline);
  transition: box-shadow 0.16s ease;
}
input:focus,
textarea:focus,
select:focus {
  outline: none;
  box-shadow:
    inset 0 0 0 1px var(--iris-strong),
    var(--focus-ring);
}
input[type="color"] {
  height: 40px;
  padding: 4px;
}
input[type="range"] {
  padding: 0;
}
.inspector-tip {
  margin-top: 30px;
  padding: 18px;
  background: var(--pale-iris);
  border-radius: var(--r-lg);
  color: var(--primary-ink);
  font-size: 12px;
}
.page-row {
  display: flex;
  margin: 8px 0;
}
.page-row > button:first-child {
  flex: 1;
  text-align: left;
}
.page-row small,
.member small {
  display: block;
  color: var(--faint);
}
.template {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 10px 0;
  text-transform: capitalize;
  padding: 18px;
}
.member,
.item-editor {
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
}
.member select {
  margin: 8px 0;
}
.error {
  animation: message-in 340ms var(--ease-out) backwards;
  padding: 12px 24px;
  background: var(--pale-danger);
  color: var(--danger);
}
.error button {
  margin-left: 12px;
}
.loading {
  margin: auto;
  background: linear-gradient(
      90deg,
      var(--muted) 0%,
      var(--muted) 38%,
      var(--ink) 50%,
      var(--muted) 62%,
      var(--muted) 100%
    )
    0 0 / 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: text-shimmer 2.2s linear infinite;
}
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--iris-strong);
  outline-offset: 2px;
}
@media (hover: hover) and (pointer: fine) {
  button.primary:hover:not(:disabled)::after {
    opacity: 0.45;
  }
  .block-library button:hover,
  .template:hover {
    transform: translateY(-2px);
    box-shadow:
      var(--shadow-2),
      0 12px 28px -14px rgb(139 120 224 / 0.4);
  }
  .block-library button:hover span {
    transform: scale(1.15) rotate(6deg);
  }
}
.block-library span {
  transition: transform 220ms var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
  .canvas-frame,
  .panel-content > *,
  .block-library > * {
    animation: fade-in 200ms ease-out backwards;
  }
  .loading {
    animation: none;
    color: var(--muted);
    background: none;
  }
  button:active:not(:disabled),
  .block-library button:hover,
  .template:hover {
    transform: none;
  }
}
@media (max-width: 1100px) {
  .studio-body {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .inspector {
    grid-column: 1/-1;
    max-height: 300px;
    border-top: 1px solid var(--hairline);
  }
  .studio-body {
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .canvas-scroll {
    padding: 10px;
  }
  .bar-actions {
    gap: 4px;
  }
  .studio-bar {
    gap: 10px;
  }
}
@media (max-width: 700px) {
  .studio-bar {
    padding: 10px;
  }
  .site-title,
  .save-status {
    display: none;
  }
  .bar-actions {
    flex-wrap: wrap;
  }
  .studio-body {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
  .left-panel {
    max-height: 300px;
    flex-shrink: 0;
  }
  .canvas-area {
    min-height: 600px;
    flex-shrink: 0;
  }
  .inspector {
    max-height: none;
    overflow: visible;
  }
  .canvas-toolbar {
    padding: 12px;
  }
  .canvas-toolbar > span:last-child {
    display: none;
  }
}
</style>
