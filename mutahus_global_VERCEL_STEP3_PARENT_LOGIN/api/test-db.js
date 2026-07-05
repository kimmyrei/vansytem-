const { connectToDatabase } = require("./_db");

module.exports = async function handler(req, res) {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        step: "ENV_CHECK",
        message: "MONGODB_URI is missing in Vercel Environment Variables."
      });
    }

    const { db } = await connectToDatabase();

    const ping = await db.command({ ping: 1 });

    const result = await db.collection("connection_tests").insertOne({
      message: "MongoDB connected successfully from Mutahus Global on Vercel",
      source: "Vercel API Route",
      ping,
      createdAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "MongoDB connected successfully.",
      database: "mutahus_global",
      collection: "connection_tests",
      insertedId: result.insertedId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      step: "MONGODB_CONNECTION",
      message: "MongoDB connection failed. Check Network Access, password, or cluster URL.",
      error: {
        name: error.name,
        message: error.message,
        code: error.code || null
      }
    });
  }
};
