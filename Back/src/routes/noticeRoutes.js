import { Router } from "express";
import { NoticeController } from "../controllers/noticeController.js";
import { checkRole } from "../middlewares/checkRoles.js";
import { authMiddleware } from "../utils/auth.js";

const router = Router();
const noticeController = new NoticeController();

router.get("/user/:userId",  noticeController.getAllNotices);
router.get("/area/:areaId",  noticeController.getNoticesByArea);
router.get("/:id",  noticeController.getNoticeById);
router.put("/:id", authMiddleware, checkRole("admin"), noticeController.updateNotice);
router.delete("/:id", authMiddleware, checkRole("admin"), noticeController.deleteNotice);

export default router;