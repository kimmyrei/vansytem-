STEP 8 - ADMIN APPROVE PAYMENTS FROM MONGODB

Replace these files in GitHub:
- app.js
- public/app.js
- api/admin-payments.js
- api/update-payment-status.js

After upload:
1. Commit changes.
2. Wait Vercel deployment until Ready.
3. Test:
   https://vansytem-sec.vercel.app/api/admin-payments

Correct result:
{
  "success": true,
  "payments": [...]
}

Also test:
https://vansytem-sec.vercel.app/api/update-payment-status

Correct result:
{
  "success": false,
  "message": "Method not allowed. Use POST only."
}

Then:
1. Login admin.
2. Open Admin Payments page.
3. Click Approve/Reject.
4. MongoDB payments status changes.
5. MongoDB students paymentStatus changes.
6. Parent dashboard should reflect payment status after refresh.

Note:
This step approves the payment record. It still only stores receipt file name, not the actual uploaded file.
