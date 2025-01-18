import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Post from "../models/Post.js";

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Remove invalid users
    const invalidUsers = await User.deleteMany({
      $or: [
        { email: { $exists: false } },
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
      ],
    });

    // Remove invalid posts
    const invalidPosts = await Post.deleteMany({
      $or: [
        { userId: { $exists: false } },
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
      ],
    });

    console.log(`Removed ${invalidUsers.deletedCount} invalid users`);
    console.log(`Removed ${invalidPosts.deletedCount} invalid posts`);

    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanup();
