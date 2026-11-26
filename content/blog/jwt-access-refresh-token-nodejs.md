---
title: JWT Access Token and Refresh Token Authentication in Node.js (with Rotation)
description: Build secure JWT authentication in Node.js and Express: short-lived access tokens, rotating refresh tokens in httpOnly cookies, reuse detection, RBAC and logout.
date: 2026-11-26
tags: Node.js, Security, Authentication, Express
keyword: jwt access token refresh token node js
draft: false
---

Most JWT tutorials stop at "sign a token at login, verify it on each request". That works in a demo, but it leaves real problems: tokens that live for days, no way to log a user out, tokens kept in `localStorage` where any injected script can read them, and no defence when a token is stolen.

This guide builds the pattern used in production systems: **short-lived access tokens** plus **rotating refresh tokens** with **reuse detection**, then adds role-based access control. Every response shown below comes from running the code with **Express 5** and **jsonwebtoken 9** on Node.js 22.

## Why two tokens?

| | Access token | Refresh token |
| --- | --- | --- |
| Purpose | Authorize API requests | Get a new access token |
| Lifetime | Short (5–15 minutes) | Long (days or weeks) |
| Format | Signed JWT | Random opaque string |
| Stored by the client | In memory (JavaScript variable) | `httpOnly` cookie |
| Checked by the server | Signature only (no database) | Against the database, every time |
| Can be revoked instantly | No (wait for expiry) | Yes |

The access token is **stateless**: the server verifies its signature without a database lookup, which keeps every API request fast. The cost is that it cannot be revoked before it expires, so it must expire quickly.

The refresh token is **stateful**: it is checked against the database, so it can be revoked at any time. Because it is only sent to one endpoint, the extra database lookup happens rarely.

Together they give you fast requests *and* real logout.

## The flow

1. **Login:** the server checks the password and returns an **access token** in the response body and a **refresh token** in an `httpOnly` cookie.
2. **API calls:** the client sends `Authorization: Bearer <access token>`.
3. **Access token expires:** the API returns `401 token_expired`.
4. **Refresh:** the client calls `POST /auth/refresh`. The browser sends the cookie automatically, and the server returns a new access token **and a new refresh token**. The old refresh token stops working.
5. **Logout:** the server revokes the refresh token and clears the cookie.

## Signing and verifying access tokens

```js
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET; // long random value, never committed
const JWT_OPTIONS = { issuer: "api.example.com", audience: "example-web" };

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
    ...JWT_OPTIONS,
    algorithm: "HS256",
    expiresIn: "15m",
  });
}
```

The decoded payload of a token issued by this code:

```json
{ "sub": "u1", "role": "admin", "iat": 1795693605, "exp": 1795693607, "aud": "example-web", "iss": "api.example.com" }
```

That payload is only **Base64-encoded, not encrypted**. Anyone who has the token can read it. Put only what authorization needs in it (a user ID and role) and **never** passwords, personal data or secrets.

Generate the secret properly, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The verification middleware:

```js
function authenticate(req, res, next) {
  const [scheme, token] = (req.get("Authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "missing_token" });

  try {
    req.user = jwt.verify(token, ACCESS_SECRET, { ...JWT_OPTIONS, algorithms: ["HS256"] });
    next();
  } catch (err) {
    const error = err.name === "TokenExpiredError" ? "token_expired" : "invalid_token";
    res.status(401).json({ error });
  }
}
```

Two details matter:

- **`algorithms: ["HS256"]`** pins the accepted algorithm. Never let the token's own header decide how it is verified.
- **A distinct `token_expired` error** tells the client to refresh, rather than send the user to the login page.

I tested both attacks people try against JWTs. Editing the payload to change the role, and sending an unsigned token with `"alg": "none"`:

```text
GET /api/finance (payload edited to finance)   401 {"error":"invalid_token"}
GET /api/profile (alg: none token)             401 {"error":"invalid_token"}
```

The signature no longer matches the edited payload, and the `none` algorithm is rejected.

## Refresh tokens: opaque, hashed and rotated

The refresh token does not need to be a JWT. The server has to look it up anyway, so a **random string** is simpler and reveals nothing:

```js
const crypto = require("node:crypto");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function issueRefreshToken(userId, familyId = crypto.randomUUID()) {
  const token = crypto.randomBytes(48).toString("base64url");
  RefreshToken.create({
    tokenHash: sha256(token), // store a hash, never the token itself
    userId,
    familyId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return token;
}
```

**Store only a hash** of the token, like a password. If the database leaks, the attacker cannot use the stored values. A fast SHA-256 is enough here because the token is 48 random bytes, so it cannot be brute-forced like a human password.

A Mongoose schema for it:

