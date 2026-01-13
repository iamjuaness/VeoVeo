import { Router } from "express";
import { authMiddleware } from "../../core/middleware/authMiddleware.js";
import {
  sendFriendRequest,
  respondToFriendRequest,
  getSocialData,
  recommendMedia,
  searchUsers,
  removeFriend,
  updateProfile,
  getUserProfile,
  sendMessage,
  getMessages,
  markNotificationsAsRead,
  getPublicKey,
  deleteChat,
} from "./social.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getSocialData);
router.get("/search", searchUsers);
router.post("/request", sendFriendRequest);
router.post("/respond", respondToFriendRequest);
router.delete("/friends/:friendId", removeFriend);
router.put("/profile", updateProfile);
router.get("/profile/:userId", getUserProfile);
router.post("/chat", sendMessage);

router.get("/chat/:friendId", getMessages);
router.delete("/chat/:friendId", deleteChat);
router.get("/keys/:friendId", getPublicKey);
router.post("/recommend", recommendMedia);
router.post("/mark-read", markNotificationsAsRead);

export default router;
