import { Request, Response } from "express";
import UserModel from "../users/user.model.js";
import MessageModel from "./message.model.js";
import { FriendRequest } from "@veoveo/shared";
import mongoose from "mongoose";
import { io } from "../../app.js";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const userId = (req as any).id;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await UserModel.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email selectedAvatar bio socialLinks")
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId)
      .select(
        "name email selectedAvatar bio socialLinks friends friendRequests recommendations"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retornamos un objeto de perfil público
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      selectedAvatar: user.selectedAvatar,
      bio: user.bio,
      socialLinks: user.socialLinks,
      stats: {
        friendsCount: (user.friends || []).length,
        recommendationsCount: (user.recommendations || []).length,
      },
    };

    res.json(profile);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const { toId } = req.body;
    const fromId = (req as any).id;

    if (toId === fromId) {
      return res.status(400).json({ message: "Cannot add yourself" });
    }

    const toUser = await UserModel.findById(toId);
    const fromUser = await UserModel.findById(fromId);

    if (!toUser || !fromUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    if (fromUser.friends.includes(toId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already exists
    const existingRequest = toUser.friendRequests.find(
      (r) => r.from.toString() === fromId && r.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Request already pending" });
    }

    // Add to receiver's requests
    toUser.friendRequests.push({
      from: fromId,
      status: "pending",
      createdAt: new Date(),
      isRead: false,
    });

    // Add to sender's sent requests
    fromUser.sentRequests.push({
      to: toId,
      status: "pending",
      createdAt: new Date(),
    });

    await toUser.save();
    await fromUser.save();

    // Emit event to recipient if online
    io.to(String(toId)).emit("friend-request-received", { fromId });

    res.json({ message: "Request sent" });
  } catch (error) {
    res.status(500).json({ message: "Error sending request" });
  }
};

export const respondToFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId, status, action } = req.body;
    const finalStatus = status || action;
    const userId = (req as any).id;

    if (!finalStatus || !["accepted", "rejected"].includes(finalStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const requestIndex = user.friendRequests.findIndex(
      (r) => r._id?.toString() === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = user.friendRequests[requestIndex];
    const fromId = request.from;

    if (finalStatus === "accepted") {
      // Add to each other's friends list
      if (!user.friends.includes(fromId)) {
        user.friends.push(fromId);
      }
      const fromUser = await UserModel.findById(fromId);
      if (fromUser && !fromUser.friends.includes(userId)) {
        fromUser.friends.push(userId);
        // Find and update the sender's sent request
        const sentRequest = fromUser.sentRequests.find(
          (r) => r.to.toString() === userId
        );
        if (sentRequest) sentRequest.status = "accepted";
        await fromUser.save();
      }
    }

    request.status = finalStatus;
    await user.save();

    // Emit event to sender
    io.to(String(fromId)).emit("friend-request-response", {
      status: finalStatus,
    });

    res.json({ message: `Request ${finalStatus}` });
  } catch (error) {
    res.status(500).json({ message: "Error responding to request" });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    const userId = (req as any).id;

    const user = await UserModel.findById(userId);
    const friend = await UserModel.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from both lists
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await user.save();
    await friend.save();

    // Auto-delete chat on unfriend
    await MessageModel.deleteMany({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    });

    res.json({ message: "Friend removed and chat deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error removing friend" });
  }
};

export const getSocialData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const user = await UserModel.findById(userId)
      .populate(
        "friends",
        "name email selectedAvatar bio socialLinks publicKey"
      )
      .populate("friendRequests.from", "name email selectedAvatar")
      .populate("sentRequests.to", "name email selectedAvatar")
      .populate("recommendations.from", "name email selectedAvatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Count unread messages
    const unreadMessagesCount = await MessageModel.countDocuments({
      to: userId,
      read: false,
    });

    res.json({
      friends: user.friends,
      requests: user.friendRequests,
      sentRequests: user.sentRequests,
      recommendations: user.recommendations,
      unreadMessagesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting social data" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const { bio, socialLinks, name, publicKey } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }
    if (publicKey !== undefined) user.publicKey = publicKey;

    await user.save();
    res.json({
      message: "Profile updated",
      user: {
        name: user.name,
        bio: user.bio,
        socialLinks: user.socialLinks,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const fromId = (req as any).id;
    const { toId, content, encryptedKey, iv } = req.body;

    if (!toId || !content) {
      return res
        .status(400)
        .json({ message: "Recipient and content are required" });
    }

    const message = new MessageModel({
      from: fromId,
      to: toId,
      content,
      encryptedKey,
      iv,
      createdAt: new Date(),
    });

    await message.save();

    // Emit real-time message to recipient and sender
    io.to(String(toId)).emit("new-message", message);
    io.to(String(fromId)).emit("new-message", message);

    res.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const { friendId } = req.params;

    const messages = await MessageModel.find({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error getting messages" });
  }
};

export const recommendMedia = async (req: Request, res: Response) => {
  try {
    const { toId, mediaId, mediaType, mediaTitle, mediaPoster, message } =
      req.body;
    const fromId = (req as any).id;

    const toUser = await UserModel.findById(toId);
    if (!toUser) return res.status(404).json({ message: "User not found" });

    toUser.recommendations.push({
      from: fromId,
      mediaId,
      mediaType,
      mediaTitle,
      mediaPoster,
      message,
      createdAt: new Date(),
      isRead: false,
    } as any);

    await toUser.save();
    res.json({ message: "Recommendation sent" });
  } catch (error) {
    res.status(500).json({ message: "Error recommending media" });
  }
};

export const markNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Mark all pending requests and recommendations as read
    user.friendRequests.forEach((r) => {
      r.isRead = true;
    });
    user.recommendations.forEach((r) => {
      r.isRead = true;
    });

    await user.save();
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking notifications as read" });
  }
};

export const getPublicKey = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    const friend = await UserModel.findById(friendId).select("publicKey");
    if (!friend) return res.status(404).json({ message: "User not found" });
    res.json({ publicKey: friend.publicKey });
  } catch (error) {
    res.status(500).json({ message: "Error getting public key" });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const { friendId } = req.params;

    await MessageModel.deleteMany({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting chat" });
  }
};
