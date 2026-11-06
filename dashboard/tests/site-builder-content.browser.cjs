const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1500, height: 1100 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let saved = null,
      revision = 0;
    const posts = [
      {
        id: "blog1",
        title: "First blog story",
        excerpt: "First excerpt",
        content: "## Rich content\n\n**Bold body** <script>alert(1)</script>",
        contentType: "BLOG",
        slug: "first",
        status: "PUBLISHED",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "blog2",
        title: "Second blog story",
        content: "Second post body",
        contentType: "BLOG",
        slug: "second",
        status: "PUBLISHED",
      },
      {
        id: "draft",
        title: "Private draft",
        content: "PRIVATE BODY",
        contentType: "BLOG",
        slug: "private",
        status: "DRAFT",
      },
    ];
    await page.addInitScript(() => localStorage.setItem("auth_token", "test"));
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname,
        method = route.request().method();
      let data = [];
      if (path === "/api/auth/me")
        data = {
          id: "owner",
          name: "Owner",
          email: "owner@example.com",
          hasCompletedOnboarding: true,
        };
      else if (path.endsWith("/site-builder/publish"))
        data = { builderRevision: ++revision, builderHistory: [] };
      else if (path.endsWith("/site-builder")) {
        if (method === "PUT") {
          const b = route.request().postDataJSON();
          assert.equal(b.revision, revision);
          saved = b.document;
          data = { builderRevision: ++revision };
        } else
          data = {
            role: "OWNER",
            builderDraft: saved,
            builderRevision: revision,
            builderHistory: [],
          };
      } else if (path === "/api/projects/p") data = { id: "p", content: posts };
      else if (path.endsWith("/members")) data = [];
      else if (path.endsWith("/media")) data = { media: [] };
      else if (path === "/api/projects")
        data = { ownedProjects: [], memberProjects: [] };
      await route.fulfill({ json: data });
    });
    await page.goto(
      (process.argv[2] || "http://127.0.0.1:5173") + "/site-builder/p",
    );
    await page.getByRole("button", { name: "Pages", exact: true }).click();
    const blogs = page
      .locator(".content-template-group")
      .filter({ hasText: "Blog posts" });
    await blogs.getByRole("button", { name: "Archive", exact: true }).click();
    await page
      .locator(".post-cards")
      .getByRole("heading", { name: "First blog story", exact: true })
      .waitFor();
    assert.equal(
      await page.getByText("Private draft", { exact: true }).count(),
      0,
    );
    await page.locator(".site-block.post-list .block-tag").click();
    await page
      .getByLabel("Post list layout", { exact: false })
      .selectOption("list");
    await page.getByLabel("Posts per page", { exact: true }).fill("1");
    await page.getByLabel("Posts per page", { exact: true }).press("Tab");
    await page
      .locator(".post-pagination")
      .getByRole("button", { name: "Next →", exact: true })
      .click();
    await page
      .locator(".post-cards")
      .getByRole("heading", { name: "Second blog story" })
      .waitFor();
    await page.getByLabel("Posts per page", { exact: true }).fill("9");
    await page.getByLabel("Posts per page", { exact: true }).press("Tab");
    await page
      .locator(".post-cards")
      .getByRole("heading", { name: "First blog story", exact: true })
      .waitFor();
    await blogs
      .getByRole("button", { name: "Single post", exact: true })
      .click();
    await page
      .locator(".post-header h1")
      .getByText("First blog story", { exact: true })
      .waitFor();
    assert.equal(
      await page.locator(".post-body strong").textContent(),
      "Bold body",
    );
    assert.equal(await page.locator(".post-body script").count(), 0);
    await page
      .getByLabel("Preview post", { exact: false })
      .selectOption("blog2");
    await page
      .locator(".post-header h1")
      .getByText("Second blog story", { exact: true })
      .waitFor();
    await page.locator(".site-block.post-header").click();
    await page.getByLabel("Show excerpt", { exact: true }).uncheck();
    for (const label of ["Projects", "Experience", "Skills"]) {
      const group = page
        .locator(".content-template-group")
        .filter({
          has: page.locator("strong").getByText(label, { exact: true }),
        });
      await group.getByRole("button", { name: "Archive", exact: true }).click();
      await group
        .getByRole("button", { name: "Single post", exact: true })
        .click();
    }
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("All changes saved", { exact: true }).waitFor();
    assert.equal(saved.pages.filter((p) => p.kind).length, 8);
    assert(!JSON.stringify(saved).includes("PRIVATE BODY"));
    await page.getByRole("button", { name: "Publish ↗", exact: true }).click();
    await page.getByText("Site published", { exact: true }).waitFor();
    await blogs.getByRole("button", { name: "Archive", exact: true }).click();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.locator(".post-cards a").first().click();
    await page
      .locator(".post-header h1")
      .getByText("First blog story", { exact: true })
      .waitFor();
    assert(page.url().includes("/site-builder/p"));
    assert.deepEqual(errors, []);
    console.log(
      "Content template browser flow passed: per-type archives and singles, live content preview, pagination, controls, publishing, and preview navigation.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
