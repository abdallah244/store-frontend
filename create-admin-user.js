const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../backend/models/User");

async function createAdminUser() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/store",
      {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log("✓ Connected to MongoDB");

    // Create admin user with completed profile
    const hashedPassword = await bcrypt.hash("admin123456", 10);

    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      phone: "01098765432",
      password: hashedPassword,
      profileImage: null,
      address: "456 Admin Street, Cairo",
      country: "Egypt",
      governorate: "Cairo",
      accountCompleted: true,
      role: "admin",
      banned: false,
    });

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("✓ Admin user already exists");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  ID: ${existingAdmin._id}`);
      console.log(`  Role: ${existingAdmin.role}`);
      await mongoose.disconnect();
      return;
    }

    await adminUser.save();

    console.log("✓ Admin user created successfully");
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: admin123456`);
    console.log(`  Admin ID: ${adminUser._id}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log("\n✓ Use this account to view orders in admin panel!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

createAdminUser();
