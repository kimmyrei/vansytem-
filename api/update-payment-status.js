const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST only."
    });
  }

  try {
    const data = req.body || {};
    const paymentId = (data.paymentId || "").trim();
    const status = (data.status || "").trim();

    const allowedStatuses = ["Pending", "Paid", "Rejected"];

    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and status are required."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status."
      });
    }

    let paymentObjectId;

    try {
      paymentObjectId = new ObjectId(paymentId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID."
      });
    }

    const { db } = await connectToDatabase();

    const payment = await db.collection("payments").findOne({ _id: paymentObjectId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found."
      });
    }

    await db.collection("payments").updateOne(
      { _id: paymentObjectId },
      {
        $set: {
          status,
          reviewedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (payment.studentId) {
      try {
        await db.collection("students").updateOne(
          { _id: new ObjectId(payment.studentId) },
          {
            $set: {
              paymentStatus: status,
              updatedAt: new Date()
            }
          }
        );
      } catch (error) {
        await db.collection("students").updateOne(
          { parentEmail: payment.parentEmail, name: payment.studentName },
          {
            $set: {
              paymentStatus: status,
              updatedAt: new Date()
            }
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
