// Run after `pnpm --filter foligo-sites build`. Uses a local mock API, not a database.
const http = require("node:http");
const { spawn } = require("node:child_process");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const assert = require("node:assert/strict");
(async () => {
  const root = resolve(__dirname, "../..");
  const { newSite, newBlock } = await import(
    pathToFileURL(resolve(root, "sites/utils/builder.mjs"))
  );
  const { newContentTemplate, contentTypes } = await import(
    pathToFileURL(resolve(root, "sites/utils/builder-content.mjs"))
  );
  const doc = newSite();
  doc.name = "Studio";
  doc.pages.push(
    ...contentTypes.flatMap((t) =>
      ["archive", "single"].map((k) => newContentTemplate(t.type, k)),
    ),
  );
  const archive = doc.pages.find(
    (p) => p.kind === "archive" && p.contentType === "BLOG",
  );
  archive.blocks[0].title = "Notes from the studio";
  archive.blocks[1].layout = "list";
  archive.blocks[1].pageSize = 1;
  const single = doc.pages.find(
    (p) => p.kind === "single" && p.contentType === "BLOG",
  );
  single.metaTitle = "{{title}} | {{siteName}}";
  const thanks = newBlock("text");
  thanks.title = "Thanks for reading";
  single.blocks.push(thanks);
  const content = {
    blogs: [
      {
        id: "b1",
        contentType: "BLOG",
        slug: "shared",
        title: "A published blog",
        excerpt: "Blog excerpt",
        content:
          "## A rich story\n\n**Bold blog text**\n\n<script>alert(1)</script>",
        status: "PUBLISHED",
      },
      {
        id: "b2",
        contentType: "BLOG",
        slug: "second",
        title: "Second blog",
        content: "Second body",
        status: "PUBLISHED",
      },
    ],
    projects: [
      {
        id: "p1",
        contentType: "PROJECT",
        slug: "shared",
        title: "A published project",
        content: "Project body",
        status: "PUBLISHED",
      },
    ],
    experiences: [],
    skills: [],
  };
  const api = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        project: { id: "p", name: "Studio" },
        siteConfig: { builderPublished: doc },
        content,
      }),
    );
  });
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  const port = Number(process.env.TEST_SITE_PORT || 4050);
  let logs = "";
  const server = spawn(process.execPath, ["sites/.output/server/index.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      NUXT_API_INTERNAL_URL: `http://127.0.0.1:${api.address().port}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => (logs += d));
  server.stderr.on("data", (d) => (logs += d));
  const get = (path) =>
    new Promise((resolve, reject) =>
      http
        .get(
          {
            hostname: "127.0.0.1",
            port,
            path,
            headers: { host: "test.foligo.org" },
          },
          (res) => {
            let text = "";
            res.on("data", (d) => (text += d));
            res.on("end", () => resolve({ status: res.statusCode, text }));
          },
        )
        .on("error", reject),
    );
  try {
    let home;
    for (let i = 0; i < 60; i++) {
      try {
        home = await get("/");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    assert(home, logs);
    assert.equal(home.status, 200);
    const list = await get("/blog");
    assert.equal(list.status, 200);
    assert(list.text.includes("Notes from the studio"));
    assert(list.text.includes("post-cards list"));
    assert(list.text.includes("Page 1 of 2"));
    const blog = await get("/blog/shared");
    assert.equal(blog.status, 200, blog.text);
    assert(blog.text.includes("<title>A published blog | Studio</title>"));
    assert(blog.text.includes("<strong>Bold blog text</strong>"));
    assert(blog.text.includes("Thanks for reading"));
    assert(!blog.text.includes("<script>alert(1)</script>"));
    const project = await get("/projects/shared");
    assert.equal(project.status, 200);
    assert(project.text.includes("A published project"));
    assert(
      !project.text
        .match(/<main[\s\S]*?<\/main>/)[0]
        .includes("Thanks for reading"),
    );
    assert.equal((await get("/blog/missing")).status, 404);
    assert.equal((await get("/blog/shared/extra")).status, 404);
    assert.equal((await get("/projects/second")).status, 404);
    const empty = await get("/skills");
    assert.equal(empty.status, 200);
    assert(empty.text.includes("No published posts yet."));
    console.log(
      "Content SSR passed: customized archives, per-type single templates, markdown, SEO, pagination, empty archives, and invalid post 404s.",
    );
  } finally {
    server.kill();
    await new Promise((r) => api.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
