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
    const email = (data.email || "").trim().toLowerCase();
    const password = data.password || "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password."
      });
    }

    const { db } = await connectToDatabase();
    const parent = await db.collection("parents").findOne({ email });

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please register first or check your login details."
      });
    }

    const passwordMatch = await bcrypt.compare(password, parent.passwordHash || "");

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please register first or check your login details."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      parent: {
        id: parent._id.toString(),
        name: parent.name,
        phone: parent.phone,
        email: parent.email,
        status: parent.status || "Active",
        role: parent.role || "parent"
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Parent login failed.",
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};
