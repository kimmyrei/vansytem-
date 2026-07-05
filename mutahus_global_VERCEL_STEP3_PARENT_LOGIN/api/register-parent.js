const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST only."
    });
  }

  try {
    const data = req.body || {};

    const name = (data.name || "").trim();
    const phone = (data.phone || "").trim();
    const email = (data.email || "").trim().toLowerCase();
    const password = data.password || "";

    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const { db } = await connectToDatabase();
    const parents = db.collection("parents");

    const existingParent = await parents.findOne({ email });

    if (existingParent) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newParent = {
      name,
      phone,
      email,
      passwordHash,
      status: "Active",
      role: "parent",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await parents.insertOne(newParent);

    return res.status(200).json({
      success: true,
      message: "Parent registered successfully.",
      parentId: result.insertedId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Parent registration failed.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
