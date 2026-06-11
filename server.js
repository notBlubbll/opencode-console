const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3030;
const ORIGIN = 'https://console.opencode.ai';
const cacheDir = path.join(__dirname, '.asset-cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  const orig = res.json.bind(res);
  res.json = function(body) {
    console.log(`[${Date.now()-start}ms] ${req.method} ${req.path} -> ${JSON.stringify(body).substring(0,120)}`);
    return orig(body);
  };
  next();
});

const UID = 'user_k8x7m3abc123def';
function sess(e) { return { expiresAt: new Date(Date.now()+86400000).toISOString(), user: { id: UID, email: e || 'admin@demo.local' } }; }

async function get(url) {
  const k = Buffer.from(url).toString('base64url');
  const p = path.join(cacheDir, k);
  if (fs.existsSync(p)) return fs.readFileSync(p);
  const r = await fetch(url);
  const b = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(p, b); return b;
}

app.get('/favicon.svg', async (req, res) => { try { res.type('svg').send(await get(ORIGIN+'/favicon.svg')); } catch { res.status(404).end(); } });
app.get('/assets/*', async (req, res) => {
  try { const m={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'}; res.type(m[path.extname(req.path)]||'application/octet-stream').send(await get(ORIGIN+req.path)); } catch { res.status(404).end(); }
});

app.get('/auth/session', (req, res) => { console.log('SESSION'); res.json(sess('admin@demo.local')); });
app.post('/auth/login', (req, res) => { console.log('LOGIN', req.body?.email); res.json(sess(req.body?.email)); });
app.post('/auth/register', (req, res) => res.json(sess(req.body?.email)));
app.post('/auth/logout', (req, res) => res.json({ ok: true }));
app.post('/auth/refresh', (req, res) => res.json(sess('admin@demo.local')));
app.get('/auth/password-status', (req, res) => res.json({ hasPassword: true }));
app.get('/auth/email-verified', (req, res) => res.json({ verified: true }));
app.post('/auth/send-verification-email', (req, res) => res.json({ ok: true }));
app.post('/auth/verify-email', (req, res) => res.json({ ok: true }));
app.post('/auth/request-password-reset', (req, res) => res.json({ ok: true }));
app.post('/auth/reset-password', (req, res) => res.json({ ok: true }));
app.post('/auth/change-password', (req, res) => res.json({ ok: true }));
app.post('/api/connections/models', (req, res) => res.json({ _tag:'ConnectionModelsResult', models:[
  { _tag:'ConnectionModelOption', id:'gpt-4o', name:'GPT-4o' },
  { _tag:'ConnectionModelOption', id:'gpt-4o-mini', name:'GPT-4o Mini' },
  { _tag:'ConnectionModelOption', id:'claude-sonnet-4-20250514', name:'Claude Sonnet 4' },
  { _tag:'ConnectionModelOption', id:'claude-haiku-3-5', name:'Claude Haiku 3.5' },
  { _tag:'ConnectionModelOption', id:'gemini-2.5-flash-001', name:'Gemini 2.5 Flash' },
  { _tag:'ConnectionModelOption', id:'gemini-2.5-pro-001', name:'Gemini 2.5 Pro' }
] }));
app.post('/api/connections', (req, res) => res.json({ _tag:'ConnectionRow', id:'conn_new_'+Date.now(), displayName:req.body?.displayName||'New Connection', config:{ _tag:'openai', enabledModels:[], credential:'<REDACTED>' }, credentialHint:'sk-***', updatedAt:new Date().toISOString() }));
app.patch('/api/connections/:connectionId', (req, res) => res.json({ _tag:'ConnectionRow', id:req.params.connectionId, displayName:req.body?.displayName||'Updated', config:{ _tag:'openai', enabledModels:[], credential:'<REDACTED>' }, credentialHint:'sk-***', updatedAt:new Date().toISOString() }));
app.post('/auth/device/code', (req, res) => res.json({ device_code:'dc', user_code:'ABCD', verification_uri:'/device', expires_in:300, interval:5 }));
app.post('/auth/device/token', (req, res) => res.json({ access_token:'at', refresh_token:'rt', token_type:'Bearer', expires_in:3600 }));
app.post('/auth/device/approve', (req, res) => res.json({ ok: true }));
app.post('/auth/device/deny', (req, res) => res.json({ ok: true }));

app.get('/api/sso/hrd', (req, res) => { console.log('HRD', req.query.email); res.json(null); });
app.get('/api/sso/discover', (req, res) => res.json(null));
app.get('/api/setup/status', (req, res) => res.json({ emailPassword:true, oidc:false, oidcProvider:'', oidcLabel:'', oidcCallbackPath:'', socialProviders:[], signup:'locked', inviteCount:0, domainCount:0, signupAllowedDomainsConfigured:false, signupAllowedDomainCount:0, setupMode:false }));
app.get('/api/config', (req, res) => res.json({ _tag:'OpenCodeConfigResponse', config:{ enterprise:null, enabled_providers:null, provider:{} } }));
app.get('/api/orgs/current', (req, res) => res.json({ _tag:'OrgContextView', userId:UID, org:{ id:'org_abc123def', name:'Demo', managedProvidersOnly:false }, role:'admin' }));
app.get('/api/orgs', (req, res) => res.json([{ _tag:'OrgView', id:'org_abc123def', name:'Demo', managedProvidersOnly:false, role:'admin' }]));
function mkAcct(id, name) { return { _tag:'ServiceAccount', id:'svcacct_'+id, orgId:'org_abc123def', name, createdByUserId:null, createdAt:'2026-01-15T10:30:00Z', updatedAt:'2026-06-10T14:22:00Z' }; }
function mkKey(id, name, saId) { return { _tag:'ServiceApiKey', id:'sk_'+id, serviceAccountId:'svcacct_'+saId, orgId:'org_abc123def', name, tokenHint:name.substring(0,3)+'...', status:'active', expiresAt:null, revokedAt:null, lastUsedAt:null, createdByUserId:null, revokedByUserId:null, createdAt:'2026-02-01T08:00:00Z', updatedAt:'2026-06-10T14:22:00Z' }; }
const SVC_ACCTS = [
  { _tag:'ServiceAccountWithKeys', account:mkAcct('demo001','CI/CD Pipeline'), keys:[mkKey('k01','deploy-key','demo001')] },
  { _tag:'ServiceAccountWithKeys', account:mkAcct('demo002','Monitoring Bot'), keys:[mkKey('k02','metrics-key','demo002')] },
  { _tag:'ServiceAccountWithKeys', account:mkAcct('demo003','Slack Integration'), keys:[] }
];
function pg(items, page=1, pageSize=20) { return { items, pageInfo: { _tag:'PageInfo', page, pageSize, total:Math.max(1,items.length), pageCount:Math.max(1,Math.ceil(items.length/pageSize)) } }; }
app.get('/api/service-accounts', (req, res) => { console.log('SVC LIST', req.query); res.json(pg(SVC_ACCTS)); });
app.get('/api/service-accounts/:serviceAccountId', (req, res) => { const s = SVC_ACCTS.find(x => x.account.id === req.params.serviceAccountId); res.json(s || null); });
app.post('/api/service-accounts', (req, res) => { const n = req.body?.name||'New SA'; const id = Date.now().toString(36); SVC_ACCTS.push({ _tag:'ServiceAccountWithKeys', account:mkAcct(id, n), keys:[] }); console.log('SVC CREATE', id, n); res.json(mkAcct(id, n)); });
const CONNS = [
  { _tag:'Connection', id:'conn_bedrock_main', displayName:'AWS Bedrock Demo', config:{ _tag:'bedrock', accessKeyId:'AKIA****WXYZ', region:'us-east-1' }, credentialHint:'AKIA****WXYZ', updatedAt:'2026-06-10T14:22:00Z' },
  { _tag:'Connection', id:'conn_openai_prod', displayName:'OpenAI Production', config:{ _tag:'openai', enabledModels:['gpt-4o','gpt-4o-mini'], credential:'<REDACTED>' }, credentialHint:'sk-abc...def1', updatedAt:'2026-06-09T09:15:00Z' },
  { _tag:'Connection', id:'conn_anthropic_dev', displayName:'Anthropic Dev', config:{ _tag:'anthropic', enabledModels:['claude-sonnet-4-20250514','claude-haiku-3-5'], credential:'<REDACTED>' }, credentialHint:'sk-ant-***', updatedAt:'2026-06-08T16:30:00Z' }
];
app.get('/api/connections', (req, res) => res.json(pg(CONNS)));
app.get('/api/shares', (req, res) => res.json([]));
app.get('/api/sse/providers', (req, res) => res.json([]));
app.get('/api/sso', (req, res) => res.json([]));
const MEMBERS = [
  { _tag:'Member', userId:UID, email:'admin@demo.local', name:'Admin User', role:'owner', createdAt:'2026-01-01T00:00:00Z' },
  { _tag:'Member', userId:'user_member001abc', email:'alice@demo.local', name:'Alice Wang', role:'admin', createdAt:'2026-02-15T09:30:00Z' },
  { _tag:'Member', userId:'user_member002xyz', email:'bob@demo.local', name:null, role:'member', createdAt:'2026-03-20T14:00:00Z' }
];
app.get('/api/members', (req, res) => res.json(pg(MEMBERS)));
app.get('/api/members/:userId', (req, res) => { const m = MEMBERS.find(x => x.userId === req.params.userId); if (!m) return res.status(404).json({ message:'Member not found' }); res.json(m); });
app.get('/api/me/orgs', (req, res) => res.json([{ _tag:'OrgView', id:'org_abc123def', name:'Demo', managedProvidersOnly:false, role:'admin' }]));
app.get('/api/leaderboard', (req, res) => res.json({ users:[], models:[] }));
app.get('/api/usage', (req, res) => res.json({ _tag:'UsageSummary', totalRequests:"45800", totalInputTokens:"12500000", totalOutputTokens:"3200000", totalCacheReadTokens:"8900000", totalCacheWrite5mTokens:"450000", totalCacheWrite1hTokens:"120000", totalCostMicroCents:"452000000", daily:[
  { _tag:'DailyCost', date:'2026-06-08', totalCostMicroCents:'1250000', totalTokens:'850000', totalRequests:'4200' },
  { _tag:'DailyCost', date:'2026-06-09', totalCostMicroCents:'980000', totalTokens:'620000', totalRequests:'3100' },
  { _tag:'DailyCost', date:'2026-06-10', totalCostMicroCents:'1520000', totalTokens:'1050000', totalRequests:'5300' },
  { _tag:'DailyCost', date:'2026-06-11', totalCostMicroCents:'780000', totalTokens:'510000', totalRequests:'2600' }
] }));
app.get('/api/usage/summary', (req, res) => res.json({ _tag:'UsageSummary', totalRequests:"45800", totalInputTokens:"12500000", totalOutputTokens:"3200000", totalCacheReadTokens:"8900000", totalCacheWrite5mTokens:"450000", totalCacheWrite1hTokens:"120000", totalCostMicroCents:"452000000" }));
app.get('/api/usage/cost-by-day', (req, res) => res.json([
  { _tag:'DailyCost', date:'2026-06-08', totalCostMicroCents:'1250000', totalTokens:'850000', totalRequests:'4200' },
  { _tag:'DailyCost', date:'2026-06-09', totalCostMicroCents:'980000', totalTokens:'620000', totalRequests:'3100' },
  { _tag:'DailyCost', date:'2026-06-10', totalCostMicroCents:'1520000', totalTokens:'1050000', totalRequests:'5300' },
  { _tag:'DailyCost', date:'2026-06-11', totalCostMicroCents:'780000', totalTokens:'510000', totalRequests:'2600' }
]));
const USAGE_ROWS = [
  { _tag:'UsageSelect', id:1, orgId:'org_abc123def', userId:UID, principalType:'user', serviceUserId:null, serviceApiKeyId:null, appReferrer:null, appTitle:'Code review', provider:'openai', model:'gpt-4o', inputTokens:1200, outputTokens:450, reasoningTokens:0, cacheReadTokens:800, cacheWrite5mTokens:50, cacheWrite1hTokens:10, reasoningMode:null, reasoningEffort:null, reasoningBudgetTokens:null, reasoningSource:null, billingSource:null, costMicroCents:8500, createdAt:'2026-06-11T08:30:00Z' },
  { _tag:'UsageSelect', id:2, orgId:'org_abc123def', userId:UID, principalType:'user', serviceUserId:null, serviceApiKeyId:null, appReferrer:null, appTitle:'Debug error', provider:'anthropic', model:'claude-sonnet-4-20250514', inputTokens:3200, outputTokens:1100, reasoningTokens:400, cacheReadTokens:1500, cacheWrite5mTokens:120, cacheWrite1hTokens:30, reasoningMode:null, reasoningEffort:null, reasoningBudgetTokens:null, reasoningSource:null, billingSource:null, costMicroCents:22500, createdAt:'2026-06-11T07:15:00Z' },
  { _tag:'UsageSelect', id:3, orgId:'org_abc123def', userId:'user_member001abc', principalType:'user', serviceUserId:null, serviceApiKeyId:null, appReferrer:'slack', appTitle:'Slack thread summary', provider:'google', model:'gemini-2.5-flash-001', inputTokens:800, outputTokens:300, reasoningTokens:0, cacheReadTokens:200, cacheWrite5mTokens:20, cacheWrite1hTokens:5, reasoningMode:null, reasoningEffort:null, reasoningBudgetTokens:null, reasoningSource:null, billingSource:null, costMicroCents:3200, createdAt:'2026-06-10T22:00:00Z' },
  { _tag:'UsageSelect', id:4, orgId:'org_abc123def', userId:null, principalType:'service-account', serviceUserId:'svcacct_demo001', serviceApiKeyId:'sk_k01', appReferrer:null, appTitle:'CI build', provider:'openai', model:'gpt-4o-mini', inputTokens:4500, outputTokens:1200, reasoningTokens:0, cacheReadTokens:2800, cacheWrite5mTokens:200, cacheWrite1hTokens:60, reasoningMode:null, reasoningEffort:null, reasoningBudgetTokens:null, reasoningSource:null, billingSource:null, costMicroCents:14500, createdAt:'2026-06-10T18:30:00Z' }
];
app.get('/api/usage/rows', (req, res) => res.json({ items:USAGE_ROWS, nextCursor:null }));
const MODELS = [
  { _tag:'ModelSummary', model:'gpt-4o', provider:'openai', totalRequests:"12400", totalInputTokens:"5200000", totalOutputTokens:"1500000", totalCacheReadTokens:"3100000", totalCacheWrite5mTokens:"180000", totalCacheWrite1hTokens:"50000", totalCostMicroCents:"210000000" },
  { _tag:'ModelSummary', model:'claude-sonnet-4-20250514', provider:'anthropic', totalRequests:"8900", totalInputTokens:"3800000", totalOutputTokens:"980000", totalCacheReadTokens:"2600000", totalCacheWrite5mTokens:"120000", totalCacheWrite1hTokens:"35000", totalCostMicroCents:"165000000" },
  { _tag:'ModelSummary', model:'gemini-2.5-flash-001', provider:'google', totalRequests:"22100", totalInputTokens:"6200000", totalOutputTokens:"1700000", totalCacheReadTokens:"4100000", totalCacheWrite5mTokens:"280000", totalCacheWrite1hTokens:"60000", totalCostMicroCents:"98000000" }
];
app.get('/api/usage/models', (req, res) => res.json(pg(MODELS)));
const USERS = [
  { _tag:'UserUsageSummary', userId:UID, serviceUserId:null, principalType:'user', email:'admin@demo.local', name:'Admin User', totalRequests:"28400", totalInputTokens:"8900000", totalOutputTokens:"2100000", totalCacheReadTokens:"5800000", totalCacheWrite5mTokens:"320000", totalCacheWrite1hTokens:"85000", totalCostMicroCents:"310000000", lastActiveAt:'2026-06-11T08:30:00Z' },
  { _tag:'UserUsageSummary', userId:'user_member001abc', serviceUserId:null, principalType:'user', email:'alice@demo.local', name:'Alice Wang', totalRequests:"14200", totalInputTokens:"3200000", totalOutputTokens:"980000", totalCacheReadTokens:"2400000", totalCacheWrite5mTokens:"110000", totalCacheWrite1hTokens:"28000", totalCostMicroCents:"125000000", lastActiveAt:'2026-06-10T16:45:00Z' },
  { _tag:'UserUsageSummary', userId:null, email:null, principalType:'service-account', serviceUserId:'svcacct_demo001', name:'CI/CD Pipeline', totalRequests:"3200", totalInputTokens:"400000", totalOutputTokens:"120000", totalCacheReadTokens:"700000", totalCacheWrite5mTokens:"20000", totalCacheWrite1hTokens:"7000", totalCostMicroCents:"17000000", lastActiveAt:null }
];
app.get('/api/usage/users', (req, res) => res.json(pg(USERS)));
app.get('/api/budgets/*', (req, res) => res.json(null));
app.get('/api/shares/me', (req, res) => res.json(pg([])));
app.get('/api/shares/admin', (req, res) => res.json(pg([])));
app.get('/health', (req, res) => res.json({ status:'ok' }));
app.get('/ready', (req, res) => res.json({ status:'ok' }));
app.all('/api/*', (req, res) => res.json({ ok: true }));

app.get('/login', (req, res) => { res.set('Set-Cookie', 'opencode_session='+Buffer.from(JSON.stringify({id:UID,email:'admin@demo.local'})).toString('base64')+';Path=/;Max-Age=86400;HttpOnly;SameSite=Lax'); res.redirect('/'); });
app.get('/signup', (req, res) => { res.set('Set-Cookie', 'opencode_session='+Buffer.from(JSON.stringify({id:UID,email:'admin@demo.local'})).toString('base64')+';Path=/;Max-Age=86400;HttpOnly;SameSite=Lax'); res.redirect('/'); });

app.get('/org/select', (req, res) => res.redirect('/'));

app.get('*', async (req, res) => {
  try {
    let h = (await get(ORIGIN + '/')).toString('utf8');
    h = h.replace('<div id="app"></div>', '<div id="app"></div><script>(function(){var F=window.fetch;window.fetch=function(){var a=arguments,u=typeof a[0]=="string"?a[0]:a[0].url;return F.apply(window,a).then(function(r){var j=r.json.bind(r),t=r.text.bind(r);r.json=function(){return j().then(function(b){if(u.indexOf("/auth/session")>=0||u.indexOf("/auth/login")>=0)return{expiresAt:new Date(Date.now()+86400000).toISOString(),user:{id:"user_k8x7m3abc123def",email:"admin@demo.local"}};if(u.indexOf("/api/orgs/current")>=0)return{_tag:"OrgContextView",userId:"user_k8x7m3abc123def",org:{id:"org_abc123def",name:"Demo",managedProvidersOnly:false},role:"admin",singleOrgMode:true};if(u.indexOf("/api/orgs")>=0)return[{_tag:"OrgView",id:"org_abc123def",name:"Demo",managedProvidersOnly:false,role:"admin"}];return b})};r.text=function(){return j().then(function(b){if(u.indexOf("/auth/session")>=0||u.indexOf("/auth/login")>=0)return JSON.stringify({expiresAt:new Date(Date.now()+86400000).toISOString(),user:{id:"user_k8x7m3abc123def",email:"admin@demo.local"}});if(u.indexOf("/api/orgs/current")>=0)return JSON.stringify({_tag:"OrgContextView",userId:"user_k8x7m3abc123def",org:{id:"org_abc123def",name:"Demo",managedProvidersOnly:false},role:"admin",singleOrgMode:true});if(u.indexOf("/api/orgs")>=0)return JSON.stringify([{_tag:"OrgView",id:"org_abc123def",name:"Demo",managedProvidersOnly:false,role:"admin"}]);return t()})};return r})};var _j=Response.prototype.json,_t=Response.prototype.text;Response.prototype.json=function(){var u=this.url;return _j.call(this).then(function(b){if(u.indexOf("/auth/session")>=0||u.indexOf("/auth/login")>=0)return{expiresAt:new Date(Date.now()+86400000).toISOString(),user:{id:"user_k8x7m3abc123def",email:"admin@demo.local"}};if(u.indexOf("/api/orgs/current")>=0)return{_tag:"OrgContextView",userId:"user_k8x7m3abc123def",org:{id:"org_abc123def",name:"Demo",managedProvidersOnly:false},role:"admin",singleOrgMode:true};if(u.indexOf("/api/orgs")>=0)return[{_tag:"OrgView",id:"org_abc123def",name:"Demo",managedProvidersOnly:false,role:"admin"}];return b})};Response.prototype.text=function(){var u=this.url;return _t.call(this).then(function(t){try{var b=JSON.parse(t);if(u.indexOf("/auth/session")>=0||u.indexOf("/auth/login")>=0)return JSON.stringify({expiresAt:new Date(Date.now()+86400000).toISOString(),user:{id:"user_k8x7m3abc123def",email:"admin@demo.local"}});if(u.indexOf("/api/orgs/current")>=0)return JSON.stringify({_tag:"OrgContextView",userId:"user_k8x7m3abc123def",org:{id:"org_abc123def",name:"Demo",managedProvidersOnly:false},role:"admin",singleOrgMode:true});if(u.indexOf("/api/orgs")>=0)return JSON.stringify([{_tag:"OrgView",id:"org_abc123def",name:"Demo",managedProvidersOnly:false,role:"admin"}]);return t}catch(e){return t}})};var p=window.location.pathname;if(!sessionStorage.getItem("oc_r1")){sessionStorage.setItem("oc_r1","1");if(p==="/login"||p==="/signup"||p.startsWith("/login")||p.startsWith("/signup"))window.location.replace("/login")}})();</script>');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.type('html').send(h);
  } catch(e) { console.error(e); res.status(500).end(); }
});

app.listen(PORT, () => console.log('http://localhost:'+PORT));
