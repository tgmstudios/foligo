import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { marked } from 'marked'
import { renderSiteMarkdown as render, safeMarkdownUrl, sanitizeSiteHtml } from '../utils/site-markdown.mjs'
import { renderMarkdown } from '../utils/markdownRenderer.js'
import { renderPostMarkdown } from '../utils/builder-markdown.mjs'

test('Sites owns a private parser, unaffected by Studio marked extensions',()=>{
 const before=render('**Sites**\n\n# A heading')
 marked.use({renderer:{strong(){return '<em>DASHBOARD ONLY</em>'}}})
 assert.equal(render('**Sites**\n\n# A heading'),before)
 assert.equal(renderMarkdown('**Sites**'),renderPostMarkdown('**Sites**'))
 assert(!before.includes('DASHBOARD ONLY'))
})
test('supports all Foligo formatting and standard GFM inline features',()=>{
 const html=render('# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six\n\n**Bold** *italic* ~~deleted~~ `inline` 🎉\n\n> Quoted\n\n- Bullet\n  - Nested\n\n1. Numbered\n\n- [x] Complete\n- [ ] Pending\n\n---\n\nLine one\nLine two\n\nhttps://example.com <hello@example.com>\n\n[Reference][ref]\n\n[ref]: /reference')
 for(const tag of ['h1','h2','h3','h4','h5','h6','strong','em','del','code','blockquote','ul','ol','hr','br'])assert.match(html,new RegExp(`<${tag}(?: |>).*?`))
 assert(html.includes('🎉'));assert.match(html,/<input[^>]+checked[^>]+disabled/);assert.match(html,/<input[^>]+disabled/)
 assert(html.includes('href="mailto:hello@example.com"'));assert(html.includes('href="/reference"'))
})
test('headings have deterministic, distinct anchors and links can point to them',()=>{const source='# Repeat\n\n# Repeat\n\n## Café\n\n[Jump](#repeat-2)';const html=render(source);assert(html.includes('id="repeat"'));assert(html.includes('id="repeat-2"'));assert.match(html,/<h2 id="cafe/);assert.equal(render(source),html);assert(html.includes('href="#repeat-2"'))})
test('tables retain alignment and have a scrollable keyboard-accessible wrapper',()=>{const html=render('| Left | Right | Center |\n| :--- | ---: | :---: |\n| **Bold** | 12 | X |');assert.match(html,/<div[^>]+class="site-md-table"[^>]+tabindex="0"/);assert(html.includes('align="right"'));assert(html.includes('align="center"'));assert(html.includes('<strong>Bold</strong>'));assert(html.includes('scope="col"'))})
test('code remains literal and provides copy controls; Mermaid has a safe SSR fallback',()=>{const html=render('```html\n<script>alert(1)</script>\n```\n\n~~~mermaid\nflowchart TD\n A --> B\n~~~');assert(html.includes('language-html'));assert(html.includes('&lt;script&gt;'));assert(html.includes('site-md-copy'));assert(html.includes('site-md-mermaid-source'));assert(html.includes('A --&gt; B'));assert(!html.includes('<script>'))})
test('Draw.io exported image displays and its editable-source fences stay hidden',()=>{const html=render('![A diagram](/media/diagram.png)\n\n```drawio\nPRIVATE-BASE64-XML\n```\n\nAfter diagram\n\n~~~DRAWIO\nOTHER-XML\n~~~');assert(html.includes('src="/media/diagram.png"'));assert(html.includes('alt="A diagram"'));assert(!html.includes('PRIVATE-BASE64-XML'));assert(!html.includes('OTHER-XML'));assert(html.includes('After diagram'))})
test('images, attached documents, email, telephone and relative file links work',()=>{const html=render('![Photo](https://example.com/photo.webp "Portrait")\n\n[PDF](../files/resume.pdf) [Download](files/archive.zip) [Call](tel:+123456) [Mail](mailto:a@example.com)');assert(html.includes('loading="lazy"'));assert(html.includes('title="Portrait"'));for(const href of ['../files/resume.pdf','files/archive.zip','tel:+123456','mailto:a@example.com'])assert(html.includes(`href="${href}"`))})
test('pasted videos and audio preserve their media sources without active HTML attributes',()=>{const html=render('<video src="/media/clip.mp4" poster="/media/poster.jpg" controls autoplay onplay="alert(1)"><source src="/media/clip.webm" type="video/webm"><track src="/media/en.vtt" kind="captions" srclang="en" label="English"></video>\n\n<audio src="/media/voice.mp3" controls></audio>');assert(html.includes('<video'));assert(html.includes('<audio'));assert(html.includes('<track'));assert(html.includes('type="video/webm"'));assert(html.includes('playsinline'));assert(!html.includes('autoplay'));assert(!html.includes('onplay'))})
test('supports safe inline HTML and disclosures used in authored content',()=>{const html=render('<u>Underlined</u> <mark>Highlighted</mark> H<sub>2</sub>O x<sup>2</sup> <kbd>Ctrl</kbd>\n\n<details open><summary>More</summary><p>Details</p></details>');for(const tag of ['u','mark','sub','sup','kbd','details','summary'])assert(html.includes(`<${tag}`));assert(html.includes('<u>Underlined</u>'));assert(html.includes('open=""'))})
test('video embeds are limited to known providers and receive a sandbox',()=>{const html=render('<iframe src="https://www.youtube.com/embed/abc123" onload="evil()" srcdoc="evil"></iframe>\n\n<iframe src="https://evil.example/embed/abc"></iframe>');assert.equal((html.match(/<iframe/g)||[]).length,1);assert(html.includes('sandbox="allow-scripts allow-same-origin allow-presentation"'));assert(!html.includes('onload'));assert(!html.includes('srcdoc'));assert(!html.includes('evil.example'))})
test('sanitizes raw HTML, encoded URLs, SVG, styles and active attributes',()=>{
 for(const source of ['<script>alert(1)</script>','<img src="x" onerror="alert(1)">','<a href="&#106;avascript:alert(1)">bad</a>','<a href="java&#x09;script:alert(1)">bad</a>','<svg onload="alert(1)"><script>alert(1)</script></svg>','<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">','<span style="background:url(javascript:evil)">Styled</span>']){
 const html=render(source);const active=sanitizeSiteHtml(html);assert.equal(active,html);assert(!/<script(?:\s|>)/i.test(html));assert(!/<svg(?:\s|>)/i.test(html));assert(!/<[^>]+\son\w+=/i.test(html));assert(!/href="(?:javascript|data):/i.test(html));assert(!/<[^>]+\sstyle=/i.test(html))
 }
 for(const url of ['javascript:alert(1)','data:text/html,evil','//evil.example','https://example.com\n','https:\\evil.example'])assert.equal(safeMarkdownUrl(url),'')
})
test('builder and legacy public posts both use the Sites-owned component',()=>{for(const file of ['BuilderCanvas.vue','PublicPortfolio.vue']){const text=readFileSync(new URL(`../components/${file}`,import.meta.url),'utf8');assert(text.includes('<SitesMarkdown'));assert(!text.includes('v-html='))}const component=readFileSync(new URL('../components/SitesMarkdown.vue',import.meta.url),'utf8');assert(component.includes('../utils/site-markdown.mjs'));assert(!component.includes('dashboard/'))})
test('sanitizing rendered tables remains stable across repeated passes',()=>{const html=render('| A | B |\n| - | - |\n| 1 | 2 |');assert.equal(sanitizeSiteHtml(html),html)})