```js
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Types.ObjectId, required: true, index: true },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
  revokedAt: Date,
});

// let MongoDB delete expired tokens automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Rotation with reuse detection

Each refresh token works **exactly once**. Using it returns a new one in the same **family** (all tokens descended from one login). If an already-used token shows up again, someone has a copy it should not have:

```js
function rotateRefreshToken(token) {
  const record = token && findByHash(sha256(token));
  if (!record) return { error: "invalid_refresh_token" };
  if (record.revokedAt) return { error: "refresh_token_revoked" }; // logged out or family revoked
  if (record.usedAt) {
    revokeFamily(record.familyId); // a rotated token came back: likely stolen, end every session in the family
    return { error: "refresh_token_reused" };
  }
  if (record.expiresAt < Date.now()) return { error: "refresh_token_expired" };

  record.usedAt = Date.now();
  return { userId: record.userId, refreshToken: issueRefreshToken(record.userId, record.familyId) };
}
```

Why revoke the whole family? Imagine an attacker steals a refresh token. If the attacker uses it first, the real user's next refresh presents the old token. If the user refreshes first, the attacker's attempt is the reuse. **Either way, the reuse is detected**, and revoking the family logs out both parties. The real user signs in again; the attacker cannot.

In production, make the "check and mark as used" step **atomic**, so two requests cannot both use the same token. With MongoDB, a conditional `findOneAndUpdate({ tokenHash, usedAt: null, revokedAt: null }, { $set: { usedAt: new Date() } })` does this, the same pattern as preventing [duplicate payments](/blog/prevent-duplicate-payments-nodejs).

## The Express routes

```js
const COOKIE = "refresh_token";
const cookieOptions = {
  httpOnly: true, // JavaScript cannot read it
  secure: true, // HTTPS only
  sameSite: "strict", // not sent on cross-site requests
  path: "/auth", // only sent to the auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

app.post("/auth/login", async (req, res) => {
  const user = await verifyCredentials(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  res.cookie(COOKIE, issueRefreshToken(user.id), cookieOptions);
  res.json({ accessToken: signAccessToken(user) });
});

app.post("/auth/refresh", async (req, res) => {
  const result = rotateRefreshToken(req.cookies[COOKIE]);
  if (result.error) {
    res.clearCookie(COOKIE, { path: "/auth" });
    return res.status(401).json({ error: result.error });
  }
  res.cookie(COOKIE, result.refreshToken, cookieOptions);
  res.json({ accessToken: signAccessToken(await findUser(result.userId)) });
});

app.post("/auth/logout", (req, res) => {
  const record = findByHash(sha256(req.cookies[COOKIE] || ""));
  if (record) revokeFamily(record.familyId);
  res.clearCookie(COOKIE, { path: "/auth" });
  res.status(204).end();
});
```

Restricting the cookie's `path` to `/auth` means the refresh token is not sent with every API request, only to the endpoints that need it. Use the same `path` when clearing the cookie, or the browser keeps it.

## Role-based access control (RBAC)

Once `authenticate` has set `req.user`, authorization is a small middleware:

```js
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: "forbidden" });

app.get("/api/profile", authenticate, (req, res) => res.json({ userId: req.user.sub, role: req.user.role }));
app.get("/api/admin/reports", authenticate, authorize("admin"), getReports);
app.get("/api/finance", authenticate, authorize("finance"), getFinance);
```

Note the status codes: **401** means "we don't know who you are" (missing, invalid or expired token). **403** means "we know who you are, but you can't do this".

For larger applications, check **permissions** (`orders:refund`, `products:edit`) rather than role names, and map roles to permission sets. Adding a role then becomes a configuration change instead of a code change across many routes. Because a role change only takes effect when the next access token is issued, short access token lifetimes also matter here.

## The complete flow, tested

I ran the whole flow against the server with a **2-second** access token lifetime so expiry could be tested quickly:

```text
POST /auth/login (wrong password)                  401 {"error":"invalid_credentials"}
POST /auth/login                                   200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
  Set-Cookie flags: Max-Age, Path, Expires, HttpOnly, Secure, SameSite
GET  /api/profile (no token)                       401 {"error":"missing_token"}
GET  /api/profile (Bearer access token)            200 {"userId":"u1","role":"admin"}
GET  /api/admin/reports (role admin)               200 {"ok":true}
GET  /api/finance (role admin, needs finance)      403 {"error":"forbidden"}
GET  /api/profile (after access token expiry)      401 {"error":"token_expired"}
POST /auth/refresh                                 200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
  refresh token rotated: true
GET  /api/profile (new access token)               200 {"userId":"u1","role":"admin"}
POST /auth/refresh (OLD token replayed)            401 {"error":"refresh_token_reused"}
POST /auth/refresh (latest token, family revoked)  401 {"error":"refresh_token_revoked"}
POST /auth/logout                                  204
POST /auth/refresh (after logout)                  401 {"error":"refresh_token_revoked"}
```

Replaying the old refresh token did not just fail. It also invalidated the newest token in the same family, which is exactly what reuse detection should do.

## The client side: refresh once, not once per request

On the frontend, keep the access token **in memory** (a variable or state store), not in `localStorage`. On a `401 token_expired`, refresh and retry. But there is a trap. When a page loads several API calls at once and the token has expired, every call gets a `401` and tries to refresh **with the same cookie**. With rotation, only the first succeeds:

```text
naive: two parallel refreshes with the same cookie:
   200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
   401 {"error":"refresh_token_reused"}
