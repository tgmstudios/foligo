import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { newSite, newBlock, blockTypes, safeUrl } from '../utils/builder.mjs'
import { validateDocument } from '../utils/builder-validation.mjs'
const require=createRequire(import.meta.url)
const {validateDocument:serverValidate}=require('../../api/src/services/sites/document.js')
test('all templates and block types satisfy the server document contract',()=>{for(const template of ['studio','portfolio','business']){const d=newSite(template);d.pages[0].blocks=blockTypes.filter(t => !t.startsWith('post-')).map(newBlock);assert.equal(validateDocument(d),d);assert.equal(serverValidate(d),d)}})
test('browser validation remains identical to API validation',()=>{const server=readFileSync(new URL('../../api/src/services/sites/document.js',import.meta.url),'utf8').replace('module.exports = { validateDocument, safeUrl };','export { validateDocument };');assert.equal(readFileSync(new URL('../utils/builder-validation.mjs',import.meta.url),'utf8'),server)})
test('rendering rejects dangerous protocols, protocol relative URLs, and control characters',()=>{for(const u of ['javascript:alert(1)','//evil.test','data:text/html,hi','https://example.com\n'])assert.equal(safeUrl(u),'#');assert.equal(safeUrl('/about'),'/about')})
test('page paths must be canonical and unique',()=>{for(const path of ['/about/','//about','/../secret','/About']){const d=newSite();d.pages.push({id:'another',name:'Another',path,blocks:[]});assert.throws(()=>validateDocument(d))}const d=newSite();d.pages.push({id:'nested',name:'Nested',path:'/work/case-study',blocks:[]});assert.doesNotThrow(()=>validateDocument(d))})
