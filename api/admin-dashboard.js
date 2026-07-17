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
      title: "Payment Reminder",
      type: "Payment Reminder",
      priority: "Important",
      message: "Please upload your monthly payment receipt before the 5th of every month.",
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Delay Notice",
      type: "Delay Notice",
      priority: "Urgent",
      message: "The van may be late by 10 minutes due to traffic. Thank you for your patience.",
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

function defaultRules() {
  return [
    {
      icon: "💳",
      title: "Monthly Payment",
      description: "Monthly payment should be made according to the agreed date. Parents are required to upload the payment receipt through the parent portal after making payment.",
      order: 1
    },
    {
      icon: "⏰",
      title: "Pickup Time",
      description: "Students must be ready at the pickup point before the van arrives. Late students may affect the route schedule for other students.",
      order: 2
    },
    {
      icon: "🏠",
      title: "Pickup Location",
      description: "Parents must provide a clear and accurate pickup location. Any change of address or pickup point should be informed earlier.",
      order: 3
    },
    {
      icon: "📢",
      title: "Absence Notice",
      description: "If a student will not attend school or does not need van service for that day, parents should inform Mutahus Global as early as possible.",
      order: 4
    },
    {
      icon: "🛡️",
      title: "Student Safety",
      description: "Students must follow safety instructions while inside the van. Parents should remind children to behave properly and avoid disturbing the driver.",
      order: 5
    },
    {
      icon: "📱",
      title: "Emergency Contact",
      description: "Parents should make sure their phone number is active and reachable. For urgent matters, parents may contact Mutahus Global through WhatsApp.",
      order: 6
    },
    {
      icon: "🌧️",
      title: "Delay Notice",
      description: "Delays may happen due to traffic, weather, school events or route changes. Parents can check announcements in the parent dashboard.",
      order: 7
    },
    {
      icon: "✅",
      title: "Student Approval",
      description: "New child registrations will be reviewed by admin first. The student status may show Pending Review, Accepted, Active or Rejected.",
      order: 8
    }
  ];
}

