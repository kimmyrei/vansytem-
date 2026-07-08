const { connectToDatabase } = require("./_db");

function cleanDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch (error) {
    return "";
  }
}

function paymentStatusFrom(payments) {
  if (payments.some(payment => payment.status === "Pending")) return "Pending";
  if (payments.some(payment => payment.status === "Paid")) return "Paid";
  if (payments.some(payment => payment.status === "Rejected")) return "Rejected";
  return "Unpaid";
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

    const [parentsRaw, studentsRaw, paymentsRaw] = await Promise.all([
      db.collection("parents").find({}).sort({ createdAt: -1 }).toArray(),
      db.collection("students").find({}).sort({ createdAt: -1 }).toArray(),
      db.collection("payments").find({}).sort({ createdAt: -1 }).toArray()
    ]);

    const parents = parentsRaw.map(parent => {
      const parentId = parent._id.toString();
      const parentEmail = (parent.email || "").toLowerCase();

      const children = studentsRaw
        .filter(student => student.parentId === parentId || (student.parentEmail || "").toLowerCase() === parentEmail)
        .map(student => ({
          id: student._id.toString(),
          name: student.name || "",
          school: student.school || "",
          classYear: student.classYear || "",
          session: student.session || "",
          pickupLocation: student.pickupLocation || "",
          status: student.status || "Pending Review",
          paymentStatus: student.paymentStatus || "Unpaid"
        }));

      const payments = paymentsRaw
        .filter(payment => payment.parentId === parentId || (payment.parentEmail || "").toLowerCase() === parentEmail)
        .map(payment => ({
          id: payment._id.toString(),
          studentId: payment.studentId || "",
          studentName: payment.studentName || "",
          month: payment.month || "",
          amount: Number(payment.amount || 0),
          receiptName: payment.receiptName || "No receipt file",
          note: payment.note || "",
          status: payment.status || "Pending",
          createdAt: cleanDate(payment.createdAt)
        }));

      return {
        id: parentId,
        name: parent.name || "",
        phone: parent.phone || "",
        email: parent.email || "",
        status: parent.status || "Active",
        createdAt: cleanDate(parent.createdAt),
        childrenCount: children.length,
        paymentStatus: paymentStatusFrom(payments),
        children,
        payments
      };
    });

    const summary = {
      totalParents: parents.length,
      activeParents: parents.filter(parent => parent.status === "Active").length,
      pendingParents: parents.filter(parent => parent.status === "Pending").length,
      totalChildren: studentsRaw.length
    };

    return res.status(200).json({
      success: true,
      parents,
      summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin parents.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
