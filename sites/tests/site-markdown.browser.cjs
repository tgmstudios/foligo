// Build Sites first; tests both public renderers against a local mock API.
const http = require("node:http");
const { spawn } = require("node:child_process");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const root = resolve(__dirname, "../..");
  const { newSite, newBlock } = await import(
    pathToFileURL(resolve(root, "sites/utils/builder.mjs"))
  );
  const source =
    '# Published formatting\n\n**Bold** *italic* ~~deleted~~ `inline` 🎉\n\n- [x] Complete\n- [ ] Pending\n\n| Feature | Value |\n| --- | ---: |\n| Rich text | **Works** |\n\n> A quotation\n\n1. First\n2. Second\n\n```html\n<script>example()</script>\n```\n\n```mermaid\nflowchart LR\n A[Start] --> B[Done]\n```\n\n```mermaid\nthis is not a diagram\n```\n\n![Exported diagram](/diagram.png)\n\n```drawio\nEDITOR_ONLY_XML\n```\n\n<video src="/clip.mp4" controls onplay="window.intextAttack=true"></video>\n\n<audio src="/clip.mp3" controls></audio>\n\n<u>Underlined text</u> H<sub>2</sub>O x<sup>2</sup> <mark>Marked</mark>\n\n<details><summary>Read more</summary><p>More detail</p></details>\n\n[Attached PDF](/resume.pdf)\n\n<script>window.intextAttack=true</script>\n\n<a href="javascript:alert(1)">Unsafe link</a>';
  let builder = true;
  const doc = newSite();
  doc.name = "Markdown fixture";
  const richText = newBlock('text'); richText.text = '**A rich page text block**';
  doc.pages.push({id:'about',name:'About',path:'/about',blocks:[richText]});
  const post = {
    id: "post",
    contentType: "BLOG",
    title: "Published post",
    slug: "post",
    content: source,
    status: "PUBLISHED",
  };
  const api = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        project: { id: "p", name: "Markdown fixture" },
        siteConfig: builder
          ? { builderPublished: doc }
          : { templateId: "studio", siteName: "Legacy fixture" },
        content: { blogs: [post], projects: [], experiences: [], skills: [] },
      }),
    );
  });
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  const port = Number(process.env.TEST_SITE_PORT || 4056),
    base = `http://localhost:${port}`;
  const server = spawn(process.execPath, ["sites/.output/server/index.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "0.0.0.0",
      NUXT_API_INTERNAL_URL: `http://127.0.0.1:${api.address().port}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  server.stdout.on("data", (d) => (logs += d));
  server.stderr.on("data", (d) => (logs += d));
  let browser;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(base + "/blog/post");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/diagram.png", (r) =>
      r.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      }),
    );
    await page.route(/\/clip\.(mp4|mp3)$/, (r) =>
      r.fulfill({ status: 204, body: "" }),
    );
    for (const mode of [true, false]) {
      builder = mode;
      await page.goto(base + "/blog/post", { waitUntil: "domcontentloaded" });
      const article = page.locator(".sites-markdown");
      await article
        .locator(".site-md-diagram-svg svg")
        .waitFor({ timeout: 30000 });
      await article.locator(".site-md-diagram-error").waitFor();
      assert.equal(
        await article.locator("table strong").textContent(),
        "Works",
      );
      assert.equal(await article.locator("input[type=checkbox]").count(), 2);
      assert.equal(
        await article.locator("input[type=checkbox]").first().isDisabled(),
        true,
      );
      assert.equal(await article.locator("video[controls]").count(), 1);
      assert.equal(await article.locator("audio[controls]").count(), 1);
      assert.equal(
        await article.locator('img[alt="Exported diagram"]').count(),
        1,
      );
      assert(!(await article.innerText()).includes("EDITOR_ONLY_XML"));
      assert.equal(await article.locator("u").textContent(), "Underlined text");
      assert.equal(await article.locator('a[href="/resume.pdf"]').count(), 1);
      assert.equal(await article.locator('a[href^="javascript:"]').count(), 0);
      assert.equal(await page.evaluate(() => window.intextAttack), undefined);
      await article
        .getByRole("button", { name: "Copy code", exact: true })
        .click();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        "<script>example()</script>",
      );
      await article
        .locator("details")
        .filter({
          has: page.locator("summary").getByText("Read more", { exact: true }),
        })
        .locator("summary")
        .click();
      await article.getByText("More detail", { exact: true }).waitFor();
      await page.setViewportSize({ width: 390, height: 900 });
      const table = article.locator(".site-md-table");
      assert(
        await table.evaluate((el) => el.getBoundingClientRect().width <= 390),
      );
      await page.setViewportSize({ width: 1200, height: 900 });
      if (mode) {
        await page.goto(base + '/about');
        assert.equal(await page.locator('.sites-markdown strong').textContent(), 'A rich page text block');
      }

    }
    assert.deepEqual(errors, []);
    console.log(
      "Sites Markdown browser passed for builder and legacy posts: diagrams and error fallbacks, Draw.io, tables, tasks, media, inline HTML, attachments, copy code, responsive layout, and inert unsafe HTML.",
    );
  } finally {
    await browser?.close();
    server.kill();
    await new Promise((r) => api.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
