const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const runtime = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function boot({adapters, config = {seedUrl:null}, failWrites = false, fetch, initial = []} = {}) {
  const data = new Map(initial);
  const window = {HQ_CONFIG:config, HQ_ADAPTERS:adapters};
  const ctx = vm.createContext({window, console, setTimeout, Map, Blob, URL,
    fetch:fetch || (() => {throw Error('unexpected fetch');}),
    localStorage:{getItem:k=>data.get(k)||null, setItem:(k,v)=>{
      if(failWrites) throw Error('quota exceeded'); data.set(k,v);
    }}});
  vm.runInContext(runtime, ctx);
  return {window, data};
}

test('merge updates preserve unknown fields, snapshots are detached, and nested history persists', async () => {
  const {window} = boot(); const db = await window.HQ_USE('db');
  const doc = db.doc('applications/a-one-role');
  await doc.set({role:'Target role', custom:'retained', nested:{text:'original'}});
  await doc.update({status:'Drafted'});
  const snap = (await doc.get()).data(); snap.nested.text = 'changed';
  assert.equal((await doc.get()).data().custom, 'retained');
  assert.equal((await doc.get()).data().nested.text, 'original');
  const ref = await db.collection('applications/a-one-role/versions').add(snap);
  await doc.update({nested:{text:'later'}});
  assert.equal((await ref.get()).data().nested.text, 'changed');
});

test('quota failures reject instead of claiming persistence', async () => {
  const {window} = boot({failWrites:true});
  const db = await window.HQ_USE('db');
  await assert.rejects(db.doc('resumes/base').set({data:{name:'Unsaved'}}));
});

test('a failed demo fetch can retry on the next load', async () => {
  const {window, data} = boot({config:{seedUrl:'examples/seed.json'},fetch:async()=>({ok:false})});
  await window.HQ_USE('db');
  assert.equal(data.has('unmplyd:seeded'), false);
});

test('connected storage never inherits local authorization or downloads', async () => {
  const db = {host:true}; const {window} = boot({adapters:{db}});
  assert.equal(await window.HQ_USE('db'), db);
  assert.equal(await window.HQ_USE('user'), null);
  assert.equal(await window.HQ_USE('downloads'), null);
});

test('an AI-only adapter retains default local storage and permissions', async () => {
  const ai = {edit:async()=>({})}; const {window} = boot({adapters:{ai}});
  assert.equal(await window.HQ_USE('ai'), ai);
  assert.equal(await (await window.HQ_USE('user')).can('data.write'),true);
  assert.ok(await window.HQ_USE('db'));
});

test('demo loading preserves existing documents if the seed marker is missing', async () => {
  const {window} = boot({config:{seedUrl:'example'},
    initial:[['unmplyd:c:resumes',JSON.stringify({base:{title:'User version'}})]],
    fetch:async()=>({ok:true,json:async()=>({resumes:{base:{title:'Demo'},new:{title:'New demo'}}})})});
  const db = await window.HQ_USE('db');
  assert.equal((await db.doc('resumes/base').get()).data().title,'User version');
  assert.equal((await db.doc('resumes/new').get()).data().title,'New demo');
});
