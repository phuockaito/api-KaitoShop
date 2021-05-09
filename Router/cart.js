const express = require("express");
const router = express.Router();

const AuthorController = require('../Controllers/Cart.Controllers');
const JWT_HEADER = require('../helpers/jwt_helpers');

router.post('/add-cart', JWT_HEADER.verifyAccessToken, AuthorController.ADD_CART);
router.get('/get-cart', JWT_HEADER.verifyAccessToken, AuthorController.GET_CART);
router.delete('/delete-cart', JWT_HEADER.verifyAccessToken, AuthorController.DELETE_CART);
router.put('/update-address', JWT_HEADER.verifyAccessToken, AuthorController.UPDATE_ADDRESS);
router.put('/update-status-order', JWT_HEADER.verifyAccessToken, AuthorController.STATUS_ORDER);

module.exports = router;