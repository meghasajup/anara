import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Admin } from "../models/adminModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { adminToken } from "../utils/adminToken.js";
import crypto from "crypto";
import { User } from "../models/userModel.js";
import { Volunteer } from "../models/volunteerModel.js";

//Register
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  console.log("Request received:", req.body);

  if (!name || !email || !phone || !password) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  function validatePhoneNumber(phone) {
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number.", 400));
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingAdmin) {
    return next(new ErrorHandler("Phone or Email is already used.", 400));
  }

  const registrationAttemptsByAdmin = await Admin.countDocuments({
    $or: [{ phone }, { email }],
  });

  if (registrationAttemptsByAdmin > 3) {
    return next(
      new ErrorHandler(
        "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
        400
      )
    );
  }

  const newAdmin = await Admin.create({ name, email, phone, password });

  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    admin: newAdmin,
  });
});





//Login
export const login = catchAsyncError(async (req, res, next) => {
  console.log(req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required.", 400));
  }

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  adminToken(admin, 200, "admin logged in successfully.", res);
});





//Logout
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});





//GetAdmin
export const getadmin = catchAsyncError(async (req, res, next) => {
  const admin = req.admin;
  res.status(200).json({
    success: true,
    admin,
  });
});





//Forgot Password
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const admin = await Admin.findOne({
    email: req.body.email,
  });

  if (!admin) {
    return next(new ErrorHandler("Admin not found.", 404));
  }

  // Generate reset password token
  const resetToken = admin.generateResetPasswordToken();
  await admin.save({ validateBeforeSave: false });

  // Create reset password URL
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  // Message to be sent to the user
  const message = `Your Reset Password Token is: \n\n ${resetPasswordUrl} \n\n If you did not request this, please ignore this email.`;

  try {
    // Send email
    await sendEmail({
      email: admin.email,
      subject: "MERN Authentication App - Reset Password",
      message,
    });
    
    res.status(200).json({
      success: true,
      message: `Reset password email sent to ${admin.email}.`,
    });
  } catch (error) {
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Cannot send reset password token.", 500));
  }
});





//Reset Password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ErrorHandler("Token is missing.", 400));
  }

  // Hash the token from the URL to match with the stored token in the database
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const admin = await Admin.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }, // Ensure token has not expired
  });

  if (!admin) {
    return next(new ErrorHandler("Reset password token is invalid or has expired.", 400));
  }

  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Password and confirm password are required.", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  // Update password and remove reset token from database
  admin.password = password;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpire = undefined;

  await admin.save();

  // Send success response and token
  adminToken(admin, 200, "Password reset successfully.", res);
});





//Get all volunteers in Admin Dashboard
export const getAllVolunteers = catchAsyncError(async (req, res, next) => {
  try {
    // Fetch all volunteers
    const volunteers = await Volunteer.find({});

    // Combine the results into a single response
    res.status(200).json({
      success: true,
      volunteers,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch volunteers.", 500));
  }
});





//Get all users in Admin Dashboard
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  try {

    // Fetch all users
    const users = await User.find({});

    // Combine the results into a single response
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch volunteers and users.", 500));
  }
});





// Count of users and volunteers
export const CountVolunteersAndUsers = catchAsyncError(async (req, res, next) => {
  try {
    // Get count of volunteers
    const volunteerCount = await Volunteer.countDocuments();

    // Get count of users
    const userCount = await User.countDocuments();

    // Return the counts
    res.status(200).json({
      success: true,
      volunteerCount,
      userCount,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch volunteer and user counts.", 500));
  }
});
