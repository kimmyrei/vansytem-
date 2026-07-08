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

    const [parents, students, payments] = await Promise.all([
      db.collection("parents").find({}).toArray(),
      db.collection("students").find({}).toArray(),
      db.collection("payments").find({}).sort({ createdAt: -1 }).toArray()
    ]);

    const paidPayments = payments.filter(payment => payment.status === "Paid");

    const summary = {
      totalParents: parents.length,
      totalStudents: students.length,
      morningCount: students.filter(student => student.session === "Morning").length,
      afternoonCount: students.filter(student => student.session === "Afternoon").length,
      pendingPayments: payments.filter(payment => payment.status === "Pending").length,
      totalPaidMonth: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    };

    const recentPayments = payments.slice(0, 5).map(payment => ({
      id: payment._id.toString(),
      parentName: payment.parentName || "",
      parentPhone: payment.parentPhone || "",
      parentEmail: payment.parentEmail || "",
      studentName: payment.studentName || "",
      month: payment.month || "",
      amount: Number(payment.amount || 0),
      status: payment.status || "Pending",
      createdAt: cleanDate(payment.createdAt)
    }));

    return res.status(200).json({
      success: true,
      summary,
      recentPayments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
