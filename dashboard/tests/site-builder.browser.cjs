const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let saved = null,
    revision = 0,
    published = null,
    role = "OWNER",
    rejectSave = false;
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
    else if (path.endsWith("/site-builder/publish")) {
      const b = route.request().postDataJSON();
      assert.equal(b.revision, revision);
      published = saved;
      data = { builderRevision: ++revision, builderHistory: [] };
    } else if (path.endsWith("/site-builder")) {
      if (method === "PUT") {
        if (rejectSave) {
          await route.fulfill({
            status: 409,
            json: {
              error:
                "Another teammate saved changes. Export your work, then reload before saving.",
            },
          });
          return;
        }
        const b = route.request().postDataJSON();
        assert.equal(b.revision, revision);
        saved = b.document;
        data = { builderRevision: ++revision };
      } else
        data = {
          role,
          builderDraft: saved,
          builderRevision: revision,
          builderHistory: [],
        };
    } else if (path.endsWith("/members")) data = [];
    else if (path.endsWith("/media")) data = { media: [] };
    else if (path === "/api/projects" && method === "POST") data = {id:"p-created"};
    else if (path === "/api/projects" || path === "/api/users/me/projects")
      data = { ownedProjects: [], memberProjects: [] };
    await route.fulfill({ json: data });
  });
  await page.goto(
    (process.argv[2] || "http://127.0.0.1:5173") + "/site-builder/p",
  );
  await page
    .getByRole("heading", { name: "A space for every idea." })
    .waitFor();
  await page
    .locator(".block-library button")
    .filter({ hasText: "divider" })
    .dragTo(page.locator(".site-block").first());
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("All changes saved", { exact: true }).waitFor();
  assert.equal(saved.pages[0].blocks[0].type, "divider");
  await page
    .locator(".block-library button")
    .filter({ hasText: "text" })
    .click();
  await page
    .locator(".inspector label")
    .filter({ hasText: /^title/ })
    .locator("input")
    .fill("A browser-tested section");
  await page
    .locator(".inspector label")
    .filter({ hasText: /^title/ })
    .locator("input")
    .press("Tab");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("All changes saved", { exact: true }).waitFor();
  assert(
    saved.pages[0].blocks.some((b) => b.title === "A browser-tested section"),
  );
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await page.getByRole("button", { name: "+ Add page", exact: true }).click();
  await page.getByLabel("Page name", { exact: true }).fill("About");
  await page.getByLabel("Page name", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "Build", exact: true }).click();
  await page
    .locator(".block-library button")
    .filter({ hasText: "hero" })
    .click();
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  const width = await page
    .locator(".canvas-frame")
    .evaluate((el) => el.getBoundingClientRect().width);
  assert(width <= 390);
  await page.getByRole("button", { name: "Publish ↗", exact: true }).click();
  await page.getByText("Site published", { exact: true }).waitFor();
  assert.equal(published.pages.length, 2);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(await page.locator(".inspector").count(), 0);
  await page.locator(".site-nav").getByRole("link", {name:"Home",exact:true}).click();
  assert(page.url().includes("/site-builder/"));
  await page.locator(".site-nav").getByRole("link", {name:"About",exact:true}).click();
  await page.getByRole("button", { name: "Edit site", exact: true }).click();
  await page.screenshot({
    path: "/tmp/site-builder-desktop.png",
    fullPage: true,
  });
  rejectSave = true;
  await page.locator(".site-block.hero").click();
  await page
    .locator(".inspector label")
    .filter({ hasText: /^title/ })
    .locator("input")
    .fill("Keep this local change");
  await page
    .locator(".inspector label")
    .filter({ hasText: /^title/ })
    .locator("input")
    .press("Tab");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Export my changes", exact: true })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Publish ↗", exact: true })
      .isDisabled(),
  );
  role = "VIEWER";
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await page
    .getByRole("heading", { name: "A space for every idea." })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .isDisabled(),
  );
  assert(
    await page
      .getByRole("button", { name: "Publish ↗", exact: true })
      .isDisabled(),
  );
  role = "OWNER";
  rejectSave = false;
  await page.goto((process.argv[2] || "http://127.0.0.1:5173") + "/sites");
  await page.getByRole("heading", {name:/^Sites\.?$/}).waitFor();
  await page.getByRole("button", {name:"+ Create a site",exact:true}).click();
  await page.getByLabel("Site name",{exact:true}).fill("New team site");
  await page.getByLabel("Subdomain",{exact:false}).fill("new-team-site");
  await page.getByRole("button", {name:"Create & open builder",exact:true}).click();
  await page.waitForURL("**/site-builder/p-created");
  await page.getByRole("heading",{name:"A space for every idea."}).waitFor();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Site builder browser flow passed: edit, save, pages, mobile, publish, preview, viewer restrictions.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
