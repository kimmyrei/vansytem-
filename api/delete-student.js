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
    const studentId = (data.studentId || "").trim();
    const status = (data.status || "").trim();

    const allowedStatuses = ["Pending Review", "Accepted", "Rejected", "Active"];

    if (!studentId || !status) {
      return res.status(400).json({
        success: false,
        message: "Student ID and status are required."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student status."
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

    const result = await db.collection("students").updateOne(
      { _id: studentObjectId },
      {
        $set: {
          status,
          reviewedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student record not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student status updated successfully.",
      status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update student status.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
