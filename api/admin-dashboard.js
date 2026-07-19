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
      icon: "🛡️",
      title: "Student Safety",
      description: "Students must follow safety instructions while inside the van. Parents should remind children to behave properly and avoid disturbing the driver.",
      order: 4
    },
    {
      icon: "📱",
      title: "Emergency Contact",
      description: "Parents should make sure their phone number is active and reachable. For urgent matters, parents may contact MUTHAQUS GLOBAL ENTERPRISE through WhatsApp.",
      order: 5
    },
    {
      icon: "🌧️",
      title: "Delay Notice",
      description: "Delays may happen due to traffic, weather, school events or route changes. Parents can check announcements in the parent dashboard.",
      order: 6
    },
    {
      icon: "✅",
      title: "Student Approval",
      description: "New child registrations will be reviewed by admin first. The student status may show Pending Review, Accepted, Active or Rejected.",
      order: 7
    }
  ];
}

async function getDashboard(db, res) {
  const parents = await db.collection("parents").find({}).toArray();
  const students = await db.collection("students").find({}).toArray();
  const payments = await db.collection("payments").find({}).sort({ createdAt: -1 }).limit(5).toArray();

  const paidPayments = await db.collection("payments").find({ status: "Paid" }).toArray();
  const pendingPayments = await db.collection("payments").find({ status: "Pending" }).toArray();

  const summary = {
    totalParents: parents.length,
    totalStudents: students.length,
    morningCount: students.filter(student => student.session === "Morning").length,
    afternoonCount: students.filter(student => student.session === "Afternoon").length,
    pendingPayments: pendingPayments.length,
    totalPaidMonth: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
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
  await db.collection("rules").deleteMany({
    $or: [
      { title: { $regex: "^Absence Notice$", $options: "i" } },
      { description: { $regex: "does not need van service for that day", $options: "i" } }
    ]
  });

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
      message: "Rule updated successfully."
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
    message: "New rule added successfully.",
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

async function adminLogin(db, data, res, req) {
  await ensureDefaultAdmin(db);

  const username = String(data.username || "").trim().toLowerCase();
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

  const now = new Date();
  const lockUntil = admin.lockUntil ? new Date(admin.lockUntil) : null;

  if (lockUntil && lockUntil.getTime() > now.getTime()) {
    const remainingSeconds = Math.ceil(
      (lockUntil.getTime() - now.getTime()) / 1000
    );

    return res.status(423).json({
      success: false,
      locked: true,
      remainingSeconds,
      lockedUntil: lockUntil.toISOString(),
      message: "Admin login is temporarily locked."
    });
  }

  if (lockUntil && lockUntil.getTime() <= now.getTime()) {
    await db.collection("admins").updateOne(
      { _id: admin._id },
      {
        $set: {
          failedLoginAttempts: 0,
          lockUntil: null,
          updatedAt: now
        }
      }
    );
    admin.failedLoginAttempts = 0;
  }

  const passwordMatch = await bcrypt.compare(
    password,
    admin.passwordHash || ""
  );

  if (!passwordMatch) {
    const nextAttempts = Number(admin.failedLoginAttempts || 0) + 1;

    if (nextAttempts >= ADMIN_MAX_LOGIN_ATTEMPTS) {
      const nextLockUntil = new Date(
        now.getTime() + ADMIN_LOCK_MINUTES * 60 * 1000
      );

      await db.collection("admins").updateOne(
        { _id: admin._id },
        {
          $set: {
            failedLoginAttempts: nextAttempts,
            lockUntil: nextLockUntil,
            updatedAt: now
          }
        }
      );

      await recordAdminActivity(db, {
        adminUsername: admin.username,
        adminName: admin.name || "Admin",
        category: "Security",
        action: "Admin login temporarily locked",
        target: admin.username,
        details:
          `Account locked for ${ADMIN_LOCK_MINUTES} minutes after repeated incorrect password attempts.`,
        result: "Blocked"
      }, req);

      return res.status(423).json({
        success: false,
        locked: true,
        remainingSeconds: ADMIN_LOCK_MINUTES * 60,
        lockedUntil: nextLockUntil.toISOString(),
        message:
          "Too many incorrect attempts. Admin login is temporarily locked."
      });
    }

    await db.collection("admins").updateOne(
      { _id: admin._id },
      {
        $set: {
          failedLoginAttempts: nextAttempts,
          lockUntil: null,
          updatedAt: now
        }
      }
    );

    return res.status(401).json({
      success: false,
      attemptsRemaining: ADMIN_MAX_LOGIN_ATTEMPTS - nextAttempts,
      message: "Invalid admin username or password."
    });
  }

  const previousLastLoginAt = admin.lastLoginAt || null;

  await db.collection("admins").updateOne(
    { _id: admin._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: now,
        updatedAt: now
      }
    }
  );

  await recordAdminActivity(db, {
    adminUsername: admin.username,
    adminName: admin.name || "Admin",
    category: "Security",
    action: "Admin login successful",
    target: admin.username,
    details: "A secure admin session was started."
  }, req);

  return res.status(200).json({
    success: true,
    message: "Admin login successful.",
    admin: {
      id: admin._id.toString(),
      username: admin.username,
      name: admin.name || "Admin",
      role: admin.role || "admin",
      status: admin.status || "Active",
      lastLoginAt: now.toISOString(),
      previousLastLoginAt: cleanDateTime(previousLastLoginAt)
    }
  });
}

async function changeAdminPassword(db, data, res, req) {
  await ensureDefaultAdmin(db);

  const username = String(data.username || "admin").trim().toLowerCase();
  const oldPassword = data.oldPassword || "";
  const newPassword = data.newPassword || "";

  if (!oldPassword || !newPassword) {
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

  const admin = await db.collection("admins").findOne({ username });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin account not found."
    });
  }

  const passwordMatch = await bcrypt.compare(
    oldPassword,
    admin.passwordHash || ""
  );

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect."
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.collection("admins").updateOne(
    { _id: admin._id },
    {
      $set: {
        passwordHash,
        failedLoginAttempts: 0,
        lockUntil: null,
        updatedAt: new Date()
      }
    }
  );

  await recordAdminActivity(db, {
    adminUsername: admin.username,
    adminName: admin.name || "Admin",
    category: "Security",
    action: "Admin password changed",
    target: admin.username,
    details: "The admin account password was updated."
  }, req);

  return res.status(200).json({
    success: true,
    message: "Admin password updated successfully."
  });
}


