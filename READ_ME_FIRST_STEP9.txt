STEP 9 - ADMIN DASHBOARD + ADMIN PARENTS FROM MONGODB

Replace these files in GitHub:
- app.js
- public/app.js
- api/admin-dashboard.js
- api/admin-parents.js

After upload:
1. Commit changes.
2. Wait Vercel deployment until Ready.
3. Test:
   https://vansytem-sec.vercel.app/api/admin-dashboard

Correct result:
{
  "success": true,
  "summary": {...},
  "recentPayments": [...]
}

4. Test:
   https://vansytem-sec.vercel.app/api/admin-parents

Correct result:
{
  "success": true,
  "parents": [...],
  "summary": {...}
}

Then:
- Admin Dashboard reads real MongoDB counts.
- Admin Parents page reads real MongoDB parents, children, and payment status.
- View button shows parent details from MongoDB.
