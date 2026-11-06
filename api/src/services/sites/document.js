const TYPES = ['hero', 'text', 'image', 'button', 'features', 'gallery', 'testimonial', 'faq', 'contact', 'divider', 'spacer', 'post-list', 'post-header', 'post-content'];
const safeUrl = value => typeof value === 'string' && (value === '' || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value)) && !/[\s<>"\\]/.test(value);
function validateDocument(doc) {
  const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
  if (!doc || doc.version !== 1 || !Array.isArray(doc.pages) || !doc.pages.length || doc.pages.length > 50) fail('Site must contain 1–50 pages');
  if (JSON.stringify(doc).length > 500000) fail('Site document is too large');
  if (!doc.theme || !/^#[a-f0-9]{6}$/i.test(doc.theme.accent) || !/^#[a-f0-9]{6}$/i.test(doc.theme.background) || !/^#[a-f0-9]{6}$/i.test(doc.theme.text)) fail('Invalid theme colors');
  if (!['sans-serif', 'serif', 'monospace'].includes(doc.theme.font)) fail('Invalid font');
  if (typeof doc.name !== 'string' || !doc.name.trim() || doc.name.length > 200) fail('A site name is required (up to 200 characters)');
  const paths = new Set(); const ids = new Set(); const pageIds = new Set();
  const templates = new Set();
  const routes = { BLOG: "/blog", PROJECT: "/projects", EXPERIENCE: "/experiences", SKILL: "/skills" };
  for (const page of doc.pages) {
    if (!page || typeof page.id !== 'string' || pageIds.has(page.id)) fail('Pages need unique IDs');
    pageIds.add(page.id);
    for (const key of ['metaTitle', 'metaDescription']) if (page[key] !== undefined && (typeof page[key] !== 'string' || page[key].length > 2000)) fail('Invalid page metadata');
    const kind = page.kind || 'page';
    if (!['page', 'archive', 'single'].includes(kind)) fail('Unknown page kind');
    if (kind !== 'page') {
      const key = `${page.contentType}:${kind}`;
      if (!routes[page.contentType] || templates.has(key) || page.path !== routes[page.contentType] + (kind === 'single' ? '/:slug' : '')) fail('Invalid or duplicate content template');
      templates.add(key);
    }
    if (typeof page.name !== 'string' || !page.name.trim() || !(kind === 'single' || /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(page.path)) || paths.has(page.path)) fail('Pages need unique valid paths and names');
    paths.add(page.path);
    if (!Array.isArray(page.blocks) || page.blocks.length > 200) fail('Too many blocks');
    for (const b of page.blocks) {
      if (!b || typeof b.id !== 'string' || ids.has(b.id) || !TYPES.includes(b.type)) fail('Invalid or duplicate block');
      ids.add(b.id);
      if (b.type.startsWith('post-')) {
        if (b.type === 'post-list' && kind !== 'archive') fail('Post lists belong in archive templates');
        if (['post-header', 'post-content'].includes(b.type) && kind !== 'single') fail('Post fields belong in single post templates');
        if (b.layout !== undefined && !['grid', 'list'].includes(b.layout)) fail('Invalid post list layout');
        if (b.pageSize !== undefined && (!Number.isInteger(b.pageSize) || b.pageSize < 1 || b.pageSize > 48)) fail('Invalid page size');
        for (const key of ['showImage', 'showExcerpt', 'showDate']) if (b[key] !== undefined && typeof b[key] !== 'boolean') fail('Invalid post visibility setting');
      }
      for (const field of ['title', 'text', 'label', 'alt']) if (b[field] !== undefined && (typeof b[field] !== 'string' || b[field].length > 20000)) fail('Invalid block text');
      for (const field of ['url', 'image']) if (b[field] !== undefined && !safeUrl(b[field])) fail('Use a safe HTTP, email, telephone, or relative URL');
      if (!['left', 'center', 'right'].includes(b.align) || !['light', 'dark', 'accent'].includes(b.tone) || !Number.isInteger(b.spacing) || b.spacing < 0 || b.spacing > 160) fail('Invalid block style');
      if (['features', 'gallery', 'faq'].includes(b.type) && !Array.isArray(b.items)) fail('This block needs an item list');
      if (b.items !== undefined && (!Array.isArray(b.items) || b.items.length > 30 || b.items.some(i => !i || typeof i.title !== 'string' || typeof i.text !== 'string' || (i.image !== undefined && !safeUrl(i.image))))) fail('Invalid block items');
    }
  }
  if (!doc.pages.some(p => p.path === '/' && (!p.kind || p.kind === 'page'))) fail('A homepage at / is required');
  return doc;
}
module.exports = { validateDocument, safeUrl };
