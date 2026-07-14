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

    const parentId = (data.parentId || "").trim();
    const parentEmailFromClient = (data.parentEmail || "").trim().toLowerCase();
    const studentId = (data.studentId || "").trim();
    const month = (data.month || "").trim();
    const amount = Number(data.amount || 0);
    const datePaid = (data.datePaid || "").trim();
    const receiptName = (data.receiptName || "").trim();
    const receiptType = (data.receiptType || "").trim();
    const receiptSize = Number(data.receiptSize || 0);
    const receiptDataUrl = (data.receiptDataUrl || "").trim();
    const note = (data.note || "").trim();

    if (!parentId && !parentEmailFromClient) {
      return res.status(400).json({
        success: false,
        message: "Parent ID is missing. Please login again."
      });
    }

    if (!studentId || !month || !amount || !datePaid || !receiptName || !receiptDataUrl) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all payment details and upload receipt."
      });
    }

    if (!receiptDataUrl.startsWith("data:image/") && !receiptDataUrl.startsWith("data:application/pdf")) {
      return res.status(400).json({
        success: false,
        message: "Only receipt image or PDF files are supported."
      });
    }

    if (receiptSize > 1.5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Receipt file is too large. Please upload a file below 1.5MB."
      });
    }

    let studentObjectId;

    try {
      studentObjectId = new ObjectId(studentId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID. Please refresh and try again."
      });
    }

    const { db } = await connectToDatabase();

    let parent = null;

    if (parentId) {
      try {
        parent = await db.collection("parents").findOne({ _id: new ObjectId(parentId) });
      } catch (error) {
        parent = null;
      }
    }

    if (!parent && parentEmailFromClient) {
      parent = await db.collection("parents").findOne({ email: parentEmailFromClient });
    }

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found. Please login again."
      });
    }

    const parentIdString = parent._id.toString();
    const parentEmail = (parent.email || parentEmailFromClient || "").toLowerCase();

    const student = await db.collection("students").findOne({
      _id: studentObjectId,
      $or: [
        { parentId: parentIdString },
        { parentEmail: parentEmail }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found for this parent."
      });
    }

    const payment = {
      parentId: parentIdString,
      parentName: parent.name,
      parentPhone: parent.phone,
      parentEmail: parent.email,
      studentId: student._id.toString(),
      studentName: student.name,
      month,
      amount,
      datePaid,
      receiptName,
      receiptType,
      receiptSize,
      receiptDataUrl,
      note,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("payments").insertOne(payment);

    await db.collection("students").updateOne(
      { _id: student._id },
      {
        $set: {
          paymentStatus: "Pending",
          updatedAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Payment proof and receipt image saved successfully.",
      paymentId: result.insertedId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload payment proof.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
