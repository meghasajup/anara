import express from "express";
import {
  register,
  login,
  logout,
  getadmin,
  forgotPassword,
  resetPassword,
} from "../controllers/adminController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);  // connect to add admin button 
router.post("/login", login); // admin login page
router.get("/logout", isAuthenticated, logout); // logout button
router.get("/me", isAuthenticated, getadmin);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

export default router;