```

The second request looks like token theft, so the family is revoked and the user is logged out for no reason. The fix is to share **one in-flight refresh** between all callers:

```js
let accessToken = null;
let refreshing = null;

function refreshAccessToken() {
  refreshing ??= fetch("/auth/refresh", { method: "POST", credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("session_expired"))))
    .then((data) => (accessToken = data.accessToken))
    .finally(() => (refreshing = null));
  return refreshing;
}

async function api(url, options = {}) {
  const send = () => fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${accessToken}` } });
  let res = await send();
  if (res.status === 401) {
    await refreshAccessToken(); // everyone waits for the same refresh
    res = await send();
  }
  return res;
}
```

With this in place:

```text
single-flight: 3 callers, 1 network request:
   200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
   200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
   200 {"accessToken":"eyJhbGciOiJIUzI1NiIs..."}
```

In Angular, the same idea lives in an `HttpInterceptor` with a shared observable (for example `shareReplay(1)`). In React, put it in your fetch wrapper or Axios interceptor. Multiple browser tabs can still race each other. If that matters for your app, allow a short grace period (a few seconds) during which the just-rotated token is still accepted, or coordinate tabs with a `BroadcastChannel`.

## Where to store tokens

| Storage | Readable by injected JavaScript (XSS) | Sent automatically (CSRF risk) | Verdict |
| --- | --- | --- | --- |
| `localStorage` / `sessionStorage` | Yes | No | Avoid for long-lived tokens |
| Memory (JS variable) | Only while the page is compromised | No | Good for access tokens |
| `httpOnly` cookie | No | Yes, mitigated by `SameSite` + narrow `path` | Good for refresh tokens |

`httpOnly` cookies are not a substitute for preventing XSS, since injected code can still make requests *as* the user while the page is open. But it cannot steal the long-lived refresh token and use it later from elsewhere. If your frontend and API are on different sites, `sameSite: "strict"` will block the cookie. Use `"lax"` or `"none"` together with CORS restricted to your own origin and a CSRF defence on the refresh endpoint.

## Security checklist

- Access tokens: **5–15 minutes**, signed with a long random secret, algorithm pinned on verify.
- Validate `iss` and `aud`, so a token issued for one service is not accepted by another.
- Refresh tokens: **random, hashed in the database, rotated on every use**, with reuse detection.
- Cookies: `httpOnly`, `secure`, `sameSite`, narrow `path`.
- **Rate-limit** `/auth/login` and `/auth/refresh`.
- Hash passwords with **bcrypt, scrypt or Argon2**, never a plain or fast hash.
- Revoke all refresh tokens when a user changes their password or is disabled.
- Keep JWT payloads minimal: no personal data or secrets.
- Rotate signing secrets periodically. For multiple services, consider asymmetric keys (RS256 or EdDSA) so only the auth service can sign.

## Interview questions: quick answers

**Why not use one long-lived JWT?**
A stateless JWT cannot be revoked before it expires. A long-lived one means logout, password changes and stolen tokens cannot take effect for days.

**Why is the refresh token not a JWT?**
It is checked against the database on every use anyway, so self-contained claims add nothing. A random opaque string is simpler and reveals nothing if exposed.

**What is refresh token rotation?**
Each refresh token can be used once. Using it returns a new one, and the old one becomes invalid.

**What is reuse detection?**
If an already-used refresh token is presented again, it was likely copied. The server revokes the entire token family, ending every session derived from that login.

**How do you log out with JWTs?**
Revoke the refresh token on the server and clear the cookie. The access token stays valid until it expires, which is why it must be short-lived. For immediate revocation of access tokens too, check a short-lived denylist or a per-user "tokens valid after" timestamp.

**What is the difference between 401 and 403?**
401: not authenticated (no valid token). 403: authenticated but not allowed.

**Is data in a JWT encrypted?**
No. A standard JWT (JWS) is signed, not encrypted. Anyone can decode the payload, but nobody can change it without the secret.

## Summary

- **Access token:** short-lived JWT, kept in memory, verified without a database.
- **Refresh token:** random, hashed, rotated, in an `httpOnly` cookie, checked in the database.
- **Reuse detection** turns a stolen refresh token into a forced logout, not a silent takeover.
- **One in-flight refresh** on the client prevents false logouts from parallel requests.
- **RBAC** is a small middleware on top: 401 for who, 403 for what.

If you are hiring for [Node.js](/expertise/nodejs) or full stack roles, [get in touch](/#contact).
