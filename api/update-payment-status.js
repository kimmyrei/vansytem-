const { ObjectId } = require("mongodb");
const webpush = require("web-push");
const { connectToDatabase } = require("./_db");

function setupPaymentWebPush() {
  const publicKey = String(
    process.env.VAPID_PUBLIC_KEY || ""
  ).trim();

  const privateKey = String(
    process.env.VAPID_PRIVATE_KEY || ""
  ).trim();

  let email = String(
    process.env.VAPID_EMAIL ||
    "mailto:admin@muthaqusglobal.com"
  ).trim();

  if (email && !email.startsWith("mailto:")) {
    email = `mailto:${email}`;
  }

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(
    email,
    publicKey,
    privateKey
  );

  return true;
}

async function sendPaymentStatusPush(
  db,
  payment,
  status
) {
  if (!setupPaymentWebPush()) {
    return {
      configured: false,
      sent: 0,
      failed: 0
    };
  }

  const parentId = String(
    payment.parentId || ""
  ).trim();

  const parentEmail = String(
    payment.parentEmail || ""
  )
    .trim()
    .toLowerCase();

  const conditions = [];

  if (parentId) {
    conditions.push({
      parentId
    });
  }

  if (parentEmail) {
    conditions.push({
      parentEmail
    });
  }

  if (conditions.length === 0) {
    return {
      configured: true,
      sent: 0,
      failed: 0
    };
  }

  const subscriptions =
    await db
      .collection("push_subscriptions")
      .find({
        enabled: true,
        $or: conditions
      })
      .toArray();

  const copy = {
    Paid: {
      title: "Payment Approved",
      body:
        `Your payment for ${payment.month || "the selected month"} has been approved.`,
      url:
        "/parent-dashboard.html#paymentHistorySection"
    },
    Rejected: {
      title: "Payment Receipt Rejected",
      body:
        `Please upload a new receipt for ${payment.month || "the selected month"}.`,
      url:
        "/upload-payment.html"
    },
    Pending: {
      title: "Payment Under Review",
      body:
        `Your payment for ${payment.month || "the selected month"} is under review again.`,
      url:
        "/parent-dashboard.html#paymentHistorySection"
    }
  }[status];

  const payload = JSON.stringify({
    type:
      "Payment Status",
    title:
      copy.title,
    body:
      copy.body,
    url:
      copy.url,
    icon:
      "/icons/muthaqus-icon-192.png",
    badge:
      "/icons/muthaqus-icon-64.png",
    tag:
      `payment-${payment._id.toString()}-${status.toLowerCase()}`
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async item => {
      try {
        await webpush.sendNotification(
          item.subscription,
          payload
        );

        sent += 1;
      } catch (error) {
        failed += 1;

        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          await db
            .collection("push_subscriptions")
            .updateOne(
              { _id: item._id },
              {
                $set: {
                  enabled: false,
                  lastError:
                    error.message,
                  updatedAt:
                    new Date()
                }
              }
            );
        }
      }
    })
  );

  return {
    configured: true,
    sent,
    failed
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message:
        "Method not allowed. Use POST only."
    });
  }

  try {
    const data = req.body || {};
    const paymentId = String(
      data.paymentId || ""
    ).trim();

    const status = String(
      data.status || ""
    ).trim();

    const allowedStatuses = [
      "Pending",
      "Paid",
      "Rejected"
    ];

    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID and status are required."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status."
      });
    }

    if (!ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment ID."
      });
    }

    const { db } =
      await connectToDatabase();

    const paymentObjectId =
      new ObjectId(paymentId);

    const payment =
      await db
        .collection("payments")
        .findOne({
          _id: paymentObjectId
        });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found."
      });
    }

    await db
      .collection("payments")
      .updateOne(
        {
          _id: paymentObjectId
        },
        {
          $set: {
            status,
            reviewedAt:
              new Date(),
            updatedAt:
              new Date()
          }
        }
      );

    if (payment.studentId) {
      try {
        await db
          .collection("students")
          .updateOne(
            {
              _id:
                new ObjectId(
                  payment.studentId
                )
            },
            {
              $set: {
                paymentStatus:
                  status,
                updatedAt:
                  new Date()
              }
            }
          );
      } catch (error) {
        await db
          .collection("students")
          .updateOne(
            {
              parentEmail:
                payment.parentEmail,
              name:
                payment.studentName
            },
            {
              $set: {
                paymentStatus:
                  status,
                updatedAt:
                  new Date()
              }
            }
          );
      }
    }

    const pushNotification =
      await sendPaymentStatusPush(
        db,
        payment,
        status
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully.",
      status,
      pushNotification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to update payment status.",
      error: {
        name:
          error.name,
        message:
          error.message
      }
    });
  }
};

// MUTHAQUS_STEP109_110_UPDATE_PUSH_NOTIFICATIONS
