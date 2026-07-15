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

    const studentsRaw = await db
      .collection("students")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const students = studentsRaw.map(student => ({
      id: student._id.toString(),
      parentId: student.parentId || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      parentEmail: student.parentEmail || "",
      name: student.name || "",
      school: student.school || "",
      kafa: student.kafa || "",
      schoolDisplay: student.schoolDisplay || (student.kafa ? `${student.school || ""} + ${student.kafa}` : (student.school || "")),
      monthlyAmount: Number(student.monthlyAmount || 0),
      amountMode: student.amountMode || "Admin Set Amount (RM)",
      classYear: student.classYear || "",
      session: student.session || "",
      homeAddress: student.homeAddress || "",
      pickupLocation: student.pickupLocation || "",
      notes: student.notes || "",
      paymentStatus: student.paymentStatus || "Unpaid",
      status: student.status || "Pending Review",
      createdAt: cleanDate(student.createdAt),
      updatedAt: cleanDate(student.updatedAt),
      reviewedAt: cleanDate(student.reviewedAt)
    }));

    const summary = {
      totalStudents: students.length,
      morningCount: students.filter(student => student.session === "Morning").length,
      afternoonCount: students.filter(student => student.session === "Afternoon").length,
      totalSchools: new Set(students.map(student => student.school).filter(Boolean)).size,
      pendingReview: students.filter(student => student.status === "Pending Review").length,
      accepted: students.filter(student => student.status === "Accepted").length,
      active: students.filter(student => student.status === "Active").length,
      rejected: students.filter(student => student.status === "Rejected").length
    };

    return res.status(200).json({
      success: true,
      students,
      summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin students.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// MUTAHUS_STEP26_PAYMENT_ADMIN_AMOUNT_SCHOOL_KAFA_RECEIPT_FIX
