const createError = require('http-errors');
const mongoose = require("mongoose");
const cloudinary = require('../cloudinary');
// model
const User = require('../Model/User');
const Comment = require('../Model/Comment');
const Cart = require('../Model/Cart');
const Product = require("../Model/Product");

const fs = require("fs")
class ApiFeatures {
  constructor(query) {
    this.query = query;
  }
  sortCart() {
    this.query = this.query.sort('-timeCart')
    return this;
  }
  sortProduct() {
    this.query = this.query.sort('-createdAt')
    return this;
  }
  sortUser() {
    this.query = this.query.sort('-createdAt')
    return this;
  }
  sortingComment() {
    this.query = this.query.sort('-timeComment')
    return this;
  }
}
module.exports = {
  // ----------------------------products----------------------
  DELETE_PRODUCTS: async (req, res) => {
    try {
      const { id_product } = req.query;
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      if (user.length > 0) {
        const result = await Product.findByIdAndDelete(id_product);
        res.status(200).json({
          message: 'delete success',
          product: result
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
  UPDATE_PRODUCT: async (req, res) => {
    try {
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      const product = JSON.parse(req.body.product);
      const imageNew = req.files;
      const urls = [];
      const { name, size, price, sex, description, collections, color, productType, key, NSX, imageOld, id_product } = product;
      if (user.length > 0) {
        // check if have image new put img old in image new
        if (imageNew.length > 0) {
          const uploader = async (path) => await cloudinary.uploads(path, 'poster');
          for (const file of imageNew) {
            const { path } = file;
            const newPath = await uploader(path);
            urls.push(newPath);
            fs.unlinkSync(path);
          };
          for (let index = 0; index < imageOld.length; index++) {
            const element = imageOld[index];
            urls.unshift(element);
          }
        }
        const options = { new: true };
        const dataUpdate = {
          name: name.trim(),
          size,
          price,
          sex: sex.trim(),
          poster: urls.length > 0 ? urls : imageOld,
          color,
          description: description.trim(),
          productType: productType.trim(),
          description: description.trim(),
          collections: collections.trim(),
          // numReviews: 0,
          // rating: 0,
          key,
          NSX
        };
        const resultProduct = await Product.findByIdAndUpdate(id_product, dataUpdate, options);
        res.status(200).json({
          message: 'update successful',
          product: resultProduct
        });
      };
    } catch (error) {
      console.log(error)
    }
  },
  ADD_PRODUCTS: async (req, res) => {
    try {
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      const posterData = req.files;
      const product = JSON.parse(req.body.product);
      const urls = [];
      if (user.length > 0) {
        const { name, size, price, sex, description, collections, color, productType, key, NSX } = product;
        const uploader = async (path) => await cloudinary.uploads(path, 'poster');
        for (const file of posterData) {
          const { path } = file;
          const newPath = await uploader(path);
          urls.push(newPath);
          fs.unlinkSync(path);
        };
        const newProduct = new Product({
          _id: new mongoose.Types.ObjectId(),
          name: name.trim(),
          size,
          price,
          sex: sex.trim(),
          poster: urls,
          color,
          description: description.trim(),
          productType: productType.trim(),
          description: description.trim(),
          collections: collections.trim(),
          key,
          NSX
        });
        const result = await newProduct.save()
        res.status(200).json({
          message: 'image upload successful',
          product: result
        });
      }
    } catch (error) {
      console.log(error)
    }
  },
  LIST_PRODUCT: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const features = new ApiFeatures(Product.find(), req.query).sortProduct();
      const products = await features.query;
      const resultProducts = products.slice(start, end);
      const lengthProductsSlice = resultProducts.length;
      const reqProducts = [];
      for (let index = 0; index < lengthProductsSlice; index++) {
        const id_product = resultProducts[index]._id;
        const length_comment = await Comment.find({ id_product: id_product });
        const newProduct = { length_comment: length_comment.length, product: resultProducts[index] };
        reqProducts.push(newProduct);
      }
      res.status(200).json({
        status: 'success',
        start: start,
        end: end,
        limit: limit,
        length: products.length,
        product: reqProducts
      });
    } catch (error) {
      console.log(error);
    }
  },
  GET_COMMENTS_PRODUCT: async (req, res) => {
    try {
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      const { id_product } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const features = new ApiFeatures(Comment.find({ id_product: id_product }), req.query).sortingComment();
      const comment = await features.query;
      const resultComment = comment.slice(start, end);
      if (user.length > 0) {
        res.status(200).json({
          status: 'success',
          start: start,
          end: end,
          limit: limit,
          length: comment.length,
          comment: resultComment
        });
      }
    } catch (error) {
      console.log(error)
    }
  },
  //----------------------------Cart----------------------------
  MESSAGES_CART_ERROR: async (req, res) => {
    try {
      const { id } = req.data;
      const { id_cart } = req.query;
      const user = await User.find({ _id: id, role: 1 });
      const options = { new: true };
      const data = {
        message: req.body.message,
      }
      if (user.length > 0) {
        const resultCart = await Cart.findByIdAndUpdate(id_cart, data, options);
        res.status(200).json({
          message: 'update success',
          cart: resultCart
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
  DELETE_CART: async (req, res) => {
    try {
      const { id_cart } = req.query;
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      if (user.length > 0) {
        const searchCart = await Cart.findById(id_cart);
        if (!searchCart) {
          res.send(createError(404, 'no id cart'));
        }
        const deleteCart = await Cart.findByIdAndDelete(id_cart);
        const cart = await Cart.find({}, {});
        if (!deleteCart) {
          res.send(createError(404, 'no cart'));
        }
        res.status(200).json({
          status: 'delete success',
          cart: deleteCart,
          length: cart.length
        })
      }
    } catch (error) {
      console.log({ error })
    }
  },
  CHECK_OUT_CARD: async (req, res) => {
    try {
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      const { id_cart } = req.query;
      const options = { new: true };
      const data = {
        success: true,
        message: ''
      }
      if (user.length > 0) {
        const result = await Cart.findByIdAndUpdate(id_cart, data, options);
        const id_user = result.id_User;
        const user = await User.findById(id_user, { password: 0 });
        const cart = { cart: result, user: { ...user._doc } };
        res.status(200).json({
          cart: cart
        });
      } else {
        res.send(createError(404, 'no Cart found'))
      }

    }
    catch (error) {
      res.send(createError(404, 'no Cart found'))
    }
  },
  LIST_CART: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const { id } = req.data;
      const user = await User.find({ _id: id, role: 1 });
      const { success, status_order } = req.query || '';
      if (user.length > 0) { // đã phê duyệt
        if (success === 'true' && status_order === 'true') {
          const features = new ApiFeatures(Cart.find({ success: true, status_order: true }), req.query).sortCart();
          const list_card = await features.query;
          const result = list_card.slice(start, end);
          const newCart = [];
          if (result.length > 0) {
            for (let index = 0; index < result.length; index++) {
              const id_user = result[index].id_User;
              const user = await User.findById(id_user, { password: 0 });
              const cart = { cart: result[index], user: { ...user._doc } };
              newCart.push(cart);
            }
          }
          res.status(200).json({
            length: list_card.length,
            cart: newCart
          })
        }
        if (success === 'false' && status_order === 'false') { // giỏ hàng đã hủy
          const features = new ApiFeatures(Cart.find({ success: false, status_order: false }, {}), req.query).sortCart();
          const list_card = await features.query;
          const result = list_card.slice(start, end);
          const newCart = [];
          if (result.length > 0) {
            for (let index = 0; index < result.length; index++) {
              const id_user = result[index].id_User;
              const user = await User.findById(id_user, { password: 0 });
              const cart = { cart: result[index], user: { ...user._doc } };
              newCart.push(cart);
            }
          }
          res.status(200).json({
            length: list_card.length,
            cart: newCart
          })
        }
        if (success === 'false' && status_order === 'true') { // chờ phê duyệt
          const features = new ApiFeatures(Cart.find({ success: false, status_order: true }), req.query).sortCart();
          const list_card = await features.query;
          const result = list_card.slice(start, end);
          const newCart = [];
          if (result.length > 0) {
            for (let index = 0; index < result.length; index++) {
              const id_user = result[index].id_User;
              const user = await User.findById(id_user, { password: 0 });
              const cart = { cart: result[index], user: { ...user._doc } };
              newCart.push(cart);
            }
          }
          res.status(200).json({
            length: list_card.length,
            cart: newCart
          })
        } else { // tất cả giỏ hàng
          const features = new ApiFeatures(Cart.find({}, {}), req.query).sortCart();
          const list_card = await features.query;
          const result = list_card.slice(start, end);
          const newCart = [];
          if (result.length > 0) {
            for (let index = 0; index < result.length; index++) {
              const id_user = result[index].id_User;
              const user = await User.findById(id_user, { password: 0 });
              const cart = { cart: result[index], user: { ...user._doc } };
              newCart.push(cart);
            }
          }
          res.status(200).json({
            length: list_card.length,
            cart: newCart
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
  //----------------------------user------------------
  GET_USER: async (req, res) => {
    try {
      const { id } = req.data;
      const admin = await User.find({ _id: id, role: 1 });
      const { role } = req.query || 'all';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      if (admin.length > 0) {
        if (role === 'user') { // user
          const userAll = await User.find({ role: 0 }, { password: 0 });
          const resultUsers = userAll.slice(start, end);
          let lengthUser = resultUsers.length;
          const reqUsers = [];
          for (let i = 0; i < lengthUser; i++) {
            const id_user = resultUsers[i]._id;
            const length_comment = await Comment.find({ id_user: id_user });
            const length_cart = await Cart.find({ id_User: id_user });
            const newUser = { length_cart: length_cart.length, length_comment: length_comment.length, user: resultUsers[i] };
            reqUsers.push(newUser);
          };
          res.status(200).json({
            status: 'success',
            start: start,
            end: end,
            limit: limit,
            length: userAll.length,
            user: reqUsers
          });
        }
        if (role === 'admin') { // admin
          const adminAll = await User.find({ role: 1 }, { password: 0 });
          const resultUsers = adminAll.slice(start, end);
          let lengthUser = resultUsers.length;
          const reqUsers = [];
          for (let i = 0; i < lengthUser; i++) {
            const id_user = resultUsers[i]._id;
            const length_comment = await Comment.find({ id_user: id_user });
            const length_cart = await Cart.find({ id_User: id_user });
            const newUser = { length_cart: length_cart.length, length_comment: length_comment.length, user: resultUsers[i] };
            reqUsers.push(newUser);
          };
          res.status(200).json({
            status: 'success',
            start: start,
            end: end,
            limit: limit,
            length: adminAll.length,
            user: reqUsers
          });
        }
        if (role === 'all') { // all
          const allUser = await User.find({}, { password: 0 });
          const resultUsers = allUser.slice(start, end);
          let lengthUser = resultUsers.length;
          const reqUsers = [];
          for (let i = 0; i < lengthUser; i++) {
            const id_user = resultUsers[i]._id;
            const length_comment = await Comment.find({ id_user: id_user });
            const length_cart = await Cart.find({ id_User: id_user });
            const newUser = { length_cart: length_cart.length, length_comment: length_comment.length, user: resultUsers[i] };
            reqUsers.push(newUser);
          };
          res.status(200).json({
            status: 'success',
            start: start,
            end: end,
            limit: limit,
            length: allUser.length,
            user: reqUsers
          });
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
  LIST_CART_USERS: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const { id } = req.data;
      const { id_user } = req.query;
      const admin = await User.find({ _id: id, role: 1 });
      const features = new ApiFeatures(Cart.find({ id_User: id_user }), req.query).sortCart();
      const list_cart = await features.query;
      const length_data = await Cart.find({ id_User: id_user });
      const result_cart = list_cart.slice(0, end);
      if (admin.length > 0 && id_user) {
        res.status(200).json({
          status: 'success',
          start: 0,
          end: end,
          limit: limit,
          length: length_data.length,
          cart: result_cart,
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
  LIST_COMMENTS_USERS: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const start = (page - 1) * limit;
      const end = start + limit;
      const { id } = req.data;
      const { id_user } = req.query;
      const admin = await User.find({ _id: id, role: 1 });
      const features = new ApiFeatures(Comment.find({ id_user: id_user }), req.query).sortingComment();
      const list_comments = await features.query;
      const length_data = await Comment.find({ id_user: id_user });
      const result_comments = list_comments.slice(0, end);
      if (admin.length > 0 && id_user) {
        res.status(200).json({
          status: 'success',
          start: 0,
          end: end,
          limit: limit,
          length: length_data.length,
          comment: result_comments,
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
  DELETE_COMMENT_USERS: async (req, res) => {
    try {
      const { _id_comment, _id_product, _id_user } = req.query;
      const { id } = req.data;
      const admin = await User.find({ _id: id, role: 1 });
      if (admin.length > 0) {
        const comment = await Comment.findByIdAndDelete(_id_comment);
        const product = await Product.findById(_id_product);
        let num = product.numReviews;
        let rate = product.rating;
        let start_cmt = comment.start;
        if (start_cmt > 0) {
          const options = { new: true };
          const data = {
            rating: rate - start_cmt,
            numReviews: num - 1
          }
          await Product.findByIdAndUpdate(_id_product, data, options);
        }
        const dataComments = await Comment.find({ id_user: _id_user });
        res.status(200).json({
          status: 'delete success',
          length: dataComments.length,
          id_comment: _id_comment,
          id_user: _id_user,
          id_product: _id_product
        })
      };
    } catch (error) {
      console.log(error)
    }
  },
  DELETE_ACCOUNT_USER: async (req, res) => {
    try {
      const { _id_user } = req.query;
      const { id } = req.data;
      const admin = await User.find({ _id: id, role: 1 });
      const user = await User.findById(_id_user);
      const commentUser = await Comment.find({ id_user: _id_user });
      const commentUserReply = await Comment.find();
      if (admin.length > 0 && user) {
        //delete no reply
        if (commentUser.length > 0) {
          for (let index = 0; index < commentUser.length; index++) {
            const _idComment = commentUser[index]._id;
            const idProduct = commentUser[index].id_product;
            const product = await Product.findById(idProduct);
            const comment = await Comment.findByIdAndDelete(_idComment);
            let num = product.numReviews;
            let rate = product.rating;
            let start_cmt = comment.start;
            if (start_cmt > 0) {
              const options = { new: true };
              const data = {
                rating: rate - start_cmt,
                numReviews: num - 1
              }
              await Product.findByIdAndUpdate(idProduct, data, options);
            }
            await Comment.findByIdAndDelete(_idComment);
          }
        }
        // delete reply
        if (commentUserReply.length > 0) {
          for (let j = 0; j < commentUserReply.length; j++) {
            const arrayReply = Array.from(commentUserReply[j].reply);
            if (arrayReply.length > 0) {
              for (let i_reply = 0; i_reply < arrayReply.length; i_reply++) {
                if (arrayReply[i_reply].id_user === _id_user) {
                  arrayReply.splice(i_reply, 1);
                  let id_reply = commentUserReply[j]._id;
                  await Comment.findByIdAndUpdate(id_reply, { reply: arrayReply }, { new: true });
                }
              }
            }
          }
        }
        await User.findByIdAndDelete(_id_user);
        await Cart.deleteMany({ id_User: _id_user });
        res.status(200).json({
          message: 'delete account success',
          id_user: _id_user
        });
      };
    } catch (error) {
      console.log(error)
    }
  },
  ACTIVE_ROLE: async (req, res) => {
    try {
      const options = { new: true };
      const { _id_user, role } = req.body;
      const { id } = req.data;
      const admin = await User.find({ _id: id, role: 1 });
      if (admin.length > 0) {
        await User.findByIdAndUpdate(_id_user, { role: role }, options);
        await Comment.updateMany({ id_user: _id_user }, { role: role }, options);
        const dataReply = await Comment.find();
        for (let index = 0; index < dataReply.length; index++) {
          const reply = Array.from(dataReply[index].reply);
          if (reply.length > 0) {
            for (let j = 0; j < reply.length; j++) {
              const element = reply[j];
              if (element.id_user === _id_user) {
                element.role = role;
                const id_array = dataReply[index]._id;
                await Comment.findByIdAndUpdate(id_array, { reply: reply }, options);
              }
            };
          }
        };
        res.status(200).json({
          id_user: _id_user,
          role: role
        });
      }
    } catch (error) {
      console.log(error)
    }
  },
  DELETE_ALL_CART: async (req, res) => {
    try {
      const { _id_user } = req.query;
      const { id } = req.data;
      const admin = await User.find({ _id: id, role: 1 });
      if (admin.length > 0) {
        const deleteCart = await Cart.deleteMany({ id_User: _id_user });
        const resultCart = await Cart.find({ id_User: _id_user });
        if (deleteCart) {
          res.status(200).json({
            length: resultCart.length,
            id_user: _id_user
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
};