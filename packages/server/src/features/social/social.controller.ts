import { Request, Response } from "express";
import UserModel from "../users/user.model";
import MessageModel from "./message.model";
import { FriendRequest } from "@veoveo/shared";
import mongoose from "mongoose";
import { io } from "../../app";

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
      return res
        .status(400)
        .json({ message: "Valid status or action is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find the request in incoming friendRequests
    const requestIndex = user.friendRequests.findIndex(
      (r) =>
        (r as any)._id?.toString() === requestId || (r as any).id === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = user.friendRequests[requestIndex];
    const fromUserId = request.from.toString();

    // Update status in receiver's document
    user.friendRequests[requestIndex].status = finalStatus;

    const fromUser = await UserModel.findById(fromUserId);
    if (fromUser) {
      // Find and update the status in sender's sentRequests
      const sentRequestIndex = fromUser.sentRequests.findIndex(
        (r) => r.to.toString() === userId
      );
      if (sentRequestIndex !== -1) {
        fromUser.sentRequests[sentRequestIndex].status = finalStatus;
      }

      if (finalStatus === "accepted") {
        if (!user.friends.map((f) => f.toString()).includes(fromUserId)) {
          user.friends.push(fromUserId as any);
        }
        if (!fromUser.friends.map((f) => f.toString()).includes(userId)) {
          fromUser.friends.push(userId as any);
        }
      }
      await fromUser.save();
    }

    await user.save();

    // Emit to sender about the response
    io.to(String(fromUserId)).emit("friend-request-response", {
      requestId,
      status: finalStatus,
    });

    res.json({ message: `Request ${finalStatus}` });
  } catch (error) {
    console.error("Error in respondToFriendRequest:", error);
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

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing friend" });
  }
};

export const getSocialData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const user = await UserModel.findById(userId)
      .populate("friends", "name email selectedAvatar bio socialLinks")
      .populate("friendRequests.from", "name email selectedAvatar")
      .populate("sentRequests.to", "name email selectedAvatar")
      .populate("recommendations.from", "name email selectedAvatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      friends: user.friends,
      requests: user.friendRequests,
      sentRequests: user.sentRequests,
      recommendations: user.recommendations,
    });
  } catch (error) {
    console.error("Error in getSocialData:", error);
    res.status(500).json({ message: "Error getting social data" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const { bio, socialLinks, name } = req.body;

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

    await user.save();
    res.json({
      message: "Profile updated",
      user: { name: user.name, bio: user.bio, socialLinks: user.socialLinks },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const fromId = (req as any).id;
    const { toId, content } = req.body;

    if (!toId || !content) {
      return res
        .status(400)
        .json({ message: "Recipient and content are required" });
    }

    const message = new MessageModel({
      from: fromId,
      to: toId,
      content,
      createdAt: new Date(),
    });

    await message.save();

    // Emit real-time message to recipient and sender
    io.to(String(toId)).emit("new-message", message);
    io.to(String(fromId)).emit("new-message", message);

    res.json(message);
  } catch (error) {
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