async function getSystemBackup(db, req, res) {
  const [
    parentsRaw,
    studentsRaw,
    paymentsRaw,
    announcementsRaw,
    rulesRaw,
    adminsRaw,
    activityRaw
  ] = await Promise.all([
    db.collection("parents").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("students").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("payments").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("rules").find({}).sort({ order: 1, createdAt: 1 }).toArray(),
    db.collection("admins").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("admin_activity_logs").find({}).sort({ createdAt: -1 }).limit(500).toArray()
  ]);

  const sanitizeId = item => {
    const clean = { ...item };
    clean.id = clean._id ? clean._id.toString() : clean.id;
    delete clean._id;
    return clean;
  };

  const parents = parentsRaw.map(sanitizeId);
  const students = studentsRaw.map(sanitizeId);
  let excludedReceiptImages = 0;

  const payments = paymentsRaw.map(payment => {
    const clean = sanitizeId(payment);

    if (clean.receiptDataUrl) {
      excludedReceiptImages += 1;
      clean.hasReceiptDataUrl = true;
      delete clean.receiptDataUrl;
    }

    return clean;
  });

  const announcements = announcementsRaw.map(sanitizeId);
  const rules = rulesRaw.map(sanitizeId);
  const admins = adminsRaw.map(sanitizeId);
  const adminActivityLogs = activityRaw.map(sanitizeId);

  const backup = {
    system: "MUTHAQUS GLOBAL ENTERPRISE Van System",
    backupVersion: 2,
    exportedAt: new Date().toISOString(),
    securityNote:
      "This recovery file contains protected account credentials and private operational records. Keep it private.",
    receiptNote:
      "Large receipt images are excluded. Existing matching receipt images are preserved during restore.",
    excludedReceiptImages,
    counts: {
      parents: parents.length,
      students: students.length,
      payments: payments.length,
      announcements: announcements.length,
      rules: rules.length,
      admins: admins.length,
      adminActivityLogs: adminActivityLogs.length
    },
    parents,
    students,
    payments,
    announcements,
    rules,
    admins,
    adminActivityLogs
  };

  const username = String(req.query.username || "admin").trim().toLowerCase();
  const admin = await db.collection("admins").findOne({ username });

  await recordAdminActivity(db, {
    adminUsername: username,
    adminName: admin?.name || "Admin",
    category: "Backup",
    action: "Secure backup downloaded",
    target: backup.exportedAt,
    details:
      `Backup contains ${parents.length} parents, ${students.length} students and ${payments.length} payments.`
  }, req);

  return res.status(200).json({
    success: true,
    message: "Secure backup generated successfully.",
    backup
  });
}

