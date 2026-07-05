# MongoDB Step 3 - Parent Login

This version connects Parent Login to MongoDB.

## Added

```text
api/login-parent.js
```

## Updated

```text
public/app.js
```

## Flow

```text
Parent Login Form
→ app.js parentLogin()
→ /api/login-parent
→ MongoDB parents collection
→ localStorage current parent session
→ parent-dashboard.html
```

## Test

1. Upload this version to GitHub.
2. Vercel auto deploys.
3. Open:

```text
https://YOUR-SITE.vercel.app/parent-login.html
```

4. Login using the same email/password used in registration.

## Current Database Progress

Done:
- MongoDB connection
- Parent register
- Parent login

Next:
- Add child into MongoDB
- Parent dashboard read from MongoDB
