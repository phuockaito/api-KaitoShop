const express = require("express");
const router = express.Router();

const UserControllers = require('../Controllers/User.Controllers');
const upload = require('../multer');
const { verifyAccessToken } = require('../helpers/jwt_helpers');


router.post('/register', UserControllers.REGISTER);
router.post('/change-password', verifyAccessToken, UserControllers.CHANGE_PASSWORD);
router.post('/login', UserControllers.LOGIN);
router.post("/google-login", UserControllers.LOGIN_GOOGLE);
router.get('/profile', verifyAccessToken, UserControllers.PROFILE);
router.post('/refresh-token', UserControllers.REFRESH_TOKEN);
router.put("/update-image", upload.single('avatar'), verifyAccessToken, UserControllers.UPDATE_IMAGE_USER);
router.put("/update-information", verifyAccessToken, UserControllers.INFORMATION);
router.post("/active-email", UserControllers.ACTIVE_EMAIL);
router.post('/forgot-password', UserControllers.FORGOT_PASSWORD);
router.put('/reset-password', UserControllers.RESET_PASSWORD);
module.exports = router;
