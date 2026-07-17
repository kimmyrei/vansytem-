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

  await db.collection("absences").updateMany(
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


function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

async function resetParentPassword(db, data, res) {
  const email = (data.email || "").trim().toLowerCase();
  const phone = normalizePhone(data.phone);
  const newPassword = data.newPassword || "";

  if (!email || !phone || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please enter registered email, phone number and new password."
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters."
    });
  }

  const parent = await db.collection("parents").findOne({ email });

  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent account not found."
    });
  }

  const savedPhone = normalizePhone(parent.phone);

  if (!savedPhone || savedPhone !== phone) {
    return res.status(401).json({
      success: false,
      message: "Phone number does not match this parent account."
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.collection("parents").updateOne(
    { _id: parent._id },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Password reset successfully."
  });
}



function malaysiaTodayValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const values = {};

  parts.forEach(part => {
    if (part.type !== "literal") values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function formatAbsence(item) {
  return {
    id: item._id.toString(),
    parentId: item.parentId || "",
    parentName: item.parentName || "",
    parentPhone: item.parentPhone || "",
    parentEmail: item.parentEmail || "",
    studentId: item.studentId || "",
    studentName: item.studentName || "",
    school: item.school || "",
    session: item.session || "",
    date: item.date || "",
    trip: item.trip || "Both trips",
    reason: item.reason || "",
    note: item.note || "",
    status: item.status || "Submitted",
    createdAt: cleanDate(item.createdAt),
    updatedAt: cleanDate(item.updatedAt),
    acknowledgedAt: cleanDate(item.acknowledgedAt),
    cancelledAt: cleanDate(item.cancelledAt)
  };
}

async function findParentForRequest(db, parentId, email) {
  let parent = null;

  if (parentId) {
    try {
      parent = await db.collection("parents").findOne({
        _id: new ObjectId(parentId)
      });
    } catch (error) {
      parent = null;
    }
  }

  if (!parent && email) {
    parent = await db.collection("parents").findOne({
      email: String(email).trim().toLowerCase()
    });
  }

  return parent;
}

async function reportAbsence(db, data, res) {
  const parentId = String(data.parentId || "").trim();
  const parentEmail = String(data.parentEmail || "").trim().toLowerCase();
  const studentId = String(data.studentId || "").trim();
  const date = String(data.date || "").trim();
  const trip = String(data.trip || "").trim();
  const reason = String(data.reason || "").trim();
  const note = String(data.note || "").trim().slice(0, 300);

  const allowedTrips = [
    "Both trips",
    "Morning pickup only",
    "Afternoon return only",
    "KAFA trip only"
  ];

  const allowedReasons = [
    "Sick",
    "School holiday or event",
    "Family matter",
    "Different transport arrangement",
    "Other"
  ];

  if (!parentId && !parentEmail) {
    return res.status(400).json({
      success: false,
      message: "Parent account is missing. Please login again."
    });
  }

  if (!studentId || !date || !trip || !reason) {
    return res.status(400).json({
      success: false,
      message: "Child, date, affected trip and reason are required."
    });
  }

  if (!isValidDateValue(date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid absence date."
    });
  }

  if (date < malaysiaTodayValue()) {
    return res.status(400).json({
      success: false,
      message: "Past dates cannot be submitted as a new absence notice."
    });
  }

  if (!allowedTrips.includes(trip) || !allowedReasons.includes(reason)) {
    return res.status(400).json({
      success: false,
      message: "Invalid absence trip or reason."
    });
  }

  const parent = await findParentForRequest(db, parentId, parentEmail);

  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent account not found. Please login again."
    });
  }

  let studentObjectId;

  try {
    studentObjectId = new ObjectId(studentId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid child record."
    });
  }

  const parentIdString = parent._id.toString();
  const email = String(parent.email || parentEmail).toLowerCase();

  const student = await db.collection("students").findOne({
    _id: studentObjectId,
    $or: [
      { parentId: parentIdString },
      { parentEmail: email }
    ]
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "This child was not found under your parent account."
    });
  }

  const duplicate = await db.collection("absences").findOne({
    studentId,
    date,
    status: { $ne: "Cancelled" }
  });

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "An active absence notice already exists for this child on the selected date."
    });
  }

  const now = new Date();

  const result = await db.collection("absences").insertOne({
    parentId: parentIdString,
    parentName: parent.name || "",
    parentPhone: parent.phone || "",
    parentEmail: email,
    studentId,
    studentName: student.name || "",
    school: student.schoolDisplay || student.school || "",
    session: student.session || "",
    date,
    trip,
    reason,
    note,
    status: "Submitted",
    createdAt: now,
    updatedAt: now
  });

  return res.status(200).json({
    success: true,
    message: "Absence notice submitted successfully.",
    absenceId: result.insertedId.toString()
  });
}

