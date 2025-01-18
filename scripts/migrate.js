import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Post from "../models/Post.js";

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Migrate users
    console.log("Migrating users...");
    const users = await User.find();
    let userCount = 0;

    for (const user of users) {
      try {
        // Convert friends array to ObjectIds if they're strings
        if (Array.isArray(user.friends)) {
          user.friends = user.friends.map((friend) =>
            mongoose.Types.ObjectId.isValid(friend)
              ? friend
              : mongoose.Types.ObjectId()
          );
        } else {
          user.friends = [];
        }

        // Ensure required fields
        user.viewedProfile = user.viewedProfile || 0;
        user.impressions = user.impressions || 0;
        user.email = user.email?.toLowerCase().trim();
        user.firstName = user.firstName?.trim();
        user.lastName = user.lastName?.trim();

        await user.save();
        userCount++;
      } catch (err) {
        console.error(`Failed to migrate user ${user._id}:`, err);
      }
    }
    console.log(`Migrated ${userCount} users`);

    // Migrate posts
    console.log("Migrating posts...");
    const posts = await Post.find();
    let postCount = 0;

    for (const post of posts) {
      try {
        // Convert userId to ObjectId if needed
        if (typeof post.userId === "string") {
          post.userId = mongoose.Types.ObjectId.isValid(post.userId)
            ? mongoose.Types.ObjectId(post.userId)
            : mongoose.Types.ObjectId();
        }

        // Convert likes to Map if needed
        if (!(post.likes instanceof Map)) {
          post.likes = new Map(
            Object.entries(post.likes || {}).filter(([key]) =>
              mongoose.Types.ObjectId.isValid(key)
            )
          );
        }

        // Structure comments properly
        post.comments = (post.comments || []).map((comment) => {
          if (typeof comment === "string") {
            return {
              userId: post.userId,
              text: comment.trim(),
              createdAt: post.createdAt || new Date(),
            };
          }
          return {
            ...comment,
            text: comment.text?.trim() || "",
            createdAt: comment.createdAt || new Date(),
          };
        });

        await post.save();
        postCount++;
      } catch (err) {
        console.error(`Failed to migrate post ${post._id}:`, err);
      }
    }
    console.log(`Migrated ${postCount} posts`);

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGINT", () => {
  console.log("Migration interrupted");
  process.exit(1);
});

migrateData().catch((err) => {
  console.error("Unhandled error during migration:", err);
  process.exit(1);
});
