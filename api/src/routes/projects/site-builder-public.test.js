const express = require("express");
const request = require("supertest");
jest.mock("../../services/core/database", () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    contentLink: { findMany: jest.fn() },
  },
}));
jest.mock("../../services/core/redis", () => ({
  cache: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
}));
const { prisma } = require("../../services/core/database");
const { cache } = require("../../services/core/redis");
const a = express();
a.use("/api/site", require("../media/site"));
beforeEach(() => {
  jest.clearAllMocks();
  cache.get.mockResolvedValue(null);
});
test("public site response and cache contain published document but never drafts or version history", async () => {
  prisma.project.findUnique
    .mockResolvedValueOnce({ id: "p", isPublished: true })
    .mockResolvedValueOnce({
      id: "p",
      name: "Public",
      subdomain: "public",
      isPublished: true,
      content: [],
      siteConfig: {
        builderPublished: { name: "Published" },
        builderDraft: { secret: "Unreleased campaign" },
        builderHistory: [{ secret: "Old private copy" }],
        builderRevision: 9,
        publishedRevision: 2,
      },
    });
  const r = await request(a).get("/api/site/public");
  expect(r.status).toBe(200);
  expect(r.body.siteConfig).toEqual({
    builderPublished: { name: "Published" },
    publishedRevision: 2,
  });
  expect(JSON.stringify(cache.set.mock.calls)).not.toContain("secret");
});
test("unpublished sites return 404 even with a stale cached public document", async () => {
  prisma.project.findUnique.mockResolvedValue({ id: "p", isPublished: false });
  cache.get.mockResolvedValue({ siteConfig: { builderPublished: {} } });
  expect((await request(a).get("/api/site/public")).status).toBe(404);
  expect(cache.get).not.toHaveBeenCalled();
});
