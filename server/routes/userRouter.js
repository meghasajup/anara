import express from "express";
import {
  register,
  verifyOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { upload } from "../multer/upload.js";

const router = express.Router();

router.post("/register", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "undertaking", maxCount: 1 },
  { name: "policeVerification", maxCount: 1 },
  { name: "educationQualification", maxCount: 1 },
  { name: "bankDocument", maxCount: 1 },
]), register); //register
router.post("/otp-verification", verifyOTP); // verify OTP
router.post("/login", login); // login user
router.get("/logout", isAuthenticated, logout); // logout user
router.get("/me", isAuthenticated, getUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

export default router;