# MongoDB Step 4 - Add Child

This version connects the Add Child / Register Child form to MongoDB.

Added:
- api/add-student.js

Also included:
- api/login-parent.js
- Fixed parentLogin localStorage key
- Fixed getCurrentParent() to read the logged-in MongoDB parent object

Test:
1. Upload extracted files to GitHub.
2. Wait for Vercel deploy Ready.
3. Login as parent.
4. Go to Add Child / Register Child.
5. Submit child details.
6. Check MongoDB Atlas:
   mutahus_global -> students
