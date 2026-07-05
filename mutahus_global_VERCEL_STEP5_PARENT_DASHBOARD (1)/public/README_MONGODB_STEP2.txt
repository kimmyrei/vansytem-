MUTAHUS GLOBAL - MONGODB STEP 2 PARENT REGISTER

This version connects Parent Registration to MongoDB.

ADDED:
- netlify/functions/register-parent.js

UPDATED:
- app.js registerParent(event)

FLOW:
parent-register.html form
-> app.js registerParent()
-> /.netlify/functions/register-parent
-> MongoDB collection: parents

IMPORTANT:
- Login is not connected to MongoDB yet.
- After registering, parent data will appear in MongoDB Atlas under:
  Database: mutahus_global
  Collection: parents

TEST:
1. Deploy using Netlify.
2. Open parent-register.html.
3. Register a new parent.
4. Check MongoDB Atlas > Browse Collections > mutahus_global > parents.

NEXT STEP:
Step 3 - Parent Login API.
