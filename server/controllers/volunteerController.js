import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Volunteer } from "../models/volunteerModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { volunteerToken } from "../utils/volunteerToken.js";
import crypto from "crypto";

const otpStore = new Map();

// Send email OTP
export const sendEmailOTP = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const volunteer = await Volunteer.findOne({ email });
  if (volunteer) {
    return next(new ErrorHandler("Email is already registered.", 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(email, { otp, otpExpire });

  try {
    const message = `
      <div style='font-family: Arial, sans-serif;'>
        <h1>Your OTP for Email Verification</h1>
        <p>Please use the following OTP to verify your email:</p>
        <h2>${otp}</h2>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `;
    await sendEmail({ email, subject: "Email Verification OTP", message });
    res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    return next(new ErrorHandler("Failed to send OTP.", 500));
  }
});

// Verify OTP
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Email and OTP are required.", 400));
  }

  const storedOtpData = otpStore.get(email);

  if (!storedOtpData) {
    return next(new ErrorHandler("OTP not found or expired.", 400));
  }

  const { otp: storedOtp, otpExpire } = storedOtpData;

  if (Date.now() > otpExpire) {
    otpStore.delete(email);
    return next(new ErrorHandler("OTP Expired.", 400));
  }

  if (parseInt(otp) !== storedOtp) {
    return next(new ErrorHandler("Invalid OTP.", 400));
  }

  otpStore.set(email, { verified: true });

  res.status(200).json({ success: true, message: "Email verified successfully." });
});

// Generate Temporary Registration Number
// Generate Temporary Registration Number
export const generateTemporaryRegNumber = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const storedOtpData = otpStore.get(email);

  if (!storedOtpData || !storedOtpData.verified) {
    return next(new ErrorHandler("Email not verified. Please verify your email first.", 400));
  }

  let tempRegNumber;
  let isUnique = false;

  // Generate a unique Temporary Registration Number
  while (!isUnique) {
    const volunteerCount = await Volunteer.countDocuments();
    const nextNumber = volunteerCount + 1;
    tempRegNumber = `T/ASF/FE/${String(nextNumber).padStart(5, '0')}`;

    const existingVolunteer = await Volunteer.findOne({ tempRegNumber });
    isUnique = !existingVolunteer;
  }

  otpStore.set(email, { ...storedOtpData, tempRegNumber });

  const message = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Temporary Registration Number</h2>
      <p>Your Temporary Registration Number is:</p>
      <h2>${tempRegNumber}</h2>
      <p>Use this number for further verification.</p>
    </div>
  `;

  try {
    await sendEmail({ email, subject: "Temporary Registration Number", message });
    res.status(200).json({ success: true, message: "Temporary Registration Number assigned successfully.", tempRegNumber });
  } catch (error) {
    return next(new ErrorHandler("Failed to send Temporary Registration Number.", 500));
  }
});



// Register
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, password, guardian, address, dob, gender } = req.body;

  if (!name || !email || !phone || !password || !guardian || !address || !dob || !gender) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  if (!req.files || !req.files.image || !req.files.undertaking || !req.files.policeVerification || !req.files.educationQualification || !req.files.bankDocument) {
    return next(new ErrorHandler("All required documents must be uploaded.", 400));
  }

  const emailExists = await Volunteer.findOne({ email });
  const phoneExists = await Volunteer.findOne({ phone });

  if (emailExists || phoneExists) {
    return next(new ErrorHandler("Email or phone is already registered.", 400));
  }

  const storedOtpData = otpStore.get(email);

  if (!storedOtpData) {
    return next(new ErrorHandler("Email verification incomplete. Please complete OTP verification.", 400));
  }

  if (!storedOtpData.tempRegNumber) {
    return next(new ErrorHandler("Temporary Registration Number not generated. Please generate it before registration.", 400));
  }

  // Ensure unique tempRegNumber
  const tempRegNumberExists = await Volunteer.findOne({ tempRegNumber: storedOtpData.tempRegNumber });
  if (tempRegNumberExists) {
    otpStore.delete(email);
    return next(new ErrorHandler("Duplicate regNumber detected. Please try again.", 400));
  }

  const volunteer = await Volunteer.create({
    name,
    email,
    phone,
    password,
    guardian,
    address,
    dob,
    gender,
    image: req.files.image[0].path,
    undertaking: req.files.undertaking[0].path,
    policeVerification: req.files.policeVerification[0].path,
    educationQualification: req.files.educationQualification[0].path,
    bankDocument: req.files.bankDocument[0].path,
    accountVerified: true,
    tempRegNumber: storedOtpData.tempRegNumber,
  });

  otpStore.delete(email);

  res.status(201).json({
    success: true,
    message: "Volunteer registered successfully.",
    volunteer,
  });
});



// Login
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required.", 400));
  }

  const volunteer = await Volunteer.findOne({ email }).select("+password");

  if (!volunteer || !volunteer.accountVerified) {
    return next(new ErrorHandler("Account not verified. Please verify your email first.", 400));
  }

  const isPasswordMatched = await volunteer.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  volunteerToken(volunteer, 200, "Volunteer logged in successfully.", res);
});

// Logout
export const logout = catchAsyncError(async (req, res, next) => {
  res.status(200).cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
  }).json({ success: true, message: "Logged out successfully." });
});

// Forgot Password
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const volunteer = await Volunteer.findOne({ email: req.body.email, accountVerified: true });
  if (!volunteer) {
    return next(new ErrorHandler("Volunteer not found.", 404));
  }
  const resetToken = volunteer.generateResetPasswordToken();
  await volunteer.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `
    <div style='font-family: Arial, sans-serif;'>
      <h2>Password Reset Request</h2>
      <p>Reset your password using the link below:</p>
      <p>${resetPasswordUrl}</p>
    </div>
  `;

  try {
    await sendEmail({ email: volunteer.email, subject: "Reset Password", message });
    res.status(200).json({ success: true, message: `Email sent to ${volunteer.email} successfully.` });
  } catch (error) {
    volunteer.resetPasswordToken = undefined;
    volunteer.resetPasswordExpire = undefined;
    await volunteer.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Cannot send reset password token.", 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  const volunteer = await Volunteer.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!volunteer) {
    return next(new ErrorHandler("Reset password token is invalid or has expired.", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password and confirm password do not match.", 400));
  }
  volunteer.password = req.body.password;
  volunteer.resetPasswordToken = undefined;
  volunteer.resetPasswordExpire = undefined;
  await volunteer.save();
  volunteerToken(volunteer, 200, "Reset Password Successfully.", res);
});

// Get Volunteer
export const getvolunteer = catchAsyncError(async (req, res, next) => {
  const volunteer = req.volunteer;
  res.status(200).json({ success: true, volunteer });
});
