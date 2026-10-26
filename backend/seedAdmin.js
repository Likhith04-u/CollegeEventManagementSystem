require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@college.com").toLowerCase().trim();
  const name = process.env.ADMIN_NAME || "College Administrator";
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || password === "ChangeThisAdminPassword123!") {
    throw new Error("Set a unique ADMIN_PASSWORD of at least 12 characters in backend/.env before seeding.");
  }
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college_event_management");
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    { $set: { name, email, password: hash, role: "admin" } },
    { upsert: true, new: true, runValidators: true }
  );
  console.log(`Admin account created/updated: ${email}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});