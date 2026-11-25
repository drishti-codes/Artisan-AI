// Node 18+ (uses built-in fetch). Run: node scripts/verify-auth.js
const BASE = process.env.API_BASE || 'http://localhost:5000';
const PATHS = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/auth/me',
  sellerProtected: '/api/seller/profile', // any artisan-only GET route
};

const stamp = Date.now();
const pass = 'Test@12345';
const customer = { name: 'Test Customer', email: `cust${stamp}@test.com`, password: pass, role: 'customer' };
const artisan = { name: 'Test Artisan', email: `art${stamp}@test.com`, password: pass, role: 'artisan' };

let ok = 0, bad = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : extra}`);
  cond ? ok++ : bad++;
};

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json, raw: JSON.stringify(json) };
}
const pick = (json) => {
  const d = json.data || json;
  return { token: d.token, user: d.user || d };
};
const decodeJwt = (t) => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());

(async () => {
  // Register
  const rc = await call('POST', PATHS.register, customer);
  const ra = await call('POST', PATHS.register, artisan);
  check('register customer -> 2xx', rc.status >= 200 && rc.status < 300, rc.raw);
  check('register artisan -> 2xx', ra.status >= 200 && ra.status < 300, ra.raw);
  check('register response has no password', !/password/i.test(rc.raw + ra.raw));
  check('register artisan: onboardingCompleted is false', pick(ra.json).user.onboardingCompleted === false, ra.raw);

  // Role whitelist
  const rAdmin = await call('POST', PATHS.register, { ...customer, email: `adm${stamp}@test.com`, role: 'admin' });
  check('register role=admin is rejected (4xx)', rAdmin.status >= 400 && rAdmin.status < 500, rAdmin.raw);

  // Login
  const lc = await call('POST', PATHS.login, { email: customer.email, password: pass });
  const la = await call('POST', PATHS.login, { email: artisan.email, password: pass });
  const ct = pick(lc.json).token, at = pick(la.json).token;
  check('login customer returns token', !!ct, lc.raw);
  check('login artisan returns token', !!at, la.raw);
  check('login response has no password', !/password/i.test(lc.raw + la.raw));
  check('login returns onboardingCompleted for artisan', typeof pick(la.json).user.onboardingCompleted === 'boolean');
  const wrong = await call('POST', PATHS.login, { email: customer.email, password: 'wrong-pass' });
  check('wrong password -> 401/400', [400, 401].includes(wrong.status), wrong.raw);

  // JWT payload
  if (at) {
    const p = decodeJwt(at);
    console.log('INFO  artisan JWT payload keys:', Object.keys(p).join(', '));
    check('JWT has no onboardingCompleted / password', !('onboardingCompleted' in p) && !('password' in p));
    check('JWT has role', p.role === 'artisan', JSON.stringify(p));
  }

  // /me
  const mc = await call('GET', PATHS.me, null, ct);
  const ma = await call('GET', PATHS.me, null, at);
  check('/me customer role is customer', pick(mc.json).user.role === 'customer', mc.raw);
  check('/me artisan role is artisan', pick(ma.json).user.role === 'artisan', ma.raw);
  check('/me has no password', !/password/i.test(mc.raw + ma.raw));

  // 401 / 403
  const noTok = await call('GET', PATHS.sellerProtected);
  check('no token on seller route -> 401', noTok.status === 401, `got ${noTok.status}`);
  const custOnSeller = await call('GET', PATHS.sellerProtected, null, ct);
  check('customer token on seller route -> 403', custOnSeller.status === 403, `got ${custOnSeller.status}`);
  const artOnSeller = await call('GET', PATHS.sellerProtected, null, at);
  check('artisan token on seller route -> not 401/403', ![401, 403].includes(artOnSeller.status), `got ${artOnSeller.status}`);

  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();