const express = require("express");
const Product = require("../Model/Product");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const keyword = req.query.keyword.toLowerCase().trim() || '';
    const page = parseInt(req.query.page) || 1;
    const items = parseInt(req.query.items) || 20;
    const start = (page - 1) * items;
    const end = start + items;
    const product = await Product.find({
      $or: [
        { name: { $regex: `${keyword}.*` } },
        { key: { $regex: `${keyword}.*` } },
        { description: { $regex: `${keyword}.*` } },
        { productType: { $regex: `${keyword}.*` } },
        { collections: { $regex: `${keyword}.*` } },
        { NSX: { $regex: `${keyword}.*` } }
      ]
    });
    const resultProducts = product.slice(start, end);
    res.status(200).json({
      page: page,
      start: start,
      end: end,
      lengthProducts: product.length,
      data: resultProducts,
    })
  } catch (error) {
    res.send(error)
  }
});


module.exports = router;