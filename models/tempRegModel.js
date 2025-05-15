import mongoose from "mongoose";

//User temp reg
const usertempRegSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  tempRegNumber: {
    type: String,
    required: true,
    unique: true
  },
});

export const userTempReg = mongoose.model("userTempReg", usertempRegSchema);

//Volunteer temp reg 
const volunteertempRegSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  tempRegNumber: {
    type: String,
    required: true,
    unique: true
  },
});

export const volunteerTempReg = mongoose.model("volunteerTempReg", volunteertempRegSchema);