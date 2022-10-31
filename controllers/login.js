const axios = require("axios");
const Joi = require("joi");
const userdb = require("../models/user");
const jwt = require("jsonwebtoken");
//====================================== sign up ========================================//
exports.signUp = async (req, res) => {
  try {
    const { body } = req;
    const signUpSchema = Joi.object()
      .keys({
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
      })
      .required();
    const validation = signUpSchema.validate(body);
    if (validation.error) {
      return res
        .status(400)
        .json({ message: validation.error.details[0].message, success: false });
    }
    const isUserAlreadyRegistered = await userdb.findOne({ phone: body.phone });
    if (isUserAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this mobile number.",
      });
    }
    axios
      .get(process.env.SMS_API + req.body.phone + "/AUTOGEN")
      .then((resp) => {
        return res.status(200).json({
          success: true,
          message: "OTP sent sucessfully",
          result: resp.data,
        });
      })
      .catch((er) => {
        return res.status(500).json({
          message: "OTP sent failed",
          error: er.name,
          success: false,
        });
      });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Something went wrong", error: e, success: false });
  }
};
///==========================================verify otp====================================//
exports.signupVerifyOTP = async (req, res) => {
  try {
    const { body } = req;
    const otpSchema = Joi.object()
      .keys({
        details: Joi.string().required(),
        otp: Joi.number().min(100000).max(999999).required(),
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        acknowledgement: Joi.boolean().invalid(false).required(),
      })
      .required();
    const result = otpSchema.validate(body);
    if (result.error) {
      return res
        .status(400)
        .json({ message: result.error.details[0].message, success: false });
    }
    axios
      .get(process.env.SMS_API + "VERIFY/" + body.details + "/" + body.otp)
      .then(async (response) => {
        if (response.data.Details === "OTP Expired") {
          return res
            .status(403)
            .send({ message: "OTP Expired", success: false });
        }
        const createUser = new userdb({
          phone: body.phone,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          acknowledgement: body.acknowledgement,
        });
        createUser
          .save()
          .then((user) => {
            const token = jwt.sign(
              { _id: user._id.toString() },
              process.env.TOKEN_SECRET,
              {
                expiresIn: "24h",
              }
            );
            return res.status(201).json({
              message: "Registered successfully",
              token: token,
              success: true,
            });
          })
          .catch((e) => {
            return res.status(500).json({
              message: "Something bad happened",
              error: e.name,
              success: false,
            });
          });
      })
      .catch((e) => {
        return res
          .status(400)
          .json({ message: "OTP Invalid", error: e.name, success: false });
      });
  } catch (e) {
    return res.status(500).json({
      message: "Something bad happened",
      error: e.name,
      success: false,
    });
  }
};
//===================================================user login========================================//
exports.login = (req, res) => {
  try {
    const { body } = req;
    const loginBodySchema = Joi.object()
      .keys({
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
      })
      .required();
    const validation = loginBodySchema.validate(body);
    if (validation.error) {
      return res
        .status(400)
        .json({ message: validation.error.details[0].message, success: false });
    }
    axios
      .get(process.env.SMS_API + req.body.phone + "/AUTOGEN")
      .then((response) => {
        return res.status(200).json({
          message: "OTP sent successfully",
          data: response.data,
          success: true,
        });
      })
      .catch((er) => {
        return res.status(500).send({ message: er.name, success: false });
      });
  } catch (er) {
    return res.status(500).send({ message: er.name, success: false });
  }
};
//=================================== login verify OTP ========================================//
exports.loginVerifyOTP = async (req, res) => {
  try {
    const { body } = req;
    const otpSchema = Joi.object()
      .keys({
        details: Joi.string().required(),
        otp: Joi.number().min(100000).max(999999).required(),
        phone: Joi.string()
          .regex(/^[6-9]{1}[0-9]{9}$/)
          .required(),
      })
      .required();
    const result = otpSchema.validate(body);
    if (result.error) {
      return res
        .status(400)
        .json({ message: result.error.details[0].message, success: false });
    }
    axios
      .get(process.env.SMS_API + "VERIFY/" + body.details + "/" + body.otp)
      .then(async (response) => {
        if (response.data.Details === "OTP Expired") {
          return res
            .status(403)
            .send({ message: "OTP Expired", success: false });
        }
        const user = await userdb.findOne({ phone: body.phone });
        if (user) {
          const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.TOKEN_SECRET,
            {
              expiresIn: "24h",
            }
          );
          return res.status(200).json({
            message: "Login Successfully",
            token: token,
            success: true,
          });
        }
        return res
          .status(500)
          .json({ message: "Something went wrong", success: false });
      })
      .catch((e) => {
        return res
          .status(400)
          .json({ message: "OTP Invalid", error: e.name, success: false });
      });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};
//=====================================================get profile============================================//
exports.getProfile = async (req, res) => {
  try {
    const user = await userdb.findById(req.user._id, {
      __v: 0,
      acknowledgement: 0,
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    return res.status(200).json({ success: true, result: user });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Something went wrong", error: e.name, success: false });
  }
};
//=============================================== update profile ===========================================//
exports.updateProfile = async (req, res) => {
  try {
    const updateSchema = Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
      })
      .required();
    const result = updateSchema.validate(body);
    if (result.error) {
      return res
        .status(400)
        .json({ message: result.error.details[0].message, success: false });
    }
    const isProfileUpdated = await userdb.findByIdAndUpdate(req.user._id, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
    });
    if (!isProfileUpdated) {
      return res
        .status(500)
        .json({ message: "Something went wrong", success: false });
    }
    return res
      .status(204)
      .json({ message: "Profile updated successfully", success: true });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Something went wrong", error: e.name, success: false });
  }
};
