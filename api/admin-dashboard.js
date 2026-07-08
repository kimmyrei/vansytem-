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

function isThisMonth(value) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

async function getDashboard(req, res, db) {
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
}

async function getAnnouncements(req, res, db) {
  const announcementsRaw = await db
    .collection("announcements")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const announcements = announcementsRaw.map(item => ({
    id: item._id.toString(),
    title: item.title || "",
    type: item.type || "General Announcement",
    priority: item.priority || "Normal",
    message: item.message || "",
    status: item.status || "Active",
    date: cleanDate(item.createdAt || item.date),
    createdAt: item.createdAt || null
  }));

  const summary = {
    totalAnnouncements: announcements.length,
    thisMonth: announcementsRaw.filter(item => isThisMonth(item.createdAt || item.date)).length,
    importantNotices: announcements.filter(item =>
      item.priority === "Important" ||
      item.priority === "Urgent" ||
      item.type === "Emergency Notice"
    ).length,
    generalUpdates: announcements.filter(item =>
      item.priority === "Normal" ||
      item.type === "General Announcement"
    ).length
  };

  return res.status(200).json({
    success: true,
    announcements,
    summary
  });
}

async function postAnnouncement(req, res, db, data) {
  const title = (data.title || "").trim();
  const type = (data.type || "").trim();
  const priority = (data.priority || "Normal").trim();
  const message = (data.message || "").trim();

  if (!title || !type || !priority || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all announcement details."
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

async function updateAnnouncementStatus(req, res, db, data) {
  const announcementId = (data.announcementId || "").trim();
  const status = (data.status || "").trim();

  if (!announcementId || !status) {
    return res.status(400).json({
      success: false,
      message: "Announcement ID and status are required."
    });
  }

  if (!["Active", "Inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid announcement status."
    });
  }

  let announcementObjectId;

  try {
    announcementObjectId = new ObjectId(announcementId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid announcement ID."
    });
  }

  const result = await db.collection("announcements").updateOne(
    { _id: announcementObjectId },
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
      message: "Announcement not found."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Announcement status updated successfully.",
    status
  });
}

async function deleteAnnouncement(req, res, db, data) {
  const announcementId = (data.announcementId || "").trim();

  if (!announcementId) {
    return res.status(400).json({
      success: false,
      message: "Announcement ID is required."
    });
  }

  let announcementObjectId;

  try {
    announcementObjectId = new ObjectId(announcementId);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid announcement ID."
    });
  }

  const result = await db.collection("announcements").deleteOne({
    _id: announcementObjectId
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: "Announcement not found."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Announcement deleted successfully."
  });
}

module.exports = async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      const action = (req.query.action || "dashboard").trim();

      if (action === "announcements") {
        return await getAnnouncements(req, res, db);
      }

      return await getDashboard(req, res, db);
    }

    if (req.method === "POST") {
      const data = req.body || {};
      const action = (data.action || "").trim();

      if (action === "post-announcement") {
        return await postAnnouncement(req, res, db, data);
      }

      if (action === "update-announcement-status") {
        return await updateAnnouncementStatus(req, res, db, data);
      }

      if (action === "delete-announcement") {
        return await deleteAnnouncement(req, res, db, data);
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