async function cancelAbsence(db, data, res) {
  const absenceId = String(data.absenceId || "").trim();
  const parentId = String(data.parentId || "").trim();
  const parentEmail = String(data.parentEmail || "").trim().toLowerCase();

  if (!absenceId || (!parentId && !parentEmail)) {
    return res.status(400).json({
      success: false,
      message: "Absence notice and parent account are required."
    });
  }

  let absenceObjectId;

  try {
    absenceObjectId = new ObjectId(absenceId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid absence notice ID."
    });
  }

  const parent = await findParentForRequest(db, parentId, parentEmail);

  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent account not found."
    });
  }

  const parentIdString = parent._id.toString();
  const email = String(parent.email || parentEmail).toLowerCase();

  const absence = await db.collection("absences").findOne({
    _id: absenceObjectId,
    $or: [
      { parentId: parentIdString },
      { parentEmail: email }
    ]
  });

  if (!absence) {
    return res.status(404).json({
      success: false,
      message: "Absence notice not found under this parent account."
    });
  }

  if (absence.status === "Cancelled") {
    return res.status(200).json({
      success: true,
      message: "Absence notice is already cancelled."
    });
  }

  await db.collection("absences").updateOne(
    { _id: absenceObjectId },
    {
      $set: {
        status: "Cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Absence notice cancelled successfully."
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

      if (action === "reset-parent-password") {
        return resetParentPassword(db, data, res);
      }

      if (action === "change-parent-password") {
        return changeParentPassword(db, data, res);
      }

      if (action === "report-absence") {
        return reportAbsence(db, data, res);
      }

      if (action === "cancel-absence") {
        return cancelAbsence(db, data, res);
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

    const absencesRaw = await db
      .collection("absences")
      .find({
        $or: [
          { parentId: parentIdString },
          { parentEmail: parentEmail }
        ]
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(100)
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
      kafa: student.kafa || "",
      kafaSession: student.kafaSession || "",
      schoolDisplay: student.schoolDisplay || (student.kafa ? `${student.school || ""} + ${student.kafa}` : (student.school || "")),
      monthlyAmount: Number(student.monthlyAmount || 0),
      amountMode: student.amountMode || "Admin Set Amount (RM)",
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
      parentPhone: payment.parentPhone || parent.phone || "",
      parentEmail: payment.parentEmail || parent.email || "",
      studentName: payment.studentName,
      school: payment.school || "",
      kafa: payment.kafa || "",
      kafaSession: payment.kafaSession || "",
      amountMode: payment.amountMode || "Admin Set Amount (RM)",
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
      updatedAt: cleanDate(payment.updatedAt),
      reviewedAt: cleanDate(payment.reviewedAt),
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
      absences: absencesRaw.map(formatAbsence),
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

// MUTAHUS_FIX_PARENT_RESET_PASSWORD_ACTION

// MUTAHUS_STEP26_PAYMENT_ADMIN_AMOUNT_SCHOOL_KAFA_RECEIPT_FIX

// MUTAHUS_STEP30_USER_COMPLAINT_FIXES

// MUTAHUS_STEP59_CHILD_ABSENCE_DOWNLOADABLE_INVOICE
