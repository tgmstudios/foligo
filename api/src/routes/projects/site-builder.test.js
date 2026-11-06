const express = require("express");
const request = require("supertest");
jest.mock("../../services/core/database", () => ({
  prisma: {
    project: { findFirst: jest.fn(), update: jest.fn() },
    projectAccess: { findFirst: jest.fn() },
    siteConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock("../../services/core/redis", () => ({ cache: { del: jest.fn(), delPattern: jest.fn() } }));
const { prisma } = require("../../services/core/database");
const { validateDocument } = require("../../services/sites/document");
const router = require("./site-builder");
const document = () => ({
  version: 1,
  name: "Studio",
  theme: {
    accent: "#6658e8",
    background: "#ffffff",
    text: "#20202a",
    font: "sans-serif",
  },
  pages: [
    {
      id: "home",
      name: "Home",
      path: "/",
      blocks: [
        {
          id: "hero",
          type: "hero",
          title: "Hello",
          text: "World",
          url: "https://example.com",
          align: "center",
          tone: "light",
          spacing: 48,
        },
      ],
    },
  ],
});
function app(role = "EDITOR") {
  const a = express();
  a.use(express.json());
  a.use((req, res, next) => {
    req.user = { id: "user" };
    next();
  });
  prisma.project.findFirst.mockResolvedValue(
    role === "OWNER" ? { id: "p" } : null,
  );
  prisma.projectAccess.findFirst.mockResolvedValue(role ? { role } : null);
  a.use("/api/projects", router);
  return a;
}
beforeEach(() => {
  jest.clearAllMocks();
  prisma.siteConfig.updateMany.mockResolvedValue({ count: 1 });
  prisma.$transaction.mockImplementation((fn) => fn(prisma));
  prisma.siteConfig.findUnique.mockResolvedValue({
    builderDraft: document(),
    builderRevision: 3,
    builderHistory: [],
  });
});
test("viewer can inspect role and draft but cannot save or publish", async () => {
  const a = app("VIEWER");
  expect((await request(a).get("/api/projects/p/site-builder")).body.role).toBe(
    "VIEWER",
  );
  expect(
    (
      await request(a)
        .put("/api/projects/p/site-builder")
        .send({ document: document(), revision: 3 })
    ).status,
  ).toBe(403);
  expect(
    (
      await request(a)
        .post("/api/projects/p/site-builder/publish")
        .send({ revision: 3 })
    ).status,
  ).toBe(403);
  expect(prisma.siteConfig.updateMany).not.toHaveBeenCalled();
});
test("nonmembers cannot read or mutate another tenant", async () => {
  const a = app(null);
  expect((await request(a).get("/api/projects/p/site-builder")).status).toBe(
    403,
  );
  expect(
    (
      await request(a)
        .put("/api/projects/p/site-builder")
        .send({ document: document(), revision: 3 })
    ).status,
  ).toBe(403);
});
test("editors save using atomic revision match without touching published document", async () => {
  const a = app();
  const r = await request(a)
    .put("/api/projects/p/site-builder")
    .send({ document: document(), revision: 3 });
  expect(r.status).toBe(200);
  expect(r.body.builderRevision).toBe(4);
  expect(prisma.siteConfig.updateMany).toHaveBeenCalledWith({
    where: { projectId: "p", builderRevision: 3 },
    data: { builderDraft: document(), builderRevision: { increment: 1 } },
  });
  expect(
    (
      await request(a)
        .post("/api/projects/p/site-builder/publish")
        .send({ revision: 4 })
    ).status,
  ).toBe(403);
});
test("stale saves return 409", async () => {
  prisma.siteConfig.updateMany.mockResolvedValue({ count: 0 });
  expect(
    (
      await request(app())
        .put("/api/projects/p/site-builder")
        .send({ document: document(), revision: 2 })
    ).status,
  ).toBe(409);
});
test("admins publish saved draft and retain bounded history", async () => {
  const r = await request(app("ADMIN"))
    .post("/api/projects/p/site-builder/publish")
    .send({ revision: 3 });
  expect(r.status).toBe(200);
  expect(r.body.builderRevision).toBe(4);
  expect(
    prisma.siteConfig.updateMany.mock.calls[0][0].data.builderPublished,
  ).toEqual(document());
  expect(prisma.project.update).toHaveBeenCalledWith({
    where: { id: "p" },
    data: { isPublished: true },
  });
});
test("rejects malicious links, duplicate paths, missing homepage and unknown blocks", () => {
  for (const mutate of [
    (d) => (d.pages[0].blocks[0].url = "javascript:alert(1)"),
    (d) => d.pages.push({ ...d.pages[0] }),
    (d) => (d.pages[0].path = "/other"),
    (d) => (d.pages[0].blocks[0].type = "script"),
  ]) {
    const d = document();
    mutate(d);
    expect(() => validateDocument(d)).toThrow();
  }
});
test("rejects conflicting body project identifiers", async () => {
  expect(
    (
      await request(app())
        .put("/api/projects/p/site-builder")
        .send({ projectId: "other", document: document(), revision: 3 })
    ).status,
  ).toBe(400);
});
test("stale publications fail before writing and cannot publish a newer teammate draft", async () => {
  const r = await request(app("ADMIN"))
    .post("/api/projects/p/site-builder/publish")
    .send({ revision: 2 });
  expect(r.status).toBe(409);
  expect(prisma.siteConfig.updateMany).not.toHaveBeenCalled();
  expect(prisma.project.update).not.toHaveBeenCalled();
});
test("publication requires an explicit integer revision", async () => {
  expect(
    (
      await request(app("ADMIN"))
        .post("/api/projects/p/site-builder/publish")
        .send({})
    ).status,
  ).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
