const express = require("express");
const router = express.Router();

const ProductControllers = require('../Controllers/Products.Controllers');

router.get("/get-product", ProductControllers.GET_PRODUCTS);
router.get("/type", ProductControllers.TYPES_PRODUCT);
router.get('/nsx', ProductControllers.NSX);
router.get("/get-one-product", ProductControllers.GET_ID);

module.exports = router;
