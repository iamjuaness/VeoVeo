import { Request, Response } from "express";
import CustomListModel from "./list.model.js";
import UserModel from "../users/user.model.js";

export const createList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const { title, description, items, isPublic } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newList = new CustomListModel({
      userId,
      userName: user.name,
      userAvatar: user.selectedAvatar,
      title,
      description,
      items: items || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      likes: [],
    });

    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error("Error in createList:", error);
    res.status(500).json({ message: "Error creating list" });
  }
};

export const getMyLists = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).id;
    const lists = await CustomListModel.find({ userId }).sort({ updatedAt: -1 });
    res.json(lists);
  } catch (error) {
    console.error("Error in getMyLists:", error);
    res.status(500).json({ message: "Error fetching your lists" });
  }
};

export const getPublicLists = async (req: Request, res: Response) => {
  try {
    const lists = await CustomListModel.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(lists);
  } catch (error) {
    console.error("Error in getPublicLists:", error);
    res.status(500).json({ message: "Error fetching public lists" });
  }
};

export const getListById = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const list = await CustomListModel.findById(listId);
    
    if (!list) return res.status(404).json({ message: "List not found" });
    
    if (!list.isPublic && list.userId.toString() !== (req as any).id) {
      return res.status(403).json({ message: "Private list" });
    }

    res.json(list);
  } catch (error) {
    console.error("Error in getListById:", error);
    res.status(500).json({ message: "Error fetching list" });
  }
};

export const updateList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = (req as any).id;
    const { title, description, items, isPublic } = req.body;

    const list = await CustomListModel.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (title) list.title = title;
    if (description !== undefined) list.description = description;
    if (items) list.items = items;
    if (isPublic !== undefined) list.isPublic = isPublic;

    await list.save();
    res.json(list);
  } catch (error) {
    console.error("Error in updateList:", error);
    res.status(500).json({ message: "Error updating list" });
  }
};

export const deleteList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = (req as any).id;

    const list = await CustomListModel.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    if (list.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await CustomListModel.findByIdAndDelete(listId);
    res.json({ message: "List deleted" });
  } catch (error) {
    console.error("Error in deleteList:", error);
    res.status(500).json({ message: "Error deleting list" });
  }
};

export const toggleLikeList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = (req as any).id;

    const list = await CustomListModel.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    const likeIndex = list.likes.indexOf(userId);
    if (likeIndex > -1) {
      list.likes.splice(likeIndex, 1);
    } else {
      list.likes.push(userId);
    }

    await list.save();
    res.json({ likesCount: list.likes.length, isLiked: ! (likeIndex > -1) });
  } catch (error) {
    console.error("Error in toggleLikeList:", error);
    res.status(500).json({ message: "Error toggling like" });
  }
};
