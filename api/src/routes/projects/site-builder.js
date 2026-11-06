const router = require("express").Router();
const { prisma } = require("../../services/core/database");
const { cache } = require("../../services/core/redis");
const { authorizeProjectAccess } = require("../../middleware/auth");
const { validateDocument } = require("../../services/sites/document");
const fields = {
  siteName: true,
  builderDraft: true,
  builderPublished: true,
  builderRevision: true,
  builderHistory: true,
};
const handler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (!e.status) console.error("Site builder:", e);
    res
      .status(e.status || 500)
      .json({ error: e.status ? e.message : "Unable to save site" });
  }
};
router.get(
  "/:id/site-builder",
  authorizeProjectAccess("VIEWER"),
  handler(async (req, res) => {
    const config = await prisma.siteConfig.findUnique({
      where: { projectId: req.params.id },
      select: fields,
    });
    res.set("Cache-Control", "no-store");
    res.json({ ...config, role: req.userRole });
  }),
);
router.put(
  "/:id/site-builder",
  authorizeProjectAccess("EDITOR"),
  handler(async (req, res) => {
    const document = validateDocument(req.body.document);
    const revision = req.body.revision;
    if (!Number.isInteger(revision) || revision < 0)
      return res.status(400).json({ error: "Revision required" });
    // Initialization never changes an existing document. Conditional update is atomic.
    await prisma.siteConfig.upsert({
      where: { projectId: req.params.id },
      create: { projectId: req.params.id, layoutConfig: {} },
      update: {},
    });
    const result = await prisma.siteConfig.updateMany({
      where: { projectId: req.params.id, builderRevision: revision },
      data: { builderDraft: document, builderRevision: { increment: 1 } },
    });
    if (!result.count)
      return res
        .status(409)
        .json({
          error:
            "Another teammate saved changes. Export your work, then reload before saving.",
        });
    res.json({ builderRevision: revision + 1 });
  }),
);
router.post(
  "/:id/site-builder/publish",
  authorizeProjectAccess("ADMIN"),
  handler(async (req, res) => {
    if (!Number.isInteger(req.body.revision) || req.body.revision < 0)
      return res.status(400).json({ error: "Revision required" });
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.siteConfig.findUnique({
        where: { projectId: req.params.id },
        select: fields,
      });
      if (!config?.builderDraft)
        throw Object.assign(new Error("Save a draft first"), { status: 400 });
      if (config.builderRevision !== req.body.revision)
        throw Object.assign(
          new Error("Site changed. Reload before publishing."),
          { status: 409 },
        );
      validateDocument(config.builderDraft);
      const history = [
        {
          revision: config.builderRevision,
          at: new Date().toISOString(),
          userId: req.user.id,
          document: config.builderDraft,
        },
        ...(config.builderHistory || []),
      ].slice(0, 10);
      const saved = await tx.siteConfig.updateMany({
        where: { projectId: req.params.id, builderRevision: req.body.revision },
        data: {
          builderPublished: config.builderDraft,
          builderHistory: history,
          builderRevision: { increment: 1 },
          publishedRevision: { increment: 1 },
        },
      });
      if (!saved.count || config.builderRevision !== req.body.revision)
        throw Object.assign(
          new Error("Site changed. Reload before publishing."),
          { status: 409 },
        );
      await tx.project.update({
        where: { id: req.params.id },
        data: { isPublished: true },
      });
      return {
        builderRevision: config.builderRevision + 1,
        builderHistory: history,
      };
    });
    await cache.del(`project:${req.params.id}`);
    await cache.delPattern("user:projects:*");
    res.json(result);
  }),
);
module.exports = router;
