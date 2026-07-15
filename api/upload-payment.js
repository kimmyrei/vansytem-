const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("./_db");


function getMalaysiaTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === "year").value;
  const month = parts.find(part => part.type === "month").value;
  const day = parts.find(part => part.type === "day").value;

  return `${year}-${month}-${day}`;
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

    const parentId = (data.parentId || "").trim();
    const parentEmailFromClient = (data.parentEmail || "").trim().toLowerCase();
    const studentId = (data.studentId || "").trim();
    const paymentMode = (data.paymentMode || "one").trim();
    const studentIdsFromClient = Array.isArray(data.studentIds)
      ? data.studentIds.map(id => String(id || "").trim()).filter(Boolean)
      : [];
    const month = (data.month || "").trim();
    const clientAmountSubmitted = Number(data.amount || 0);
    const datePaid = getMalaysiaTodayDate();
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

    if ((!studentId && studentIdsFromClient.length === 0) || !month || !receiptName || !receiptDataUrl) {
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

    const targetStudentIds = paymentMode === "all" ? studentIdsFromClient : [studentId];

    if (targetStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please choose at least one student."
      });
    }

    let studentObjectIds;

    try {
      studentObjectIds = targetStudentIds.map(id => new ObjectId(id));
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

    const students = await db.collection("students").find({
      _id: { $in: studentObjectIds },
      $or: [
        { parentId: parentIdString },
        { parentEmail: parentEmail }
      ]
    }).toArray();

    if (students.length !== targetStudentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more student records were not found for this parent."
      });
    }

    const studentsWithoutAmount = students.filter(student => !Number(student.monthlyAmount || 0));

    if (studentsWithoutAmount.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Admin has not set the payment amount for one or more selected students yet. Please contact admin."
      });
    }

    const batchId = paymentMode === "all"
      ? `PAYALL_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : "";

    const paymentDocs = students.map(student => {
      const amount = Number(student.monthlyAmount || 0);

      return {
        parentId: parentIdString,
        parentName: parent.name,
        parentPhone: parent.phone,
        parentEmail: parent.email,
        studentId: student._id.toString(),
        studentName: student.name,
        school: student.school || "",
        kafa: student.kafa || "",
        kafaSession: student.kafaSession || "",
        paymentMode: paymentMode === "all" ? "All Children" : "Single Child",
        batchId,
        month,
        amount,
        amountMode: "Admin Set Amount (RM)",
        clientAmountSubmitted,
        datePaid,
        dateSource: "Auto server date - Asia/Kuala_Lumpur",
        receiptName,
        receiptType,
        receiptSize,
        receiptDataUrl,
        note,
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const result = await db.collection("payments").insertMany(paymentDocs);

    await db.collection("students").updateMany(
      { _id: { $in: studentObjectIds } },
      {
        $set: {
          paymentStatus: "Pending",
          updatedAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: paymentMode === "all"
        ? "Payment proof saved for all selected children."
        : "Payment proof and receipt image saved successfully.",
      paymentMode,
      paymentCount: paymentDocs.length,
      paymentIds: Object.values(result.insertedIds || {}).map(id => id.toString()),
      batchId
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

// MUTAHUS_FIX_PAYMENT_DATE_TODAY_ONLY

// MUTAHUS_STEP26_PAYMENT_ADMIN_AMOUNT_SCHOOL_KAFA_RECEIPT_FIX

// MUTAHUS_STEP29_PAYMENT_PAY_ALL_OR_ONE_CHILD

// MUTAHUS_STEP30_USER_COMPLAINT_FIXES
