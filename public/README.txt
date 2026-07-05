MUTAHUS GLOBAL LOCALSTORAGE LINKED VERSION

This version is for Netlify testing without database.

What is connected:
1. Parent Register saves parent account.
2. Parent Login uses saved parent email/password.
3. Add Child saves child under current parent.
4. Parent Dashboard shows only that parent's children.
5. Upload Payment loads that parent's children.
6. Admin Dashboard shows totals from saved data.
7. Admin Students shows all children added by parents.
8. Admin Parents shows all registered parents.
9. Admin Payments shows all uploaded payments.
10. Admin Announcements posts announcements to parent dashboard.

Important:
- Data is stored using browser localStorage.
- It works on the same browser/device only.
- If you open on another phone/laptop, data will not appear.
- This is not a real online shared database yet.
- Later, connect Supabase/Firebase/MySQL when all pages are finalized.

Admin login:
Username: admin
Password: admin123

Netlify:
Upload all files in this folder to Netlify.
Make sure the file is named add-student.html, not add-student(1).html.

PAYMENT REPAIR UPDATE:
- Admin Payments Approve/Reject buttons repaired.
- Button now uses stable JavaScript event listener, not inline onclick only.
- When admin approves/rejects, payment status updates in localStorage.
- Parent Dashboard will show Paid / Rejected after refresh or reopening page.
- Admin Dashboard and Admin Payments totals will update from the saved payment status.


SCHOOL LIST UPDATE:
The system has been updated with the real school/service list:
- SK Bertam Perdana
- SMK Bertam Perdana
- SMK Dato Kailan
- KAFA Bertam Perdana
- KAFA Masjid Abdullah Fahim
- KAFA Paya Keladi

Updated files:
- index.html
- add-student.html
- style.css


CHILD REGISTRATION UPDATE:
- Add Child layout improved.
- Additional Notes field removed.
- Other option removed from school dropdown.
- JavaScript repaired so saving child still works without notes field.


UPDATE:
- Payment page layout redesigned.
- Front page daily route service removed.
- Front page admin area removed.
- Front page money/collection amount removed.
- Parent registration now requires email verification code before login.
- Since this version uses localStorage only, the verification code is shown in alert as demo.
- Real email sending requires backend/email service later.


UPDATE:
- Email verification / OTP flow removed.
- Parent registration returned to simple flow:
  Register -> Login -> Dashboard.
- Payment page professional layout remains.
- Front page cleanup remains.


BEAUTIFUL INTERFACE UPDATE:
- All main interfaces redesigned.
- Added professional top taskbar for public pages.
- Added modern sidebar/taskbar for parent dashboard.
- Added modern sidebar/taskbar for admin dashboard.
- Updated homepage, login, register, add child, payment, admin pages.
- Existing localStorage function remains.


FEATURE UPDATE:
1. Admin Student Approval
- Admin can Accept Student.
- Admin can Reject Student.
- Admin can Mark Active.
- Admin can Remove Student.
- New registered children start as Pending Review.

2. Parent Monthly Payment History
- Parent Dashboard now shows payment history table.
- Shows month, student, amount, status and receipt view.

3. Announcement Categories
- Added category badges:
  Delay Notice, Holiday Notice, Payment Reminder, Route Update, Emergency Notice.
- Parent dashboard and admin announcement preview show category badges.


FAQ + WHATSAPP + STATUS UPDATE:
- Added FAQ section on homepage.
- Added floating WhatsApp button on public and parent pages.
- Added student approval status guide on parent dashboard.
- WhatsApp number is currently placeholder: 60123456789
- Replace 60123456789 in the HTML files with the real Mutahus Global WhatsApp number.


MOBILE VIEW + TERMS/RULES UPDATE:
- Added Terms & Service Rules page: terms-rules.html
- Added Rules link to public navigation and dashboard sidebars.
- Added mobile menu button for public pages.
- Improved mobile sidebar/taskbar for parent/admin dashboards.
- Improved mobile table scrolling.
- Rules page includes payment, pickup time, pickup location, absence notice, safety, emergency contact, delay and student approval rules.


ADMIN MANAGE RULES UPDATE:
- Added admin-rules.html.
- Admin sidebar Rules link now goes to Manage Rules page.
- Admin can add/edit/delete rules.
- Public terms-rules.html loads rules from localStorage.
- Rules are linked: changes from admin appear on public Rules page in the same browser.
- For real shared rules across devices, database will be needed later.


ADMIN SIDEBAR UPDATE:
- Removed Main Website link from admin sidebar.
- Parent side remains unchanged.


FINAL CLEAN MOBILE VIEW UPDATE:
- Parent/admin sidebar hidden on mobile.
- Added clean fixed mobile header for parent/admin pages.
- Added bottom navigation for parent pages.
- Added horizontal bottom navigation for admin pages.
- Improved public mobile hamburger menu.
- Improved mobile spacing, cards, forms, buttons and tables.
- WhatsApp button repositioned above bottom nav.


ADMIN PARENT VIEW UPDATE:
- Fixed View button in Admin Parents.
- View now opens a parent detail modal.
- Modal shows parent info, total children, pending payments, total paid.
- Modal shows registered children list.
- Modal shows payment history and receipt view.
