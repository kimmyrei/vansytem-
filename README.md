# Mutahus Global - Vercel Ready Version

This version is for:

```text
GitHub → Vercel → MongoDB Atlas
```

It does not use Netlify.

## What Works Now

- MongoDB connection test
- Parent registration saves to MongoDB

## Important

GitHub Pages only hosts static files. It cannot run MongoDB backend code.
This project needs Vercel API Routes for MongoDB.

## Files Added for Vercel

```text
api/_db.js
api/test-db.js
api/register-parent.js
vercel.json
package.json
.env.example
```

## Environment Variable Required

In Vercel project settings, add:

```text
MONGODB_URI
```

Value format:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/mutahus_global?appName=vansystem
```

Do not upload your real `.env` file to GitHub.

## Deploy Steps

1. Upload this folder to GitHub.
2. Go to Vercel.
3. Add New Project.
4. Import your GitHub repository.
5. Deploy.
6. Go to Project Settings → Environment Variables.
7. Add `MONGODB_URI`.
8. Redeploy.

## Test MongoDB

Open:

```text
https://YOUR-VERCEL-SITE.vercel.app/api/test-db
```

or:

```text
https://YOUR-VERCEL-SITE.vercel.app/mongodb-test.html
```

## Test Parent Register

Open:

```text
https://YOUR-VERCEL-SITE.vercel.app/parent-register.html
```

Register a parent, then check MongoDB Atlas:

```text
mutahus_global → parents
```

## Still Not Done Yet

- Parent Login with MongoDB
- Add Child with MongoDB
- Payment with MongoDB
- Admin data from MongoDB
