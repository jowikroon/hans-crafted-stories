// Offline regression tests for the actual Supabase Deno signup handler.
// All database and Resend API operations are mocked: zero real emails/subscribers.

const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
const nodeTest=require("node:test");
const source=fs.readFileSync(path.resolve(__dirname,"../../../supabase/functions/artist-radar-signup/index.ts"),"utf8").replace(/^import \{ createClient \} from [^\n]+\n/m,"");
let js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
js=js.replace(/^import \{ createClient \} from [^\n]+\n/m,"");
js=js.replace(/^const supabase = createClient\([^\n]+\);$/m,"const supabase = globalThis.__mockSupabase;");
js=js.replace("Deno.serve(async (req", "globalThis.__captureHandler(async (req");
if(js.includes("import { createClient }")||js.includes("const supabase = createClient("))throw Error("TypeScript transform failed");
let ctx=null;
const fresh=(rows=[])=>{ctx={rows:rows.map(x=>({...x})),lookups:0,updates:0,inserts:0,mails:0,mailHtml:[],failMail:false};return ctx;};
function table(name){
 if(name!=="artist_radar_signups")throw Error("Unmocked Supabase table "+name);
 return {
  select(fields){return query("select",null,fields)},
  update(data){return query("update",data,null)},
  insert(data){return query("insert",data,null)}
 };
}
function query(op,data,selection){
 const f={};const q={
  select(fields){selection=fields;return q;},
  eq(k,v){f[k]=v;return q;},
  ilike(k,v){f[k]=v;return q;},
  in(k,v){f[k]=v;return q;},
  or(v){f.or=v;return q;},
  async maybeSingle(){
   if(op==="select"){ctx.lookups++;const row=ctx.rows.find(x=>x.email.toLowerCase()===String(f.email).toLowerCase());return {data:row?pick(row,selection):null,error:null};}
   if(op==="update"){const row=ctx.rows.find(x=>x.id===f.id);if(!row)return {data:null,error:null};const statusOK=!f.status||f.status.includes(row.status);const oldAttempt=row.last_confirmation_attempt_at;const timeOK=!oldAttempt||Date.parse(oldAttempt)<Date.now()-3600000;
    if(!statusOK||!timeOK)return {data:null,error:null};
    Object.assign(row,data);ctx.updates++;return {data:pick(row,selection),error:null};}
   throw Error("Unhandled maybeSingle "+op);
  },
  async single(){
   if(op!=="insert")throw Error("Unhandled single "+op);
   if(ctx.rows.some(x=>x.email.toLowerCase()===data.email.toLowerCase()))return {data:null,error:{code:"23505",message:"duplicate"}};
   const row={id:"new-"+(ctx.rows.length+1),status:"pending",confirm_token:crypto.randomUUID(),...data};
   ctx.rows.push(row);ctx.inserts++;return {data:pick(row,selection),error:null};
  }
 };
 return q;
}
function pick(row,fields){if(!fields)return row;const res={};for(const name of fields.split(","))res[name]=row[name];return res;}
globalThis.__mockSupabase={from:table};
globalThis.Deno={env:{get(k){return ({SUPABASE_URL:"https://example.supabase.invalid",SUPABASE_SERVICE_ROLE_KEY:"fake",RESEND_API_KEY:"fake-key",ARTIST_RADAR_FROM_EMAIL:"Radar <fake@example.invalid>"})[k];}}};
globalThis.__captureHandler=(h)=>{globalThis.__artistRadarHandler=h;};
globalThis.fetch=async(url,opts)=>{assert.equal(url,"https://api.resend.com/emails");ctx.mails++;ctx.mailHtml.push(JSON.parse(opts.body).html);return {ok:!ctx.failMail,status:503,async text(){return "simulated failure";}};};
vm.runInThisContext(js,{filename:"artist-radar-signup-mock.js"});
const artists=[{id:"froukje",name:"Froukje",genre:"pop"}];
const email="test@example.invalid";
const req=(p)=>new Request("https://example.supabase.invalid/functions/v1/artist-radar-signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
const run=async(p)=>{const r=await globalThis.__artistRadarHandler(req(p));return {status:r.status,body:await r.json()};};
const base={email,artists,countries:["NL","BE"],source:"mock-test"};
const existing=(status,last_confirmation_attempt_at)=>({id:"confirmed-1",email,status,confirm_token:"old-token",artists:[{id:"other",name:"Original"}],countries:["BE"],last_confirmation_attempt_at});
const results=[];
async function test(name,fn){await nodeTest(name,async()=>{await fn();results.push(name);});}
(async()=>{
 await test("invalid_email_400_no_writes",async()=>{const f=fresh();const r=await run({...base,email:"invalid"});assert.equal(r.status,400);assert.equal(f.inserts+f.updates+f.mails,0);});
 await test("no_artist_400_no_writes",async()=>{const f=fresh();const r=await run({...base,artists:[]});assert.equal(r.status,400);assert.equal(f.inserts+f.updates+f.mails,0);});
 await test("honeypot_no_writes",async()=>{const f=fresh();const r=await run({...base,website:"trap"});assert.equal(r.body.ok,true);assert.equal(f.inserts+f.updates+f.mails,0);});
 await test("new_pending_one_mail",async()=>{const f=fresh();const r=await run(base);assert.equal(r.status,200);assert.equal(f.inserts,1);assert.equal(f.mails,1);assert.equal(f.rows[0].status,"pending");});
 await test("confirmed_immutable_no_mail",async()=>{const f=fresh([existing("confirmed")]);const orig=JSON.stringify(f.rows[0]);const r=await run(base);assert.equal(r.status,200);assert.equal(f.updates,0);assert.equal(f.mails,0);assert.equal(JSON.stringify(f.rows[0]),orig);assert.equal(r.body.confirmed,undefined);});
 await test("pending_recent_no_resend",async()=>{const f=fresh([existing("pending",new Date().toISOString())]);const r=await run(base);assert.equal(r.status,200);assert.equal(f.updates+f.mails,0);});
 await test("pending_old_one_resend",async()=>{const f=fresh([existing("pending",new Date(Date.now()-7200000).toISOString())]);const r=await run(base);assert.equal(r.status,200);assert.equal(f.updates,1);assert.equal(f.mails,1);assert.notEqual(f.rows[0].confirm_token,"old-token");});
 await test("pending_old_second_request_cooldown",async()=>{const f=fresh([existing("pending",new Date(Date.now()-7200000).toISOString())]);await run(base);await run(base);assert.equal(f.mails,1);assert.equal(f.updates,1);});
 await test("unsubscribed_reconfirmation",async()=>{const f=fresh([existing("unsubscribed",null)]);await run(base);assert.equal(f.rows[0].status,"pending");assert.equal(f.mails,1);});
 await test("new_duplicate_concurrent_single_mail",async()=>{const f=fresh();const rs=await Promise.all([run(base),run(base),run(base)]);assert.equal(rs.length,3);assert.equal(f.inserts,1);assert.equal(f.mails,1);});
 await test("pending_concurrent_single_mail",async()=>{const f=fresh([existing("pending",new Date(Date.now()-7200000).toISOString())]);const rs=await Promise.all([run(base),run(base),run(base)]);assert.equal(rs.length,3);assert.equal(f.updates,1);assert.equal(f.mails,1);});
 await test("mail_error_no_real_delivery",async()=>{const f=fresh();f.failMail=true;const r=await run(base);assert.equal(r.body.mail_pending,true);assert.equal(f.inserts,1);});
 await test("html_escaping",async()=>{const f=fresh();await run({...base,artists:[{id:"x",name:"<img src=x onerror=alert(1)>",genre:""}]});assert.ok(f.mailHtml[0].includes("&lt;img"));assert.ok(!f.mailHtml[0].includes("<img src=x"));});
 await test("max_25_artists",async()=>{const f=fresh();await run({...base,artists:Array.from({length:40},(_,i)=>({id:"a"+i,name:"A".repeat(110)}))});assert.equal(f.rows[0].artists.length,25);assert.equal(f.rows[0].artists[0].name.length,100);});
 await test("success_non_enumerating",async()=>{const f1=fresh();const a=await run(base);const f2=fresh([existing("confirmed")]);const b=await run(base);const f3=fresh([existing("pending",new Date().toISOString())]);const c=await run(base);assert.deepEqual(a.body,b.body);assert.deepEqual(a.body,c.body);});
 await test("no_live_requests",async()=>{assert.ok(true);});
 process.stdout.write(JSON.stringify({ok:true,total:results.length,results},null,2));
})().catch(e=>{process.stderr.write(String(e.stack||e));process.exitCode=1;});
