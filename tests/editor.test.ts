import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHtml, validateFields, referencedImages } from '../lib/sanitize';
import { isOwnerIdentity, isSameOriginWrite } from '../lib/authorization';
import defaults from '../content/default-fields.json';

test('Only the configured authenticated owner can edit',()=>{
  assert.equal(isOwnerIdentity(null,'owner@example.com','owner@example.com'),false);
  assert.equal(isOwnerIdentity('user','other@example.com','owner@example.com'),false);
  assert.equal(isOwnerIdentity('user','owner@example.com',undefined),false);
  assert.equal(isOwnerIdentity('user','OWNER@example.com','owner@example.com'),true);
});
test('Mutations require same-origin browser requests',()=>{
  const req=(origin?:string,site?:string)=>new Request('https://lyric-grid-docs-cn.beiai.chatgpt.site/api/editor',{headers:{...(origin?{origin}:{}),...(site?{'sec-fetch-site':site}:{})}});
  assert.equal(isSameOriginWrite(req()),false);
  assert.equal(isSameOriginWrite(req('https://evil.example')),false);
  assert.equal(isSameOriginWrite(req('http://localhost:3000')),false);
  assert.equal(isSameOriginWrite(req('http://localhost:3000'),true),true);
  assert.equal(isSameOriginWrite(req('https://lyric-grid-docs-cn.beiai.chatgpt.site','cross-site')),false);
});
test('Rich text drops scripts, event handlers, unsafe URLs and external images',()=>{
  const html=cleanHtml('<script>alert(1)</script><p onclick="alert(1)">hello<strong>bold</strong><a href="javascript:alert(1)">bad</a><img src="https://evil.example/track.png"><iframe src="x"></iframe></p>',true);
  assert.ok(!html.includes('alert'));
  assert.ok(!html.includes('onclick'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('<strong>bold</strong>'));
});
test('Draft images and supported text formats survive sanitization',()=>{
  const image='/api/images/12345678-1234-1234-1234-123456789abc';
  const html=cleanHtml(`<h3>标题</h3><ul><li>正文</li></ul><img src="${image}" onerror="x">`,true);
  assert.ok(html.includes('<h3>标题</h3>'));
  assert.ok(html.includes(image));
  assert.ok(!html.includes('onerror'));
  assert.deepEqual(referencedImages({one:html,two:html}),['12345678-1234-1234-1234-123456789abc']);
});
test('Unknown content keys and oversized fields are rejected',()=>{
  assert.throws(()=>validateFields({'made-up':'bad'}));
  assert.throws(()=>validateFields({'start-h1-1':'a'.repeat(20001)}));
  assert.throws(()=>validateFields([]));
  assert.equal(validateFields({'start-h1-1':'<strong>我的标题</strong>'})['start-h1-1'],'<strong>我的标题</strong>');
});
test('Every default editable field has complete metadata',()=>{
  for(const [id,field] of Object.entries(defaults)){
    assert.ok(field.section,id);assert.ok(field.label,id);assert.equal(typeof field.html,'string');
    assert.doesNotThrow(()=>validateFields({[id]:field.html}));
  }
});
