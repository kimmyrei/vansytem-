const { ObjectId } = require("mongodb");
const { connectToDatabase } = require("./_db");

function cleanDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch (error) {
    return "";
  }
}

function paymentStatusFromPayments(payments) {
  if (!payments || payments.length === 0) return "Unpaid";
  if (payments.some(payment => payment.status === "Pending")) return "Pending";
  if (payments.some(payment => payment.status === "Paid")) return "Paid";
  if (payments.some(payment => payment.status === "Rejected")) return "Rejected";
  return "Unpaid";
}

async function getParents(db, res) {
  const parentsRaw = await db
    .collection("parents")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const studentsRaw = await db.collection("students").find({}).toArray();
  const paymentsRaw = await db.collection("payments").find({}).sort({ createdAt: -1 }).toArray();

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
        receiptType: payment.receiptType || "",
        receiptSize: Number(payment.receiptSize || 0),
        receiptDataUrl: payment.receiptDataUrl || "",
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
      paymentStatus: paymentStatusFromPayments(payments),
      children,
      payments
    };
  });

  const summary = {
    totalParents: parents.length,
    activeParents: parents.filter(parent => parent.status === "Active").length,
    pendingParents: parents.filter(parent => parent.status === "Pending").length,
    rejectedParents: parents.filter(parent => parent.status === "Rejected").length,
    totalChildren: parents.reduce((sum, parent) => sum + Number(parent.childrenCount || 0), 0)
  };

  return res.status(200).json({
    success: true,
    parents,
    summary
  });
}

async function updateParentStatus(db, data, res) {
  const parentId = (data.parentId || "").trim();
  const status = (data.status || "").trim();

  if (!parentId || !status) {
    return res.status(400).json({
      success: false,
      message: "Parent ID and status are required."
    });
  }

  const allowedStatuses = ["Active", "Pending", "Rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid parent status."
    });
  }

  let parentObjectId;

  try {
    parentObjectId = new ObjectId(parentId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid parent ID."
    });
  }

  const result = await db.collection("parents").updateOne(
    { _id: parentObjectId },
    {
      $set: {
        status,
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Parent record not found."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Parent status updated successfully."
  });
}

async function deleteParent(db, data, res) {
  const parentId = (data.parentId || "").trim();

  if (!parentId) {
    return res.status(400).json({
      success: false,
      message: "Parent ID is required."
    });
  }

  let parentObjectId;

  try {
    parentObjectId = new ObjectId(parentId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid parent ID."
    });
  }

  const parent = await db.collection("parents").findOne({ _id: parentObjectId });

  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent record not found."
    });
  }

  const parentEmail = (parent.email || "").toLowerCase();

  const students = await db
    .collection("students")
    .find({
      $or: [
        { parentId },
        { parentEmail }
      ]
    })
    .toArray();

  const studentIds = students.map(student => student._id.toString());

  await db.collection("payments").deleteMany({
    $or: [
      { parentId },
      { parentEmail },
      { studentId: { $in: studentIds } }
    ]
  });

  await db.collection("students").deleteMany({
    $or: [
      { parentId },
      { parentEmail }
    ]
  });

  await db.collection("parents").deleteOne({ _id: parentObjectId });

  return res.status(200).json({
    success: true,
    message: "Parent, children and payment records deleted successfully."
  });
}

module.exports = async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      return getParents(db, res);
    }

    if (req.method === "POST") {
      const data = req.body || {};
      const action = (data.action || "").trim();

      if (action === "update-parent-status") {
        return updateParentStatus(db, data, res);
      }

      if (action === "delete-parent") {
        return deleteParent(db, data, res);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid admin parents action."
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET or POST only."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin parents request failed.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
