# 🧠 Provider-Agnostic Auth (Strategy Pattern) — Simple Guide

## 🚀 What are we building?

We are building an authentication system that can support **multiple login providers** like:

- Microsoft
- Slack
- (future) Google, GitHub, etc.

👉 But instead of writing separate logic everywhere, we use a **clean, scalable design**.

---

## 🔑 What does "Provider-Agnostic" mean?

> The system does NOT care which provider is used.

We just say:

```txt
login(provider)
```

And it works for:

- `"microsoft"`
- `"slack"`
- `"google"` (future)

---

## 🧩 What is Strategy Pattern?

> “Same interface, different implementations, chosen at runtime”

### In our case:

All providers follow the same structure:

```js
login(req, res);
callback(req);
```

But internally:

| Provider  | Logic           |
| --------- | --------------- |
| Microsoft | Microsoft OAuth |
| Slack     | Slack OAuth     |

👉 Each provider = a **strategy**

---

## 🏗️ Architecture Overview

```txt
Frontend (React)
   ↓
/auth/:provider
   ↓
Routes (Express)
   ↓
AuthService (common logic)
   ↓
Strategy Factory (decides provider)
   ↓
Strategy (Slack / Microsoft)
```

---

## 📦 Folder Structure

```txt
auth/
  strategies/
    slackStrategy.js
    microsoftStrategy.js
  strategyFactory.js
  authService.js

routes/
  authRoutes.js
```

---

## 🔄 Flow (Step-by-Step)

### 1. User clicks login

```txt
Frontend → /auth/microsoft
```

---

### 2. Backend route

```js
authService.login(provider);
```

---

### 3. Strategy Factory

```js
getStrategy("microsoft")
→ returns MicrosoftStrategy
```

---

### 4. Strategy handles login

```txt
Redirect to Microsoft login
```

---

### 5. Provider redirects back

```txt
/auth/microsoft/callback
```

---

### 6. Strategy handles callback

```txt
Exchange code → token → fetch user
```

---

### 7. AuthService (common logic)

```txt
Store session
Return user
```

---

### 8. Frontend fetches user

```txt
GET /me
```

---

## 🧠 Key Components Explained

### 1. Strategy (Provider Logic)

Each file handles ONLY its provider:

```txt
slackStrategy.js
microsoftStrategy.js
```

---

### 2. Strategy Factory

```js
getStrategy(provider);
```

👉 Returns correct strategy

---

### 3. AuthService (Core Layer)

Handles:

- calling strategy
- storing session
- shared logic

---

### 4. Routes

Very simple:

```txt
/auth/:provider
/auth/:provider/callback
```

---

## 🔥 Why we use this?

### ❌ Without this (bad)

```js
if (provider === "slack") { ... }
if (provider === "microsoft") { ... }
```

Problems:

- messy code
- hard to scale
- duplication

---

### ✅ With this (good)

```js
const strategy = getStrategy(provider);
strategy.login();
```

Benefits:

- clean code
- easy to add new providers
- scalable

---

## ➕ Adding new provider (Google)

Just:

1. Create:

```txt
googleStrategy.js
```

2. Add in factory:

```js
google: new GoogleStrategy();
```

👉 DONE. No other changes.

---

## 🧠 Important Rules

- Strategy = provider-specific logic only
- AuthService = shared logic
- Routes = no business logic
- Use consistent provider names (`microsoft`, not `outlook`)

---

## 🔐 Session Behavior

- User stays logged in because session is stored on backend
- Browser stores only a cookie
- Logout destroys session

---

## 🚪 Logout

```js
req.session.destroy();
res.clearCookie("connect.sid");
```

---

## 🧠 One-line Summary

> Provider-agnostic auth = one system that supports multiple login providers using interchangeable strategies.

---

## 🚀 What you achieved

- Multi-provider login (Slack + Microsoft)
- Clean architecture
- Scalable system
- Production-ready pattern

---

## 💡 Next Steps (future)

- Store users in DB
- Link multiple providers to same user
- Use tokens to:
  - send Slack messages
  - send Outlook emails

---

## 🏁 Final Thought

> You are no longer building “login with X”
> You are building a **universal authentication platform**

---
