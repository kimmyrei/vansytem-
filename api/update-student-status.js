const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("./_db");

function isValidServiceStartMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST only."
    });
  }

  try {
    const data = req.body || {};
    const action = (data.action || "update-status").trim();
    const studentId = (data.studentId || "").trim();

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required."
      });
    }

    let studentObjectId;

    try {
      studentObjectId = new ObjectId(studentId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const { db } = await connectToDatabase();

    const student = await db
      .collection("students")
      .findOne({ _id: studentObjectId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found."
      });
    }

    if (action === "remove-student") {
      await db
        .collection("students")
        .deleteOne({ _id: studentObjectId });

      await db
        .collection("payments")
        .deleteMany({ studentId });

      return res.status(200).json({
        success: true,
        message:
          "Student and related payment records removed successfully."
      });
    }

    if (action === "update-amount") {
      const monthlyAmount = Number(data.monthlyAmount || 0);

      if (!monthlyAmount || monthlyAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid payment amount in RM."
        });
      }

      await db.collection("students").updateOne(
        { _id: studentObjectId },
        {
          $set: {
            monthlyAmount,
            amountMode: "Admin Set Amount (RM)",
            updatedAt: new Date()
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: "Student payment amount updated successfully."
      });
    }

    if (action === "update-service-start") {
      const serviceStartMonth = String(
        data.serviceStartMonth || ""
      ).trim();

      if (!isValidServiceStartMonth(serviceStartMonth)) {
        return res.status(400).json({
          success: false,
          message:
            "Please choose a valid service start month."
        });
      }

      await db.collection("students").updateOne(
        { _id: studentObjectId },
        {
          $set: {
            serviceStartMonth,
            updatedAt: new Date()
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: "Service start month updated successfully."
      });
    }

    const status = (data.status || "").trim();
    const allowedStatuses = [
      "Pending Review",
      "Accepted",
      "Rejected",
      "Active"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student status."
      });
    }

    await db.collection("students").updateOne(
      { _id: studentObjectId },
      {
        $set: {
          status,
          reviewedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Student status updated successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update student record.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// MUTHAQUS_STEP78_SERVICE_START_MONTH_ARREARS_FIX
