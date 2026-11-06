import test from 'node:test'
import assert from 'node:assert/strict'
import { newSite, newBlock } from '../utils/builder.mjs'
import { contentTypes, newContentTemplate, resolveBuilderContent, contentHref } from '../utils/builder-content.mjs'
import { validateDocument } from '../utils/builder-validation.mjs'
import { renderPostMarkdown } from '../utils/builder-markdown.mjs'
const post = (type, id = type, status = 'PUBLISHED') => ({id,contentType:type,slug:'same-slug',title:`${type} title`,status,content:'# Hello\n\nBody'})
const collections = Object.fromEntries(contentTypes.map(t => [t.collection,[post(t.type),post(t.type,'private','DRAFT')]]))
test('all content types support independently editable archive and single templates',()=>{
 const doc=newSite();doc.pages.push(...contentTypes.flatMap(t=>['archive','single'].map(k=>newContentTemplate(t.type,k))));validateDocument(doc)
 for(const type of contentTypes){const archive=resolveBuilderContent(doc,type.path,collections),single=resolveBuilderContent(doc,`${type.path}/same-slug`,collections);assert.equal(archive.page.kind,'archive');assert.equal(archive.items.length,1);assert.equal(single.item.contentType,type.type);assert.equal(single.page.kind,'single');assert.equal(contentHref(single.item),`${type.path}/same-slug`)}
})
test('existing sites receive defaults for content routes without a document migration',()=>{const doc=newSite();assert.equal(resolveBuilderContent(doc,'/blog',collections).page.kind,'archive');assert.equal(resolveBuilderContent(doc,'/blog/same-slug',collections).item.contentType,'BLOG');assert.equal(doc.pages.length,1)})
test('unknown, private, extra-segment and wrong-type post URLs do not resolve',()=>{const doc=newSite();for(const path of ['/blog/missing','/blog/same-slug/extra','/unknown','/blog/%ZZ'])assert.equal(resolveBuilderContent(doc,path,collections),null);assert.equal(resolveBuilderContent(doc,'/blog/same-slug',{blogs:[post('PROJECT')]}),null);assert.equal(resolveBuilderContent(doc,'/blog/same-slug',{blogs:[post('BLOG','private','HIDDEN')]}),null)})
test('validation rejects duplicate templates, wrong routes and misplaced post blocks',()=>{
 for(const mutate of [d=>d.pages.push({...d.pages[1],id:'duplicate',path:'/elsewhere'}),d=>d.pages[1].path='/custom-blog',d=>d.pages[0].blocks.push(newBlock('post-content')),d=>d.pages[1].blocks.find(b=>b.type==='post-list').pageSize=0]){const d=newSite();d.pages.push(newContentTemplate('BLOG','archive'));mutate(d);assert.throws(()=>validateDocument(d))}
})
test('single post markdown renders formatting while escaping raw HTML and unsafe links',()=>{const html=renderPostMarkdown('# A heading\n\n**Bold text** [unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n![photo](https://example.com/photo.jpg)');assert.match(html,/<h1[^>]*>A heading<\/h1>/);assert.match(html,/<strong>Bold text<\/strong>/);assert(!html.includes('href="javascript:'));assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('https://example.com/photo.jpg'))})
test('single post SEO honors template patterns with the current post values',async()=>{const {builderPageMetadata}=await import('../utils/builder-content.mjs');const doc=newSite();const single=newContentTemplate('BLOG','single');single.metaTitle='{{title}} | {{siteName}}';single.metaDescription='Read {{title}}: {{excerpt}}';doc.pages.push(single);const resolved=resolveBuilderContent(doc,'/blog/same-slug',{blogs:[{...post('BLOG'),excerpt:'An excerpt'}]});assert.deepEqual(builderPageMetadata(resolved,doc),{title:'BLOG title | Untitled site',description:'Read BLOG title: An excerpt'})})
