MONGODB TIMEOUT FIX VERSION

This version updates:
- netlify/functions/db.js
- netlify/functions/test-db.js

It sets MongoDB timeout to 5 seconds so the function returns a clear JSON error instead of crashing after 30 seconds.

IMPORTANT CHECKS:
1. MongoDB Atlas > Network Access
   Add IP Address:
   0.0.0.0/0
   This allows Netlify Functions to connect.

2. Netlify > Environment variables
   MONGODB_URI must be exact.
   It must look like:
   mongodb+srv://username:password@cluster.mongodb.net/mutahus_global?appName=vansystem

3. Cluster URL must be copied exactly from MongoDB Atlas.
   Do not type it manually.

After deploy:
Open:
https://mutaqhus.netlify.app/.netlify/functions/test-db

If it fails, it will show the real JSON error.