const ADMIN_MAX_LOGIN_ATTEMPTS = 5;
const ADMIN_LOCK_MINUTES = 15;
const ACTIVITY_LOG_LIMIT = 2000;

function cleanDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function safeActivityText(value, maximum = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return String(req.headers?.["x-real-ip"] || "").trim();
}

async function recordAdminActivity(db, entry, req) {
  try {
    await db.collection("admin_activity_logs").insertOne({
      adminUsername: safeActivityText(entry.adminUsername || "admin", 80),
      adminName: safeActivityText(entry.adminName || "Admin", 120),
      category: safeActivityText(entry.category || "System", 60),
      action: safeActivityText(entry.action || "Admin action", 160),
      target: safeActivityText(entry.target || "", 180),
      details: safeActivityText(entry.details || "", 700),
      result: safeActivityText(entry.result || "Success", 40),
      ipAddress: getClientIp(req),
      userAgent: safeActivityText(req.headers?.["user-agent"] || "", 250),
      createdAt: new Date()
    });

    const total = await db.collection("admin_activity_logs").estimatedDocumentCount();

    if (total > ACTIVITY_LOG_LIMIT) {
      const oldLogs = await db.collection("admin_activity_logs")
        .find({})
        .sort({ createdAt: 1 })
        .limit(total - ACTIVITY_LOG_LIMIT)
        .project({ _id: 1 })
        .toArray();

      if (oldLogs.length) {
        await db.collection("admin_activity_logs").deleteMany({
          _id: { $in: oldLogs.map(item => item._id) }
        });
      }
    }
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
}

async function getAdminActivityLog(db, req, res) {
  const limit = Math.max(1, Math.min(300, Number(req.query.limit || 200)));

  const activities = await db.collection("admin_activity_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, today, security, dataChanges] = await Promise.all([
    db.collection("admin_activity_logs").countDocuments(),
    db.collection("admin_activity_logs").countDocuments({
      createdAt: { $gte: startOfToday }
    }),
    db.collection("admin_activity_logs").countDocuments({
      category: "Security"
    }),
    db.collection("admin_activity_logs").countDocuments({
      category: {
        $in: ["Students", "Parents", "Payments", "Announcements", "Rules", "Backup"]
      }
    })
  ]);

  return res.status(200).json({
    success: true,
    activities: activities.map(item => ({
      id: item._id.toString(),
      adminUsername: item.adminUsername || "admin",
      adminName: item.adminName || "Admin",
      category: item.category || "System",
      action: item.action || "Admin action",
      target: item.target || "",
      details: item.details || "",
      result: item.result || "Success",
      createdAt: cleanDateTime(item.createdAt)
    })),
    summary: { total, today, security, dataChanges }
  });
}

async function getAdminSecurity(db, req, res) {
  await ensureDefaultAdmin(db);

  const username = String(req.query.username || "admin").trim().toLowerCase();
  const admin = await db.collection("admins").findOne({ username });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin account not found."
    });
  }

  const now = new Date();
  const lockUntil = admin.lockUntil ? new Date(admin.lockUntil) : null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayActions = await db.collection("admin_activity_logs").countDocuments({
    adminUsername: username,
    createdAt: { $gte: startOfToday }
  });

  return res.status(200).json({
    success: true,
    security: {
      username: admin.username,
      name: admin.name || "Admin",
      role: admin.role || "admin",
      status: admin.status || "Active",
      lastLoginAt: cleanDateTime(admin.lastLoginAt),
      failedLoginAttempts: Number(admin.failedLoginAttempts || 0),
      lockUntil: cleanDateTime(lockUntil),
      isLocked: Boolean(lockUntil && lockUntil.getTime() > now.getTime()),
      todayActions
    }
  });
}