async function getDashboard(db, res) {
  const parents = await db.collection("parents").find({}).toArray();
  const students = await db.collection("students").find({}).toArray();
  const payments = await db.collection("payments").find({}).sort({ createdAt: -1 }).limit(5).toArray();

  const paidPayments = await db.collection("payments").find({ status: "Paid" }).toArray();
  const pendingPayments = await db.collection("payments").find({ status: "Pending" }).toArray();
  const todayAbsences = await db.collection("absences").countDocuments({
    date: malaysiaTodayValue(),
    status: { $ne: "Cancelled" }
  });

  const summary = {
    totalParents: parents.length,
    totalStudents: students.length,
    morningCount: students.filter(student => student.session === "Morning").length,
    afternoonCount: students.filter(student => student.session === "Afternoon").length,
    pendingPayments: pendingPayments.length,
    totalPaidMonth: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    todayAbsences
  };

  const recentPayments = payments.map(payment => ({
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
}

async function getAnnouncements(db, res) {
  let announcements = await db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray();

  if (announcements.length === 0) {
    await db.collection("announcements").insertMany(defaultAnnouncements());
    announcements = await db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray();
  }

  const formatted = announcements.map(item => ({
    id: item._id.toString(),
    title: item.title || "",
    type: item.type || "General Announcement",
    priority: item.priority || "Normal",
    message: item.message || "",
    status: item.status || "Active",
    date: cleanDate(item.createdAt || item.date),
    createdAt: cleanDate(item.createdAt),
    updatedAt: cleanDate(item.updatedAt)
  }));

  const now = new Date();
  const thisMonth = formatted.filter(item => {
    const raw = announcements.find(a => a._id.toString() === item.id);
    if (!raw || !raw.createdAt) return false;
    const created = new Date(raw.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const summary = {
    totalAnnouncements: formatted.length,
    thisMonth,
    importantNotices: formatted.filter(item => item.priority === "Important" || item.priority === "Urgent").length,
    generalUpdates: formatted.filter(item => item.type === "General Announcement").length
  };

  return res.status(200).json({
    success: true,
    announcements: formatted,
    summary
  });
}

async function getRules(db, res) {
  let rules = await db.collection("rules").find({}).sort({ order: 1, createdAt: 1 }).toArray();

  if (rules.length === 0) {
    const seeds = defaultRules().map(rule => ({
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.collection("rules").insertMany(seeds);
    rules = await db.collection("rules").find({}).sort({ order: 1, createdAt: 1 }).toArray();
  }

  const formatted = rules.map((rule, index) => ({
    id: rule._id.toString(),
    icon: rule.icon || "✅",
    title: rule.title || "",
    description: rule.description || "",
    order: Number(rule.order || index + 1),
    createdAt: cleanDate(rule.createdAt),
    updatedAt: cleanDate(rule.updatedAt)
  }));

  return res.status(200).json({
    success: true,
    rules: formatted,
    summary: {
      totalRules: formatted.length
    }
  });
}

async function postAnnouncement(db, data, res) {
  const title = (data.title || "").trim();
  const type = (data.type || "General Announcement").trim();
  const priority = (data.priority || "Normal").trim();
  const message = (data.message || "").trim();

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in announcement title and message."
    });
  }

  const announcement = {
    title,
    type,
    priority,
    message,
    status: "Active",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("announcements").insertOne(announcement);

  return res.status(200).json({
    success: true,
    message: "Announcement posted successfully.",
    announcementId: result.insertedId
  });
}

async function updateAnnouncementStatus(db, data, res) {
  const announcementId = (data.announcementId || "").trim();
  const status = (data.status || "").trim();

  if (!announcementId || !status) {
    return res.status(400).json({
      success: false,
      message: "Announcement ID and status are required."
    });
  }

  await db.collection("announcements").updateOne(
    { _id: new ObjectId(announcementId) },
    {
      $set: {
        status,
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Announcement status updated successfully."
  });
}

async function deleteAnnouncement(db, data, res) {
  const announcementId = (data.announcementId || "").trim();

  if (!announcementId) {
    return res.status(400).json({
      success: false,
      message: "Announcement ID is required."
    });
  }

  await db.collection("announcements").deleteOne({ _id: new ObjectId(announcementId) });

  return res.status(200).json({
    success: true,
    message: "Announcement deleted successfully."
  });
}

async function saveRule(db, data, res) {
  const ruleId = (data.ruleId || "").trim();
  const icon = (data.icon || "✅").trim();
  const title = (data.title || "").trim();
  const description = (data.description || "").trim();

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Please fill in rule title and description."
    });
  }

  if (ruleId) {
    await db.collection("rules").updateOne(
      { _id: new ObjectId(ruleId) },
      {
        $set: {
          icon,
          title,
          description,
          updatedAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Rule updated successfully in MongoDB."
    });
  }

  const totalRules = await db.collection("rules").countDocuments();

  const result = await db.collection("rules").insertOne({
    icon,
    title,
    description,
    order: totalRules + 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return res.status(200).json({
    success: true,
    message: "New rule added successfully in MongoDB.",
    ruleId: result.insertedId
  });
}

async function deleteRule(db, data, res) {
  const ruleId = (data.ruleId || "").trim();

  if (!ruleId) {
    return res.status(400).json({
      success: false,
      message: "Rule ID is required."
    });
  }

  await db.collection("rules").deleteOne({ _id: new ObjectId(ruleId) });

  return res.status(200).json({
    success: true,
    message: "Rule deleted successfully."
  });
}

async function resetRules(db, res) {
  await db.collection("rules").deleteMany({});

  const seeds = defaultRules().map(rule => ({
    ...rule,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.collection("rules").insertMany(seeds);

  return res.status(200).json({
    success: true,
    message: "Rules reset to default successfully.",
    totalRules: seeds.length
  });
}


async function ensureDefaultAdmin(db) {
  const totalAdmins = await db.collection("admins").countDocuments();

  if (totalAdmins > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  await db.collection("admins").insertOne({
    username: "admin",
    name: "Main Admin",
    passwordHash,
    role: "superadmin",
    status: "Active",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

async function adminLogin(db, data, res) {
  await ensureDefaultAdmin(db);

  const username = (data.username || "").trim().toLowerCase();
  const password = data.password || "";

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter admin username and password."
    });
  }

  const admin = await db.collection("admins").findOne({ username });

  if (!admin || admin.status === "Inactive") {
    return res.status(401).json({
      success: false,
      message: "Invalid admin username or password."
    });
  }

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash || "");

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin username or password."
    });
  }

  await db.collection("admins").updateOne(
    { _id: admin._id },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Admin login successful.",
    admin: {
      id: admin._id.toString(),
      username: admin.username,
      name: admin.name || "Admin",
      role: admin.role || "admin",
      status: admin.status || "Active"
    }
  });
}

async function changeAdminPassword(db, data, res) {
  await ensureDefaultAdmin(db);

  const username = (data.username || "admin").trim().toLowerCase();
  const oldPassword = data.oldPassword || "";
  const newPassword = data.newPassword || "";

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required."
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters."
    });
  }

  const admin = await db.collection("admins").findOne({ username });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin account not found."
    });
  }

  const passwordMatch = await bcrypt.compare(oldPassword, admin.passwordHash || "");

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message: "Old password is incorrect."
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.collection("admins").updateOne(
    { _id: admin._id },
    {
      $set: {
        passwordHash,
        updatedAt: new Date()
      }
    }
  );

  return res.status(200).json({
    success: true,
    message: "Admin password updated successfully."
  });
}


async function getSystemBackup(db, res) {
  const parentsRaw = await db.collection("parents").find({}).sort({ createdAt: -1 }).toArray();
  const studentsRaw = await db.collection("students").find({}).sort({ createdAt: -1 }).toArray();
  const paymentsRaw = await db.collection("payments").find({}).sort({ createdAt: -1 }).toArray();
  const announcementsRaw = await db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray();
  const rulesRaw = await db.collection("rules").find({}).sort({ order: 1, createdAt: 1 }).toArray();
  const absencesRaw = await db.collection("absences").find({}).sort({ date: -1, createdAt: -1 }).toArray();
  const adminsRaw = await db.collection("admins").find({}).sort({ createdAt: -1 }).toArray();

  const sanitizeId = item => {
    const clean = { ...item };
    clean.id = clean._id ? clean._id.toString() : clean.id;
    delete clean._id;
    return clean;
  };

  const parents = parentsRaw.map(parent => {
    const clean = sanitizeId(parent);
    delete clean.passwordHash;
    return clean;
  });

  const students = studentsRaw.map(sanitizeId);

  const payments = paymentsRaw.map(payment => {
    const clean = sanitizeId(payment);
    clean.hasReceiptDataUrl = Boolean(clean.receiptDataUrl);
    delete clean.receiptDataUrl;
    return clean;
  });

  const announcements = announcementsRaw.map(sanitizeId);
  const rules = rulesRaw.map(sanitizeId);
  const absences = absencesRaw.map(sanitizeId);

  const admins = adminsRaw.map(admin => {
    const clean = sanitizeId(admin);
    delete clean.passwordHash;
    return clean;
  });

  const backup = {
    system: "Mutahus Global Van System",
    database: "mutahus_global",
    exportedAt: new Date().toISOString(),
    note: "Password hashes and large receiptDataUrl fields are excluded from this backup.",
    counts: {
      parents: parents.length,
      students: students.length,
      payments: payments.length,
      announcements: announcements.length,
      rules: rules.length,
      absences: absences.length,
      admins: admins.length
    },
    parents,
    students,
    payments,
    announcements,
    rules,
    absences,
    admins
  };

  return res.status(200).json({
    success: true,
    message: "System backup generated successfully.",
    backup
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

async function getAbsences(db, res) {
  const raw = await db
    .collection("absences")
    .find({})
    .sort({ date: 1, createdAt: -1 })
    .limit(500)
    .toArray();

  const today = malaysiaTodayValue();
  const active = raw.filter(item => item.status !== "Cancelled");

  return res.status(200).json({
    success: true,
    absences: raw.map(formatAbsence),
    summary: {
      total: raw.length,
      today: active.filter(item => item.date === today).length,
      upcoming: active.filter(item => item.date > today).length,
      submitted: raw.filter(item => (item.status || "Submitted") === "Submitted").length,
      acknowledged: raw.filter(item => item.status === "Acknowledged").length,
      cancelled: raw.filter(item => item.status === "Cancelled").length
    }
  });
}

async function updateAbsenceStatus(db, data, res) {
  const absenceId = String(data.absenceId || "").trim();
  const status = String(data.status || "").trim();
  const allowedStatuses = ["Submitted", "Acknowledged", "Cancelled"];

  if (!absenceId || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Valid absence ID and status are required."
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

  const existing = await db.collection("absences").findOne({
    _id: absenceObjectId
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Absence notice not found."
    });
  }

  const now = new Date();
  const update = {
    status,
    updatedAt: now
  };

  if (status === "Acknowledged") {
    update.acknowledgedAt = now;
  }

  if (status === "Cancelled") {
    update.cancelledAt = now;
  }

  await db.collection("absences").updateOne(
    { _id: absenceObjectId },
    { $set: update }
  );

  return res.status(200).json({
    success: true,
    message: "Absence status updated successfully.",
    status
  });
}

module.exports = async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      const action = (req.query.action || "").trim();

      if (action === "announcements") {
        return getAnnouncements(db, res);
      }

      if (action === "rules") {
        return getRules(db, res);
      }

      if (action === "absences") {
        return getAbsences(db, res);
      }

      if (action === "backup") {
        return getSystemBackup(db, res);
      }

      return getDashboard(db, res);
    }

    if (req.method === "POST") {
      const data = req.body || {};
      const action = (data.action || "").trim();

      if (action === "admin-login") {
        return adminLogin(db, data, res);
      }

      if (action === "change-admin-password") {
        return changeAdminPassword(db, data, res);
      }

      if (action === "post-announcement") {
        return postAnnouncement(db, data, res);
      }

      if (action === "update-announcement-status") {
        return updateAnnouncementStatus(db, data, res);
      }

      if (action === "delete-announcement") {
        return deleteAnnouncement(db, data, res);
      }

      if (action === "save-rule") {
        return saveRule(db, data, res);
      }

      if (action === "delete-rule") {
        return deleteRule(db, data, res);
      }

      if (action === "reset-rules") {
        return resetRules(db, res);
      }

      if (action === "update-absence-status") {
        return updateAbsenceStatus(db, data, res);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid admin dashboard action."
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET or POST only."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin dashboard request failed.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// MUTAHUS_STEP15_ADMIN_LOGIN_MONGODB

// MUTAHUS_STEP21_ADMIN_BACKUP_DOWNLOAD

// MUTAHUS_STEP59_CHILD_ABSENCE_DOWNLOADABLE_INVOICE
