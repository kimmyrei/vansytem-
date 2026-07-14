FIX ADMIN ANNOUNCEMENTS PAGE SHOWING CODE

Your API is working because the console POST saved into MongoDB.
The problem is only the page file.

Replace these files in GitHub:
1. admin-announcements.html
2. public/admin-announcements.html

Do NOT paste app.js into these files.
These files must start with:
<!DOCTYPE html>

After replacing:
1. Commit changes.
2. Wait Vercel Ready.
3. Open:
   https://vansytem-sec.vercel.app/admin-announcements.html

It should show the normal Admin Announcements page, not code.
