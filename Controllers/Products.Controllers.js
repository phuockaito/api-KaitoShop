const Product = require("../Model/Product");
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
  }
  sorting() {
    this.query = this.query.sort('-createdAt')
    return this;
  }
}
module.exports = {
  GET_PRODUCTS: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const features = new ApiFeatures(Product.find({}, { __v: 0 }), req.query).sorting();
      const productAll = await Product.find({}, { __v: 0 });
      const lengthProducts = productAll.length;
      const products = await features.query;
      const resultProducts = products.slice(start, end);
      res.status(200).json({
        status: 'success',
        start: start,
        end: end,
        limit: limit,
        length: lengthProducts,
        product: resultProducts
      })
    } catch (error) {
      console.log(error)
    }
  },
  TYPES_PRODUCT: async (req, res) => {
    try {
      const name = req.query.name.trim().toLowerCase() || '';
      const page = parseInt(req.query.page) || 1;
      const sort_price = parseInt(req.query.sort_price) || 0;
      const items = parseInt(req.query.items) || 20;
      const start = (page - 1) * items;
      const end = start + items;
      const product = await Product.find({ key: name }).sort({ price: sort_price });
      // new product
      const features = new ApiFeatures(Product.find({ key: name }), req.query).sorting();
      const productsNew = await features.query;
      const resultProducts = productsNew.slice(start, end);
      if (sort_price === 0) {
        res.status(200).json({
          length: productsNew.length,
          start: start,
          page: page,
          end: end,
          data: resultProducts
        });
      }
      else {
        res.status(200).json({
          length: product.length,
          start: start,
          page: page,
          end: end,
          data: product.slice(start, end),
        });
      };
    } catch (error) {
      console.error(error);
    }
  },
  NSX: async (req, res) => {
    try {
      const nsx = req.query.nsx.replace(/-/g, ' ').trim().toLowerCase() || '';
      const sort_price = parseInt(req.query.sort_price) || 0;
      const page = parseInt(req.query.page) || 1;
      const items = parseInt(req.query.items) || 20;
      const start = (page - 1) * items;
      const end = start + items;
      const product = await Product.find({ NSX: nsx }).sort({ price: sort_price });
      // new product
      const features = new ApiFeatures(Product.find({ NSX: nsx }), req.query).sorting();
      const productsNew = await features.query;
      const resultProducts = productsNew.slice(start, end);
      if (sort_price === 0) {
        res.status(200).json({
          length: productsNew.length,
          start: start,
          page: page,
          end: end,
          data: resultProducts
        });
      }
      else {
        res.status(200).json({
          length: product.length,
          start: start,
          page: page,
          end: end,
          data: product.slice(start, end),
        })
      }
    } catch (error) {
      res.send(error)
    }
  },
  GET_ID: async (req, res) => {
    try {
      const { id } = req.query;
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.status(200).json({
        product: product
      });
    } catch (error) {
      res.status(404).json({
        message: error
      })
    }
  },
};