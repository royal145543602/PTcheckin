const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../src');
let database, revision = 0;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fakeDb = { rpc: async () => ({ data: true }), from: () => {
  let update, expected;
  const query = {
    select() { return this; },
    eq(key, value) { if (key === 'revision') expected = value; return this; },
    update(value) { update = value; return this; },
    async single() { return { data: { document: clone(database), revision } }; },
    async maybeSingle() { if (expected !== revision) return { data: null }; database = clone(update.document); revision = update.revision; return { data: { revision } }; },
  };
  return query;
} };
const original = Module._load;
Module._load = function(request, parent, main) {
  if (request === '@/lib/db' || request === './db' && parent.filename.includes(`${path.sep}lib${path.sep}`)) return { getDb: () => fakeDb };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  if (request.startsWith('.') && parent?.filename.endsWith('.ts')) {
    const resolved = path.resolve(path.dirname(parent.filename), request);
    if (fs.existsSync(`${resolved}.ts`)) request = `${resolved}.ts`;
  }
  if (path.isAbsolute(request) && fs.existsSync(`${request}.ts`)) request += '.ts';
  return original.call(this, request, parent, main);
};
require.extensions['.ts'] = function(module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const { NextRequest } = require('next/server');
const store = require('../src/lib/roster-store.ts');
const { emptyWorkspace } = require('../src/lib/roster-types.ts');
const api = require('../src/app/api/workspace/route.ts');
const auth = require('../src/lib/admin-auth.ts');
process.env.ADMIN_PIN = 'test-only-password';
process.env.ADMIN_SESSION_SECRET = require('node:crypto').randomBytes(48).toString('hex');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function seed() {
  database = emptyWorkspace(); revision = 0;
  database.sessions = [{ id:'s1', date:today, title:'Test', time:'00:00–23:59', coach:'', capacity:1, registrationLimit:1, public:true }, {id:'private', date:today, title:'Private', time:'00:00–23:59', coach:'', capacity:1, public:false}];
  database.people = [{id:'p1', name:'Test person', phone:'private-phone', plan:'月卡', payment:'已收款'}];
  database.bookingPage = {title:'Test booking', description:'', sessionIds:['s1']};
}
const req = (url, method='GET', body, cookie) => new NextRequest(`https://test.invalid${url}`, {method, headers:{origin:'https://test.invalid', ...(cookie ? {cookie} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
(async () => {
  seed();
  assert.equal((await api.GET(req('/api/workspace'))).status,401, 'admin data requires session');
  assert.equal((await api.PUT(req('/api/workspace','PUT',{data:database, revision}))).status,401, 'unauthenticated writes rejected');
  database.places=[{sessionId:'s1',personId:'p1',source:'Internal',attendance:'none',signature:[{points:[{x:1,y:1}]}]}];
  const publicRoster=await (await api.GET(req('/api/workspace?mode=roster&session=s1'))).json();
  assert.equal(publicRoster.data.people[0].phone,'');
  assert.equal(publicRoster.data.people[0].payment,'');
  assert.equal(publicRoster.data.places[0].signature,undefined);
  const publicSignup=await (await api.GET(req('/api/workspace?mode=register&page=booking'))).json();
  assert.equal(publicSignup.data.people.length,0);
  assert.equal(publicSignup.data.requests.length,0);
  assert.equal(publicSignup.data.sessions.length,1);
  assert.equal((await api.POST(req('/api/workspace?mode=roster&session=s1','POST',{action:'in',sessionId:'s1',personId:'p1'}))).status,400,'read-only links cannot check in');
  assert.equal((await api.POST(req('/api/workspace?mode=kiosk&session=s1','POST',{action:'in',sessionId:'private',personId:'p1'}))).status,400,'check-in cannot cross session scope');
  assert.equal((await api.POST(req('/api/workspace?mode=kiosk&session=s1','POST',{action:'in',sessionId:'s1',personId:'p1'}))).status,200);
  assert.equal((await api.POST(req('/api/workspace?mode=kiosk&session=s1','POST',{action:'out',sessionId:'s1',personId:'p1'}))).status,200);
  assert.equal((await api.POST(req('/api/workspace?mode=kiosk&session=s1','POST',{action:'in',sessionId:'s1',personId:'p1'}))).status,400,'out cannot become in without admin rewind');
  assert.equal(database.records.length,2);
  const prior = clone(database), damaged=clone(database); damaged.records=[];
  assert.equal(store.validateWorkspace(damaged,prior),false,'attendance history cannot be erased');
  const token=await auth.createAdminSession(), cookie=`pt_admin=${token.value}`;
  assert.equal(await auth.hasAdminSession(req('/api/workspace','GET',undefined,cookie)),true);
  const actualNow=Date.now; Date.now=()=>actualNow()+301000;
  assert.equal(await auth.hasAdminSession(req('/api/workspace','GET',undefined,cookie)),false,'admin session expires after five minutes'); Date.now=actualNow;
  assert.equal((await api.PUT(req('/api/workspace','PUT',{data:database,revision:0},cookie))).status,409,'stale writes cannot overwrite new attendance');
  seed();
  const form={action:'register',sessionId:'s1',name:'Guest',phone:'Test-contact',note:''};
  const result=await api.POST(req('/api/workspace?mode=register&page=booking','POST',form)); assert.equal(result.status,201);
  const {application}=await result.json();
  assert.equal((await api.POST(req('/api/workspace?mode=register&page=booking','POST',form))).status,400,'duplicate signup is blocked');
  assert.equal((await (await api.GET(req('/api/workspace?mode=register&page=booking'))).json()).data.requests.length,0,'other visitors cannot list applications');
  assert.equal((await (await api.GET(req(`/api/workspace?mode=register&page=booking&receipt=${application.id}`))).json()).data.requests[0].id,application.id,'unguessable receipt returns only its application');
  const firstRevision=revision;
  const writes=await Promise.all([store.writeWorkspace(database,firstRevision),store.writeWorkspace(database,firstRevision)]);
  assert.equal(writes.filter((value)=>value!==null).length,1,'only one simultaneous revision wins');
  console.log('Passed: admin access, public privacy, scoped links, strict attendance, preserved history, signup/receipt privacy, concurrent write protection.');
})().catch((error) => { console.error(error); process.exitCode=1; });
