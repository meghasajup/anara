import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Admin } from "../models/adminModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import twilioClient from "../utils/twilio.js";
import crypto from "crypto";
import twilio from "twilio";

console.log("Twilio SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Twilio Token:", process.env.TWILIO_AUTH_TOKEN);

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
console.log("client:", client);

export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return next(new ErrorHandler("All fields are required.", 400));
    }
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91\d{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    const existingadmin = await Admin.findOne({
      $or: [
        {
          email,
        },
        {
          phone,
        },
      ],
    });

    if (existingadmin) {
      return next(new ErrorHandler("Phone or Email is already used.", 400));
    }

    const registerationAttemptsByadmin = await Admin.find({
      $or: [{ phone }, { email }],
    });

    if (registerationAttemptsByadmin.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    const adminData = {
      name,
      email,
      phone,
      password,
    };
    console.log(" adminData", adminData);
    const admin = await Admin.create(adminData);
    await admin.save();
  } catch (error) {
    next(error);
  }
});

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
  sendToken(admin, 200, "admin logged in successfully.", res);
});

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

export const getadmin = catchAsyncError(async (req, res, next) => {
  const admin = req.admin;
  res.status(200).json({
    success: true,
    admin,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const admin = await Admin.findOne({
    email: req.body.email,
  });
  if (!admin) {
    return next(new ErrorHandler("admin not found.", 404));
  }
  const resetToken = admin.generateResetPasswordToken();
  await admin.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your Reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    sendEmail({
      email: admin.email,
      subject: "MERN AUTHENTICATION APP RESET PASSWORD",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${admin.email} successfully.`,
    });
  } catch (error) {
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token.",
        500
      )
    );
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const admin = await Admin.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!admin) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & confirm password do not match.", 400)
    );
  }

  admin.password = req.body.password;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpire = undefined;
  await admin.save();

  sendToken(admin, 200, "Reset Password Successfully.", res);
});
