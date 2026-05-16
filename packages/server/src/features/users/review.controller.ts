import UserModel from "../users/user.model.js";
import { Request, Response } from "express";

export async function upsertReview(req: Request, res: Response) {
  try {
    const { id } = req;
    const { mediaId, mediaType, rating, comment } = req.body;

    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const reviewIndex = user.reviews.findIndex(
      (r) => r.mediaId === mediaId && r.mediaType === mediaType
    );

    if (reviewIndex > -1) {
      user.reviews[reviewIndex].rating = rating;
      user.reviews[reviewIndex].comment = comment;
      user.reviews[reviewIndex].updatedAt = new Date();
    } else {
      user.reviews.push({
        mediaId,
        mediaType,
        rating,
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await user.save();
    res.json(user.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getUserReviews(req: Request, res: Response) {
  try {
    const { id } = req;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(id).select("reviews").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.reviews || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getReviewByMediaId(req: Request, res: Response) {
  try {
    const { id } = req;
    const { mediaId } = req.params;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(id).select("reviews").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const review = user.reviews?.find((r) => r.mediaId === mediaId);
    res.json(review || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
