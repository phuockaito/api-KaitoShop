const express = require("express");
const upload = require('../multer');
const router = express.Router();

const adminControl = require('../Controllers/Admin.Controllers');
const { verifyAccessToken } = require('../helpers/jwt_helpers');
// ----------------------------products-----------------------
router.get('/list-product', adminControl.LIST_PRODUCT);
router.post('/add-product', upload.array('poster'), verifyAccessToken, adminControl.ADD_PRODUCTS);
router.put('/update-product', upload.array('poster'), verifyAccessToken, adminControl.UPDATE_PRODUCT);
router.delete('/delete-product', verifyAccessToken, adminControl.DELETE_PRODUCTS);
router.get('/get-comments-product', verifyAccessToken, adminControl.GET_COMMENTS_PRODUCT);
//----------------------------Cart----------------------------
router.post('/messages-cart', verifyAccessToken, adminControl.MESSAGES_CART_ERROR)
router.delete('/delete-cart', verifyAccessToken, adminControl.DELETE_CART);
router.put('/check-out-cart', verifyAccessToken, adminControl.CHECK_OUT_CARD);
router.get('/get-cart', verifyAccessToken, adminControl.LIST_CART);
//----------------------------User----------------------------
router.get('/get-users', verifyAccessToken, adminControl.GET_USER);
router.get('/get-list-comments-user', verifyAccessToken, adminControl.LIST_COMMENTS_USERS);
router.delete('/delete-comments-user', verifyAccessToken, adminControl.DELETE_COMMENT_USERS);
router.delete('/delete-account-user', verifyAccessToken, adminControl.DELETE_ACCOUNT_USER);
router.get('/get-list-cart-user', verifyAccessToken, adminControl.LIST_CART_USERS);
router.post('/active-role-user', verifyAccessToken, adminControl.ACTIVE_ROLE);
router.delete('/delete-all-cart', verifyAccessToken, adminControl.DELETE_ALL_CART);
module.exports = router;