import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
  const { isAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleRegister = async (data) => {
    data.phone = `+91${data.phone}`;
    await axios
      .post("http://localhost:4000/api/v1/volunteer/register", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        navigateTo(`/otp-verification/${data.email}/${data.phone}`);
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  return (
    <>
      <div>
        <form
          className="auth-form"
          onSubmit={handleSubmit((data) => handleRegister(data))}
        >
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Name"
            required
            {...register("name")}
          />
          <input
            type="email"
            placeholder="Email"
            required
            {...register("email")}
          />
          <div>
            <span>+91</span>
            <input
              type="number"
              placeholder="Phone"
              required
              {...register("phone")}
            />
          </div>
          <input
            type="password"
            placeholder="Password"
            required
            {...register("password")}
          />

          {/* Hidden input fields */}
        <input type="hidden" value="xnnc" {...register("guardian")} />
        <input type="hidden" value="hjfgisijofggkl" {...register("address")} />
        <input
          type="hidden"
          value="2025-01-17T05:03:19.101Z"
          {...register("dob")}
        />
        <input type="hidden" value="String" {...register("gender")} />
        <input type="hidden" value="String" {...register("image")} />
        <input type="hidden" value="String" {...register("undertaking")} />
        <input
          type="hidden"
          value="String"
          {...register("policeVerification")}
        />
        <input
          type="hidden"
          value="String"
          {...register("educationQualification")}
        />

          <div className="verification-method">
            <p>Select Verification Method</p>
            <div className="wrapper">
              <label>
                <input
                  type="radio"
                  name="verificationMethod"
                  value={"email"}
                  {...register("verificationMethod")}
                  required
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  name="verificationMethod"
                  value={"phone"}
                  {...register("verificationMethod")}
                  required
                />
                Phone
              </label>
            </div>
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </>
  );
};

export default Register;