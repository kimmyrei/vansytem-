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

    const result = await db.collection("students").deleteOne({ _id: studentObjectId });

    await db.collection("payments").deleteMany({ studentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student record not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student removed successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove student.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
