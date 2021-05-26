const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const sever = require("http").createServer(app);
const PORT = process.env.PORT || 3001;
const moment = require("moment");
const JWT = require("jsonwebtoken");
const cors = require("cors");
// SocketIo
const io = require("socket.io")(sever, {
  cors: {
    origin: "http://kaitoshop.cf",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Header",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      "Access-Control-Allow-Methods",
    ],
    credentials: true,
  },
});
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Model
const Comment = require("./Model/Comment");
const Products = require("./Model/Product");
const View = require("./Model/View");
const User = require("./Model/User");
// connection
require("dotenv").config();
require("./initDB")();
// app
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Header",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methoads", "PUT, POST, DELETE, GET");
  next();
});
// socket io
let userComment = [];
let countUserOnline = [];
io.on("connection", (socket) => {
  console.log("co nguoi ket noi:", socket.id);
  socket.on("joinRoom", (id) => {
    const user = { userId: socket.id, room: id };
    const check = userComment.every((user) => user.userId !== socket.id);
    if (check) {
      userComment.push(user);
      socket.join(user.room);
    } else {
      userComment.map((user) => {
        if (user.userId === socket.id) {
          if (user.room !== id) {
            socket.leave(user.room);
            socket.join(id);
            user.room = id;
          }
        }
      });
    }
  });
  // count User Online
  socket.on("countUserOnline", async (id) => {
    try {
      const user = { userId: socket.id, room: id };
      const check = countUserOnline.every((user) => user.userId !== socket.id);
      const resultView = await View.findById(process.env.ID_VIEW);
      const resultUpdate = await View.findByIdAndUpdate(process.env.ID_VIEW, { View: resultView.View + 1 }, { new: true });
      if (check) {
        countUserOnline.push(user);
        socket.join(user.room);
      }
      const data = {
        accountOnline: countUserOnline.length,
        view: resultUpdate.View
      }
      io.sockets.emit("severCountUserOnline", data);
    } catch (error) {
      console.log(error)
    }
  });
  // create comment
  socket.on("userCreateComment", async (msg) => {
    try {
      const timeComment = moment().format();
      const { id_product, content, start, token, send, idComment, idUser } = msg;
      const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(result.id);
      if (user) {
        const product = await Products.findById(id_product);
        const array_product = {
          _id: product._id,
          poster: product.poster[0].url,
          key: product.key,
          NSX: product.NSX,
          name: product.name,
        };
        const newComment = new Comment({
          _id: new mongoose.Types.ObjectId(),
          id_product,
          array_product,
          content,
          start,
          timeComment: timeComment,
          id_user: user._id,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          editComment: false,
        });
        const num = product.numReviews;
        const rate = product.rating;
        const options = { new: true };
        const data = {
          rating: start > 0 ? rate + start : rate,
          numReviews: start > 0 ? num + 1 : num,
        };
        await Products.findByIdAndUpdate(id_product, data, options);
        if (send === 'repLyComment') {
          const commentReply = new Comment({
            _id: new mongoose.Types.ObjectId(),
            id_product,
            array_product,
            content,
            timeComment: timeComment,
            id_user: user._id,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            editComment: false,
          });
          const comment = await Comment.findById(idComment);
          if (comment) {
            const { _id, id_product, content, timeComment, id_user, name, role, avatar, editComment } = commentReply;
            comment.reply.push({ role, _id, id_product, content, start: 0, timeComment, id_user, name, avatar, editComment });
            await comment.save();
            io.to(comment.id_product).emit('ServerUserCreateCommentReply', comment);
          }
        } else {
          await newComment.save();
          const products = await Products.findById(id_product);
          const dataComments = await Comment.find({ id_product: id_product });
          const oneStarsResult = await Comment.find({ id_product: id_product, start: 1 });
          const twoStarsResult = await Comment.find({ id_product: id_product, start: 2 });
          const threeStarsResult = await Comment.find({ id_product: id_product, start: 3 });
          const fourStarsResult = await Comment.find({ id_product: id_product, start: 4 });
          const fiveStarsResult = await Comment.find({ id_product: id_product, start: 5 });
          const sumStarRating = oneStarsResult.length + twoStarsResult.length + threeStarsResult.length + fourStarsResult.length + fiveStarsResult.length;
          const starRating = {
            oneStars: oneStarsResult.length,
            twoStars: twoStarsResult.length,
            threeStars: threeStarsResult.length,
            fourStars: fourStarsResult.length,
            fiveStart: fiveStarsResult.length
          };
          const resultData = {
            length: dataComments.length,
            comment: newComment,
            product: products,
            reviewRating: (sumStarRating > 0 && products.rating > 0) ? (products.rating / sumStarRating) : 0,
            starRating: starRating,
            sumStarRating: sumStarRating
          };
          io.to(newComment.id_product).emit("ServerUserCreateComment", resultData);
        }
      } else {
        const noUsers = {
          accountDelete: true,
          _id_user: idUser
        }
        io.sockets.emit("serverDeleteAccount", noUsers);
      }
    } catch (err) {
      console.log(err);
    }
  });
  // delete comment
  socket.on("userDeleteComment", async (msg) => {
    try {
      const { _id, id_product, token, idUser } = msg;
      const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(result.id);
      const dataReply = await Comment.find({ id_product: id_product });
      if (user) {
        const comment = await Comment.findByIdAndDelete(_id);
        const product = await Products.findById(id_product);
        //delete have reply
        if (dataReply) {
          for (let index = 0; index < dataReply.length; index++) {
            const reply = Array.from(dataReply[index].reply);
            if (reply.length > 0) {
              for (let j = 0; j < reply.length; j++) {
                const element = reply[j];
                if (element._id == _id) {
                  reply.splice(j, 1);
                  const id_array = dataReply[index]._id;
                  const sendReply = await Comment.findByIdAndUpdate(id_array, { reply: reply }, { new: true });
                  const data = {
                    id_array: id_array,
                    comment: sendReply
                  };
                  io.to(sendReply.id_product).emit("serverUserDeleteReplyComment", data);
                  break;
                }
              }
            };
          };
        }
        //delete no reply
        if (comment) {
          const num = product.numReviews;
          const rate = product.rating;
          const start_cmt = comment.start;
          const options = { new: true };
          const data = {
            rating: start_cmt > 0 ? rate - start_cmt : rate,
            numReviews: start_cmt > 0 ? num - 1 : num,
          };
          await Products.findByIdAndUpdate(id_product, data, options);
          const dataComments = await Comment.find({ id_product: id_product });
          const products = await Products.findById(id_product);
          const oneStarsResult = await Comment.find({ id_product: id_product, start: 1 });
          const twoStarsResult = await Comment.find({ id_product: id_product, start: 2 });
          const threeStarsResult = await Comment.find({ id_product: id_product, start: 3 });
          const fourStarsResult = await Comment.find({ id_product: id_product, start: 4 });
          const fiveStarsResult = await Comment.find({ id_product: id_product, start: 5 });
          const sumStarRating = oneStarsResult.length + twoStarsResult.length + threeStarsResult.length + fourStarsResult.length + fiveStarsResult.length;
          const starRating = {
            oneStars: oneStarsResult.length,
            twoStars: twoStarsResult.length,
            threeStars: threeStarsResult.length,
            fourStars: fourStarsResult.length,
            fiveStart: fiveStarsResult.length
          };
          const resultData = {
            length: dataComments.length,
            comment: comment,
            product: products,
            reviewRating: (sumStarRating > 0 && products.rating > 0) ? (products.rating / sumStarRating) : 0,
            starRating: starRating,
            sumStarRating: sumStarRating,
          };
          io.to(comment.id_product).emit("serverUserDeleteComment", resultData);
        }
      }
      else {
        const noUsers = {
          accountDelete: true,
          _id_user: idUser
        }
        io.sockets.emit("serverDeleteAccount", noUsers);
      }
    } catch (error) {
      console.log(error);
    }
  });
  // update Comment
  socket.on("userUpdateComment", async (msg) => {
    try {
      const { content, start, token, idUser, idProduct, _id } = msg;
      const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(result.id);
      if (user) {
        const createdAt = new Date().toISOString();
        const product = await Products.findById(idProduct);
        const comment = await Comment.findById(_id);
        const options = { new: true };
        const dataReply = await Comment.find({ id_product: idProduct });
        // update reply
        if (dataReply) {
          for (let index = 0; index < dataReply.length; index++) {
            const reply = Array.from(dataReply[index].reply);
            if (reply.length > 0) {
              for (let j = 0; j < reply.length; j++) {
                const element = reply[j];
                if (element._id == _id) {
                  element.content = content;
                  element.editComment = true;
                  const id_array = dataReply[index]._id;
                  const sendReply = await Comment.findByIdAndUpdate(id_array, { reply: reply }, options);
                  io.to(sendReply.id_product).emit("serverUserUpdateReplyComment", sendReply);
                  break;
                }
              }
            };
          };
        }
        // update no reply
        if (comment) {
          const newComment = {
            content: content.trim(),
            start,
            editComment: true,
            timeComment: createdAt,
          };
          const rateOld = product.rating;
          const resultComment = await Comment.findByIdAndUpdate(_id, newComment, options);
          const startOld = start > 0 ? comment.start : start;
          const resultStart = start > 0 ? (startOld - start) : start;
          const newProduct = { rating: resultStart > 0 ? rateOld - Math.abs(resultStart) : rateOld + Math.abs(resultStart) };
          await Products.findByIdAndUpdate(idProduct, newProduct, options);
          const products = await Products.findById(idProduct);
          const oneStarsResult = await Comment.find({ id_product: idProduct, start: 1 });
          const twoStarsResult = await Comment.find({ id_product: idProduct, start: 2 });
          const threeStarsResult = await Comment.find({ id_product: idProduct, start: 3 });
          const fourStarsResult = await Comment.find({ id_product: idProduct, start: 4 });
          const fiveStarsResult = await Comment.find({ id_product: idProduct, start: 5 });
          const sumStarRating = oneStarsResult.length + twoStarsResult.length + threeStarsResult.length + fourStarsResult.length + fiveStarsResult.length;
          const starRating = {
            oneStars: oneStarsResult.length,
            twoStars: twoStarsResult.length,
            threeStars: threeStarsResult.length,
            fourStars: fourStarsResult.length,
            fiveStart: fiveStarsResult.length
          };
          const resultData = {
            comment: resultComment,
            product: products,
            reviewRating: (sumStarRating > 0 && products.rating > 0) ? (products.rating / sumStarRating) : 0,
            starRating: starRating,
            sumStarRating: sumStarRating,
          };
          io.to(resultComment.id_product).emit("serverUserUpdateComment", resultData);
        }
      }
      else {
        const noUsers = {
          accountDelete: true,
          _id_user: idUser
        }
        io.sockets.emit("serverDeleteAccount", noUsers);
      }
    } catch (error) {
      console.log(error);
    }
  });
  // upload  inForMation
  socket.on("userUpdateInformation", async (msg) => {
    try {
      const { token, name, idUser } = msg;
      const result = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(result.id);
      if (user) {
        const options = { new: true };
        const data = { name: name };
        const resultUser = await User.findByIdAndUpdate(result.id, data, options);
        await Comment.updateMany({ id_user: result.id }, { name: name }, options);
        const dataReply = await Comment.find();
        for (let index = 0; index < dataReply.length; index++) {
          const reply = Array.from(dataReply[index].reply);
          if (reply.length > 0) {
            for (let j = 0; j < reply.length; j++) {
              const element = reply[j];
              if (element.id_user === idUser) {
                element.name = name;
                const id_array = dataReply[index]._id;
                await Comment.findByIdAndUpdate(id_array, { reply: reply }, options);
              }
            };
          }
        };
        const resultData = {
          user: resultUser,
          id_user: idUser,
        };
        io.sockets.emit("serverUpdateInformation", resultData);
      }
    } catch (e) {
      console.log(e);
    }
  });
  // wait Write Comment
  socket.on('waitWriteComment', msg => {
    const { idProduct, message } = msg;
    socket.to(idProduct).emit('waitWriteComment', message);
  });
  // upload image
  socket.on('userUploadAvatar', msg => {
    const { avatar, idUser } = msg;
    const resultData = {
      userId: idUser,
      user: avatar
    }
    io.sockets.emit("serverUserUploadAvatar", resultData);
  });
  socket.on("disconnect", async () => {
    console.log(socket.id + " disconnected.");
    userComment = userComment.filter((user) => user.userId !== socket.id);
    countUserOnline = countUserOnline.filter((user) => user.userId !== socket.id);
    const resultView = await View.findById(process.env.ID_VIEW);
    io.sockets.emit("severCountUserOnline", { accountOnline: countUserOnline.length, view: resultView.View });
  });
});
//router
const commentRouter = require("./Router/comment");
const userRouter = require("./Router/user");
const productRouter = require("./Router/product");
const menuRouter = require("./Router/menu");
const cardRouter = require("./Router/cart");
const adminRouter = require("./Router/admin");
const searchRouter = require("./Router/search");

app.use("/api/products", productRouter);
app.use("/api/user", userRouter);
app.use("/api/comments", commentRouter);
app.use("/api/menu", menuRouter);
app.use("/api/cart", cardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/search", searchRouter);

app.use((req, res, next) => {
  res.send("hello");
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});


sever.listen(PORT, () => {
  console.log(`server started on http://localhost:${PORT}`);
});
