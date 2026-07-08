const { connectToDatabase } = require("./_db");

function cleanDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch (error) {
    return "";
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET only."
    });
  }

  try {
    const { db } = await connectToDatabase();

    const paymentsRaw = await db
      .collection("payments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const studentsRaw = await db
      .collection("students")
      .find({})
      .toArray();

    const payments = paymentsRaw.map(payment => ({
      id: payment._id.toString(),
      parentId: payment.parentId || "",
      parentName: payment.parentName || "",
      parentPhone: payment.parentPhone || "",
      parentEmail: payment.parentEmail || "",
      studentId: payment.studentId || "",
      studentName: payment.studentName || "",
      month: payment.month || "",
      amount: Number(payment.amount || 0),
      datePaid: payment.datePaid || "",
      receiptName: payment.receiptName || "No receipt file",
      note: payment.note || "",
      status: payment.status || "Pending",
      createdAt: cleanDate(payment.createdAt),
      updatedAt: cleanDate(payment.updatedAt),
      reviewedAt: cleanDate(payment.reviewedAt)
    }));

    const paidPayments = payments.filter(payment => payment.status === "Paid");
    const pendingPayments = payments.filter(payment => payment.status === "Pending");
    const paidStudentIds = new Set(paidPayments.map(payment => payment.studentId));
    const unpaidStudents = studentsRaw.filter(student => !paidStudentIds.has(student._id.toString()));

    const summary = {
      totalCollection: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      unpaidCount: unpaidStudents.length
    };

    return res.status(200).json({
      success: true,
      payments,
      summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin payments.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
