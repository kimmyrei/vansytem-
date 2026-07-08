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
    const studentId = (data.studentId || "").trim();
    const month = (data.month || "").trim();
    const amount = Number(data.amount || 0);
    const datePaid = (data.datePaid || "").trim();
    const receiptName = (data.receiptName || "").trim();
    const note = (data.note || "").trim();

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Parent ID is missing. Please login again."
      });
    }

    if (!studentId || !month || !amount || !datePaid || !receiptName) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all payment details."
      });
    }

    let parentObjectId;
    let studentObjectId;

    try {
      parentObjectId = new ObjectId(parentId);
      studentObjectId = new ObjectId(studentId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent or student ID. Please refresh and try again."
      });
    }

    const { db } = await connectToDatabase();

    const parent = await db.collection("parents").findOne({ _id: parentObjectId });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found. Please login again."
      });
    }

    const student = await db.collection("students").findOne({
      _id: studentObjectId,
      parentId: parent._id.toString()
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found for this parent."
      });
    }

    const payment = {
      parentId: parent._id.toString(),
      parentName: parent.name,
      parentPhone: parent.phone,
      parentEmail: parent.email,
      studentId: student._id.toString(),
      studentName: student.name,
      month,
      amount,
      datePaid,
      receiptName,
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
      message: "Payment proof saved successfully.",
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
