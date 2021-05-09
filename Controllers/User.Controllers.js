const createError = require('http-errors')
const mongoose = require("mongoose");
const cloudinary = require('cloudinary');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const sendEmail = require('./sendMail')
const { signRefreshToken, signAccessToken, verilyRefreshToken } = require('../helpers/jwt_helpers');

const {
  MAILING_SERVICE_CLIENT_ID,
  GOOGLE_SECRET,
  CLIENT_URL,
  CLOUD_NAME,
  ACTIVATION_TOKEN_SECRET,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET

} = process.env;


const client = new OAuth2(MAILING_SERVICE_CLIENT_ID);
const Comment = require('../Model/Comment');
const User = require("../Model/User");


cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

module.exports = {
  REGISTER: async (req, res) => {
    try {
      const { email, name, password } = req.body;
      const doseExists = await User.findOne({ email: email });
      if (doseExists) return res.status(400).json({ message: 'tài khoản này tồn tại' });
      if (!password) return res.status(400).json({ message: 'vui lòng điền mật khẩu' });
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = { name, email, password: passwordHash };
      const accessToken = createActivationToken(newUser);
      const url = `${CLIENT_URL}/user/active-email/${accessToken}`;
      sendEmail(email, url, "Click xác nhận địa chỉ email của bạn");
      res.status(200).json({
        message: 'Xác minh địa chỉ email của bạn'
      })
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: error
      });
    }
  },
  LOGIN_GOOGLE: async (req, res) => {
    try {
      const { tokenId } = req.body;
      const verify = await client.verifyIdToken({ idToken: tokenId, audience: MAILING_SERVICE_CLIENT_ID });
      const { email_verified, email, name, picture } = verify.payload;
      if (!email_verified) return res.status(400).json({ msg: "Email verification failed." });
      const user = await User.findOne({ email: email });
      const password = email + GOOGLE_SECRET;
      const passwordHash = await bcrypt.hash(password, 12);
      if (user) {
        const accessToken = await signAccessToken(user._id);
        res.status(200).json({
          user: user,
          accessToken: accessToken
        })
      } else {
        const newUser = new User({
          _id: new mongoose.Types.ObjectId(),
          name,
          email,
          password: passwordHash,
          avatar: picture,
        })
        await newUser.save();
        const users = await User.findOne({ email: email });
        const accessToken = await signAccessToken(users._id);
        res.status(200).json({
          user: users,
          accessToken: accessToken
        })
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: error
      });
    }
  },
  PROFILE: async (req, res) => {
    try {
      const user = await User.findById(req.data.id);
      res.status(200).json({
        user: user
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: error
      });
    }
  },
  LOGIN: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(400).json({ message: ' Tài khoản này không tồn tại' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không đúng' });
      const accessToken = await signAccessToken(user);
      const refreshToken = await signRefreshToken(user);
      const userResult = await User.findById(user._id);
      res.send({
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: userResult
      });
    } catch (error) {
      res.status(400).json({
        message: error
      });
    }
  },
  REFRESH_TOKEN: async (req, res) => {
    try {
      const refreshToken = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const id = await verilyRefreshToken(refreshToken);
      const accessToken = await signAccessToken(id);
      const refToken = await signRefreshToken(id);
      res.send({ accessToken: accessToken, refreshToken: refToken })
    } catch (error) {
      res.status(400).json({
        message: error
      });
    }
  },
  UPDATE_IMAGE_USER: async (req, res) => {
    try {
      const { id } = req.data;
      const options = { new: true };
      const file = req.file;
      cloudinary.v2.uploader.upload(file.path, { folder: 'test' }, async (error, result) => {
        if (result) {
          const userSave = {
            avatar: result.url,
          }
          const update = {
            avatar: result.url,
          }
          const user = await User.findByIdAndUpdate(id, userSave, options);
          const comment = await Comment.updateMany({ id_user: id }, update, options);
          const dataReply = await Comment.find();
          for (let index = 0; index < dataReply.length; index++) {
            const reply = Array.from(dataReply[index].reply);
            if (reply.length > 0) {
              for (let j = 0; j < reply.length; j++) {
                const element = reply[j];
                if (element.id_user === id) {
                  element.avatar = result.url;
                  const id_array = dataReply[index]._id;
                  await Comment.findByIdAndUpdate(id_array, { reply: reply }, options);
                }
              };
            }
          };
          res.json({
            user: user,
            comment: comment,
          })
        }
      })

    } catch (error) {
      res.send(error);
    }
  },
  INFORMATION: async (req, res) => {
    try {
      const { id } = req.data;
      const { name, sex } = req.body;
      const options = { new: true };
      const data = {
        name: name,
        sex: sex
      };
      const user = await User.findByIdAndUpdate(id, data, options);
      const comment = await Comment.updateMany({ id_user: id }, { name: name }, options);
      res.status(200).json({
        status: "update success",
        user: user,
        comment: comment
      })
    } catch (error) {
      console.log('error', error)
    }
  },
  CHANGE_PASSWORD: async (req, res) => {
    try {
      const { id } = req.data;
      const { password } = req.body;
      const result = await User.findById(id);
      if (result) {
        const passwordHash = await bcrypt.hash(password, 12);
        await User.findOneAndUpdate({ _id: id }, { password: passwordHash });
        res.status(200).json({
          message: 'Password has been changed successfully'
        })
      };
    } catch (err) {
      console.log(err)
    }
  },
  ACTIVE_EMAIL: async (req, res) => {
    try {
      const { accessToken } = req.body;
      const user = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET);
      const { email, password, name } = user;
      const checkEmail = await User.findOne({ email: email });
      if (checkEmail) return res.status(400).json({ message: 'tài khoản này tồn tại' });
      const userSave = new User({
        _id: new mongoose.Types.ObjectId(),
        name: name.trim(),
        email: email,
        password: password,
        role: 0
      });
      const result = await userSave.save();
      const token = await signAccessToken(result._id);
      res.status(200).json({
        user: result,
        token
      })
    } catch (error) {
      res.status(400).json({
        message: error
      });
    }
  },
  FORGOT_PASSWORD: async (req, res) => {
    try {
      const { email } = req.body
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(400).json({ msg: "Email không tồn tại" });
      const access_token = createAccessToken({ email: email });
      const url = `${CLIENT_URL}/user/reset-password/${access_token}`
      sendEmail(email, url, "Click Tạo Mật khẩu mới");
      res.json({ msg: "tạo mật khẩu mới, Vui lòng kiểm tra email." })
    } catch (error) {
      res.status(400).json({
        message: error
      });
    }
  },
  RESET_PASSWORD: async (req, res) => {
    try {
      const { password, accessToken } = req.body;
      const result = JWT.verify(accessToken, ACTIVATION_TOKEN_SECRET);
      const user = await User.findOne({ email: result.email });
      if (!password) return res.status(400).json({ msg: "Vui lòng nhập mật khẩu" });
      if (!user) return res.status(400).json({ msg: "tài khoản này không tồn tại" });
      const passwordHash = await bcrypt.hash(password, 12);
      await User.findOneAndUpdate({ email: result.email }, { password: passwordHash });
      const token = await signAccessToken(user._id);
      res.status(200).json({
        user: user,
        token
      })
    } catch (error) {
      res.status(400).json({
        message: error
      });
    };
  }
};
const createAccessToken = (payload) => {
  return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '15m' })
};
const createActivationToken = (payload) => {
  return JWT.sign(payload, ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' })
};