import { Router, Request, Response } from "express";
import bunnyService from "../services/bunnyService.js";

const router = Router();

export const getSignedThumbnail = async (req: Request, res: Response) => {
  try {
    const videoId = String(req.params.videoId);
    const thumbIndex = parseInt(String(req.params.index), 10) || 0;
    const baseUrl = bunnyService.getThumbnailUrl(videoId, thumbIndex);
    const tokenString = bunnyService.generateAdvancedToken(baseUrl);
    const signedUrl = `${baseUrl}?${tokenString}`;
    res.json({ signedUrl });
  } catch (error: any) {
    console.error("Error generating signed thumbnail URL:", error);
    res.status(500).json({ error: "Failed to generate signed thumbnail URL" });
  }
};

router.get("/thumbnail/:videoId", getSignedThumbnail);
router.get("/thumbnail/:videoId/:index", getSignedThumbnail);

export default router;
