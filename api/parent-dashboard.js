const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("./_db");

function cleanDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch (error) {
    return "";
  }
}

function defaultAnnouncements() {
  return [
    {
      id: "DEFAULT_DELAY",
      title: "Delay Notice",
      type: "Delay Notice",
      priority: "Urgent",
      message: "The van may be late due to traffic or weather. Please check this dashboard for updates.",
      date: new Date().toLocaleDateString("en-GB"),
      status: "Active"
    },
    {
      id: "DEFAULT_PAYMENT",
      title: "Payment Reminder",
      type: "Payment Reminder",
      priority: "Important",
      message: "Please upload your monthly payment receipt before the 5th of every month.",
      date: new Date().toLocaleDateString("en-GB"),
      status: "Active"
    }
  ];
}


async function updateParentProfile(db, data, res) {
  const parentId = (data.parentId || "").trim();
  const name = (data.name || "").trim();
  const phone = (data.phone || "").trim();
  const email = (data.email || "").trim().toLowerCase();

  if (!parentId || !name || !phone || !email) {
    return res.status(400).json({
      success: false,
      message: "Please fill in name, phone and email."
    });
  }

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
      message: "Parent account not found."
    });
  }

  const existingEmail = await db.collection("parents").findOne({
    email,
    _id: { $ne: parentObjectId }
  });

  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: "This email is already used by another parent account."
    });
  }

  const oldEmail = (parent.email || "").toLowerCase();

  await db.collection("parents").updateOne(
    { _id: parentObjectId },
    {
      $set: {
        name,
        phone,
        email,
        updatedAt: new Date()
      }
    }
  );

  await db.collection("students").updateMany(
    {
      $or: [
        { parentId },
        { parentEmail: oldEmail }
      ]
    },
    {
      $set: {
        parentName: name,
        parentPhone: phone,
        parentEmail: email,
        updatedAt: new Date()
      }
    }
  );

  await db.collection("payments").updateMany(
    {
      $or: [
        { parentId },
        { parentEmail: oldEmail }
      ]
    },
    {
      $set: {
        parentName: name,
        parentPhone: phone,
        parentEmail: email,
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Parent profile updated successfully.",
    parent: {
      id: parentId,
      name,
      phone,
      email,
      status: parent.status || "Active",
      role: parent.role || "parent"
    }
  });
}

async function changeParentPassword(db, data, res) {
  const parentId = (data.parentId || "").trim();
  const oldPassword = data.oldPassword || "";
  const newPassword = data.newPassword || "";

  if (!parentId || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required."
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters."
    });
  }

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
      message: "Parent account not found."
    });
  }

  const passwordMatch = await bcrypt.compare(oldPassword, parent.passwordHash || "");

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect."
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.collection("parents").updateOne(
    { _id: parentObjectId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Parent password changed successfully."
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { db } = await connectToDatabase();
      const data = req.body || {};
      const action = (data.action || "").trim();

      if (action === "update-parent-profile") {
        return updateParentProfile(db, data, res);
      }

      if (action === "change-parent-password") {
        return changeParentPassword(db, data, res);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid parent dashboard action."
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Parent profile request failed.",
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET or POST only."
    });
  }

  try {
    const parentId = (req.query.parentId || "").trim();
    const queryEmail = (req.query.email || "").trim().toLowerCase();

    if (!parentId && !queryEmail) {
      return res.status(400).json({
        success: false,
        message: "Parent ID or email is missing. Please login again."
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

    if (!parent && queryEmail) {
      parent = await db.collection("parents").findOne({ email: queryEmail });
    }

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found. Please login again."
      });
    }

    const parentEmail = (parent.email || queryEmail || "").toLowerCase();
    const parentIdString = parent._id.toString();

    const studentsRaw = await db
      .collection("students")
      .find({
        $or: [
          { parentId: parentIdString },
          { parentEmail: parentEmail }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    const paymentsRaw = await db
      .collection("payments")
      .find({
        $or: [
          { parentId: parentIdString },
          { parentEmail: parentEmail }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    let announcementsRaw = [];

    try {
      announcementsRaw = await db
        .collection("announcements")
        .find({ status: "Active" })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
    } catch (error) {
      announcementsRaw = [];
    }

    const children = studentsRaw.map(student => ({
      id: student._id.toString(),
      parentId: student.parentId,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      name: student.name,
      school: student.school,
      classYear: student.classYear,
      session: student.session,
      homeAddress: student.homeAddress,
      pickupLocation: student.pickupLocation,
      notes: student.notes || "",
      paymentStatus: student.paymentStatus || "Unpaid",
      status: student.status || "Pending Review",
      createdAt: cleanDate(student.createdAt)
    }));

    const payments = paymentsRaw.map(payment => ({
      id: payment._id.toString(),
      parentId: payment.parentId,
      studentId: payment.studentId,
      parentName: payment.parentName,
      studentName: payment.studentName,
      month: payment.month,
      amount: Number(payment.amount || 0),
      datePaid: payment.datePaid || "",
      receiptName: payment.receiptName || "No file",
      receiptType: payment.receiptType || "",
      receiptSize: Number(payment.receiptSize || 0),
      receiptDataUrl: payment.receiptDataUrl || "",
      note: payment.note || "",
      status: payment.status || "Pending",
      createdAt: cleanDate(payment.createdAt),
      createdSort: payment.createdAt || new Date()
    }));

    const announcements =
      announcementsRaw.length > 0
        ? announcementsRaw.map(item => ({
            id: item._id.toString(),
            title: item.title,
            type: item.type || item.category || "General",
            priority: item.priority || "Normal",
            message: item.message,
            date: cleanDate(item.createdAt || item.date),
            status: item.status || "Active"
          }))
        : defaultAnnouncements();

    return res.status(200).json({
      success: true,
      parent: {
        id: parent._id.toString(),
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        status: parent.status || "Active",
        role: parent.role || "parent"
      },
      children,
      payments,
      announcements
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load parent dashboard.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// MUTAHUS_STEP19_PARENT_PROFILE_PASSWORD