async function recordActivityRequest(db, data, req, res) {
  await recordAdminActivity(db, {
    adminUsername: data.adminUsername || "admin",
    adminName: data.adminName || "Admin",
    category: data.category || "System",
    action:
      data.actionName ||
      data.activityAction ||
      data.actionLabel ||
      "Admin action",
    target: data.target || "",
    details: data.details || "",
    result: data.result || "Success"
  }, req);

  return res.status(200).json({
    success: true,
    message: "Activity recorded successfully."
  });
}

function restoreDateFields(document) {
  [
    "createdAt", "updatedAt", "reviewedAt", "datePaid",
    "lastLoginAt", "lockUntil", "exportedAt"
  ].forEach(field => {
    if (!document[field]) return;
    const date = new Date(document[field]);
    if (!Number.isNaN(date.getTime())) document[field] = date;
  });

  return document;
}

function backupDocumentToRecord(item) {
  const record = { ...item };
  const id = record.id || record._id;
  delete record.id;
  delete record._id;

  if (id && ObjectId.isValid(String(id))) {
    record._id = new ObjectId(String(id));
  }

  return restoreDateFields(record);
}

async function getExistingRecoveryMaps(db) {
  const [parents, admins, payments] = await Promise.all([
    db.collection("parents").find({}).toArray(),
    db.collection("admins").find({}).toArray(),
    db.collection("payments").find({}).toArray()
  ]);

  return {
    parentsByEmail: new Map(
      parents.filter(item => item.email).map(item => [
        String(item.email).toLowerCase(), item
      ])
    ),
    adminsByUsername: new Map(
      admins.filter(item => item.username).map(item => [
        String(item.username).toLowerCase(), item
      ])
    ),
    paymentsById: new Map(
      payments.map(item => [item._id.toString(), item])
    )
  };
}

async function prepareRestoreRecords(collectionName, source, recoveryMaps, warnings) {
  const records = [];

  for (const raw of source || []) {
    const record = backupDocumentToRecord(raw);

    if (collectionName === "parents") {
      const email = String(record.email || "").toLowerCase();
      const existing = recoveryMaps.parentsByEmail.get(email);

      if (existing) {
        record._id = existing._id;
        if (!record.passwordHash) record.passwordHash = existing.passwordHash;
      }

      if (!record.passwordHash) {
        warnings.push(
          `Parent ${record.email || record.name || "record"} was skipped because protected login data was unavailable.`
        );
        continue;
      }
    }

    if (collectionName === "admins") {
      const username = String(record.username || "").toLowerCase();
      const existing = recoveryMaps.adminsByUsername.get(username);

      if (existing) {
        record._id = existing._id;
        if (!record.passwordHash) record.passwordHash = existing.passwordHash;
      }

      if (!record.passwordHash) {
        warnings.push(
          `Admin ${record.username || "record"} was skipped because protected login data was unavailable.`
        );
        continue;
      }
    }

    if (collectionName === "payments") {
      const existing = record._id
        ? recoveryMaps.paymentsById.get(record._id.toString())
        : null;

      if (existing?.receiptDataUrl && !record.receiptDataUrl) {
        record.receiptDataUrl = existing.receiptDataUrl;
      }
    }

    records.push(record);
  }

  return records;
}

async function mergeRestoreCollection(db, collectionName, records) {
  if (!records.length) return { processed: 0 };

  const operations = records.map(record => {
    let filter;

    if (record._id) {
      filter = { _id: record._id };
    } else if (collectionName === "parents") {
      filter = { email: String(record.email || "").toLowerCase() };
    } else if (collectionName === "admins") {
      filter = { username: String(record.username || "").toLowerCase() };
    } else {
      record._id = new ObjectId();
      filter = { _id: record._id };
    }

    return {
      replaceOne: {
        filter,
        replacement: record,
        upsert: true
      }
    };
  });

  await db.collection(collectionName).bulkWrite(operations, { ordered: false });
  return { processed: records.length };
}

