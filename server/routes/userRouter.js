import express from "express";
import {
  register,
  sendEmailOTP,
  verifyEmailOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  // generateTemporaryRegNumber,
  // approveEmail,
  getVolunteersDropdown,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { upload } from "../multer/upload.js";

const router = express.Router();

router.post("/send-email-otp", sendEmailOTP); //OTP for email verification

router.post("/verify-email-otp", verifyEmailOTP); //Verify OTP for email verification

// router.post("/generate-temp-reg", generateTemporaryRegNumber); //Generate temporary registration number

// router.get('/approve', approveEmail) //Approve email

router.get("/volunteers", getVolunteersDropdown); //All volunteers for the dropdown

router.post(
  "/register",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "undertaking", maxCount: 1 },
    { name: "policeVerification", maxCount: 1 },
    { name: "educationQualification", maxCount: 1 },
    { name: "bankPassbook", maxCount: 1 },
    { name: "pwdCertificate", maxCount: 1 },
    { name: "bplCertificate", maxCount: 1 },
  ]),
  register
);
router.post("/login", login); //Login user

router.get("/logout", isAuthenticated, logout); //Logout user

router.get("/me", isAuthenticated, getUser); //Get user information

router.post("/forgot-password", forgotPassword); //Forgot password

router.put("/reset-password/:token", resetPassword); //Reset password with token

export default router;