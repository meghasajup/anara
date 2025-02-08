import express from "express";
import {
  sendEmailOTP,
  verifyOTP,
  generateTemporaryRegNumber,
  register,
  login,
  logout,
  getvolunteer,
  forgotPassword,
  resetPassword
} from "../controllers/volunteerController.js";
import { isVolunteerAuthenticated } from "../middlewares/authVolunteer.js";
import { upload } from "../multer/upload.js";

const router = express.Router();

// Route for sending OTP for email verification
router.post("/send-email-otp", sendEmailOTP);

// Route for verifying email OTP
router.post("/otp-verification", verifyOTP);

//Route for temporary registration number
router.post("/generate-temp-reg", generateTemporaryRegNumber);

// Route for user registration
router.post("/register", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "undertaking", maxCount: 1 },
  { name: "policeVerification", maxCount: 1 },
  { name: "educationQualification", maxCount: 1 },
  { name: "bankDocument", maxCount: 1 },
]), register);

// Route for user login
router.post("/login", login);

// Route for user logout
router.get("/logout", isVolunteerAuthenticated, logout);

// Route for getting user information
router.get("/me", isVolunteerAuthenticated, getvolunteer);

// Route for forgot password
router.post("/password/forgot", forgotPassword);

// Route for resetting password
router.put("/password/reset/:token", resetPassword);

export default router;