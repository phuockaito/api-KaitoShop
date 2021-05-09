const express = require("express");
const router = express.Router();

const CommentController = require('../Controllers/Comment.Controllers');
const JWT_HEADER = require('../helpers/jwt_helpers');

router.get('/get-comments', CommentController.GET_ID_PRODUCTS);
router.delete('/delete-comments', JWT_HEADER.verifyAccessToken, CommentController.DELETE_ID_COMMENT);
router.get('/history-comments', JWT_HEADER.verifyAccessToken, CommentController.HISTORY_COMMENT);
//-------------------



module.exports = router;