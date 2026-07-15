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

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Parent ID is missing. Please login again."
      });
    }

    const name = (data.name || "").trim();
    const school = (data.school || "").trim();
    const kafa = (data.kafa || "").trim();
    const kafaSession = (data.kafaSession || "").trim();
    const classYear = (data.classYear || "").trim();
    const session = (data.session || "").trim();
    const homeAddress = (data.homeAddress || "").trim();
    const pickupLocation = (data.pickupLocation || "Not applicable").trim();

    if (!name || !school || !classYear || !session || !homeAddress) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all child details."
      });
    }

    const { db } = await connectToDatabase();

    let parentObjectId;
    try {
      parentObjectId = new ObjectId(parentId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID. Please login again."
      });
    }

    const parent = await db.collection("parents").findOne({ _id: parentObjectId });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found. Please login again."
      });
    }

    const child = {
      parentId: parent._id.toString(),
      parentName: parent.name,
      parentPhone: parent.phone,
      parentEmail: parent.email,
      name,
      school,
      kafa,
      kafaSession,
      schoolDisplay: kafa ? `${school} + ${kafa}` : school,
      classYear,
      session,
      homeAddress,
      pickupLocation,
      notes: (data.notes || "").trim(),
      monthlyAmount: 0,
      amountMode: "Admin Set Amount (RM)",
      paymentStatus: "Unpaid",
      status: "Pending Review",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("students").insertOne(child);

    return res.status(200).json({
      success: true,
      message: "Child details saved successfully.",
      studentId: result.insertedId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save child details.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// MUTAHUS_STEP26_PAYMENT_ADMIN_AMOUNT_SCHOOL_KAFA_RECEIPT_FIX

// MUTAHUS_STEP30_USER_COMPLAINT_FIXES
