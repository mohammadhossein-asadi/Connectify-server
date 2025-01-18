import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { clearCache } from "../middleware/cache.js";

// CREATE
export const createPost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, description, picturePath } = req.body;

    // Add timeout to database query
    const user = await User.findById(userId)
      .select("firstName lastName location picturePath")
      .lean()
      .maxTimeMS(5000); // 5 second timeout

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: description?.trim(),
      userPicturePath: user.picturePath,
      picturePath,
      likes: new Map(),
      comments: [],
    });

    await Promise.race([
      newPost.save({ session }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 5000)
      ),
    ]);

    await session.commitTransaction();

    // Get latest posts with timeout
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .maxTimeMS(5000);

    res.status(201).json(posts);
  } catch (err) {
    await session.abortTransaction();
    console.error("Create post error:", err);
    res.status(500).json({ message: "Failed to create post" });
  } finally {
    session.endSession();
  }
};

// READ
export const getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Add timeout and error handling
    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .maxTimeMS(5000),
      Post.countDocuments().maxTimeMS(3000),
    ]);

    res.status(200).json({
      posts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (err) {
    console.error("Get feed posts error:", err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Post.countDocuments({ userId });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ message: "Failed to get user posts" });
  }
};

// UPDATE
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Add pagination helper
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
