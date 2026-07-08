STEP 7 - ADMIN APPROVE STUDENTS FROM MONGODB

Replace these files in GitHub:
- app.js
- public/app.js
- api/admin-students.js
- api/update-student-status.js
- api/delete-student.js

Keep your existing files.

After upload:
1. Commit changes.
2. Wait Vercel deployment until Ready.
3. Test:
   https://vansytem-sec.vercel.app/api/admin-students

Correct result:
{
  "success": true,
  "students": [...]
}

Also test:
https://vansytem-sec.vercel.app/api/update-student-status

Correct result:
{
  "success": false,
  "message": "Method not allowed. Use POST only."
}

Then:
1. Login admin.
2. Open Admin Students.
3. Click Accept or Mark Active for the student.
4. Check MongoDB students collection. Status should change.
5. Parent dashboard should show updated status after refresh.