async function replaceRestoreCollection(db, collectionName, records) {
  await db.collection(collectionName).deleteMany({});

  if (records.length) {
    await db.collection(collectionName).insertMany(records, { ordered: false });
  }

  return { processed: records.length };
}

async function restoreSystemBackup(db, data, req, res) {
  const confirmation = String(data.confirmation || "").trim().toUpperCase();

  if (confirmation !== "RESTORE MUTHAQUS") {
    return res.status(400).json({
      success: false,
      message: "Restore confirmation text is incorrect."
    });
  }

  const backup = data.backup;

  if (!backup || typeof backup !== "object") {
    return res.status(400).json({
      success: false,
      message: "A valid backup file is required."
    });
  }

  const system = String(backup.system || "").toUpperCase();

  if (!system.includes("MUTHAQUS") && !system.includes("MUTAHUS")) {
    return res.status(400).json({
      success: false,
      message: "The selected file is not a MUTHAQUS backup."
    });
  }

  const required = ["parents", "students", "payments", "announcements", "rules"];
  const missing = required.filter(key => !Array.isArray(backup[key]));

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Backup is missing: ${missing.join(", ")}.`
    });
  }

  const mode = data.mode === "replace" ? "replace" : "merge";
  const warnings = [];
  const recoveryMaps = await getExistingRecoveryMaps(db);

  const sources = {
    parents: backup.parents || [],
    students: backup.students || [],
    payments: backup.payments || [],
    announcements: backup.announcements || [],
    rules: backup.rules || [],
    admins: backup.admins || [],
    admin_activity_logs: backup.adminActivityLogs || []
  };

  const prepared = {};

  for (const [collectionName, source] of Object.entries(sources)) {
    prepared[collectionName] = await prepareRestoreRecords(
      collectionName, source, recoveryMaps, warnings
    );
  }

  const restoreOrder = [
    "parents", "students", "payments", "announcements",
    "rules", "admins", "admin_activity_logs"
  ];

  const counts = {};

  for (const collectionName of restoreOrder) {
    if (
      (collectionName === "admin_activity_logs" ||
       collectionName === "admins") &&
      !prepared[collectionName].length
    ) {
      counts[collectionName] = 0;

      if (collectionName === "admins") {
        warnings.push(
          "Current admin account was preserved because the backup did not contain recoverable admin credentials."
        );
      }

      continue;
    }

    const result = mode === "replace"
      ? await replaceRestoreCollection(db, collectionName, prepared[collectionName])
      : await mergeRestoreCollection(db, collectionName, prepared[collectionName]);

    counts[collectionName] = result.processed;
  }

  await ensureDefaultAdmin(db);

  await recordAdminActivity(db, {
    adminUsername: data.adminUsername || "admin",
    adminName: data.adminName || "Admin",
    category: "Backup",
    action: "System backup restored",
    target: backup.exportedAt || "Selected backup",
    details:
      `Restore mode: ${mode}. Parents: ${counts.parents || 0}, ` +
      `students: ${counts.students || 0}, payments: ${counts.payments || 0}.`
  }, req);

  return res.status(200).json({
    success: true,
    message: "Backup restored successfully.",
    mode,
    counts,
    warnings
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

      if (action === "backup") {
        return getSystemBackup(db, req, res);
      }

      if (action === "activity-log") {
        return getAdminActivityLog(db, req, res);
      }

      if (action === "admin-security") {
        return getAdminSecurity(db, req, res);
      }

      return getDashboard(db, res);
    }

    if (req.method === "POST") {
      const data = req.body || {};
      const action = (data.action || "").trim();

      if (action === "admin-login") {
        return adminLogin(db, data, res, req);
      }

      if (action === "change-admin-password") {
        return changeAdminPassword(db, data, res, req);
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

      if (action === "record-activity") {
        return recordActivityRequest(db, data, req, res);
      }

      if (action === "restore-backup") {
        return restoreSystemBackup(db, data, req, res);
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

// MUTHAQUS_STEP61_REBRAND_RULE_CLEANUP

// MUTHAQUS_STEP84_86_89_SECURITY_REPORT_BACKUP_RESTORE
