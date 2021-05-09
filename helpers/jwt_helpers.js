const JWT = require('jsonwebtoken');
const creatError = require('http-errors');
module.exports = {
  signAccessToken: (id) => {
    return new Promise((resolve, reject) => {
      const options = {
        expiresIn: '30d',
      }
      JWT.sign({ id }, process.env.ACCESS_TOKEN_SECRET, options, (err, token) => {
        if (err) reject(creatError.InternalServerError());
        resolve(token);
      })
    })
  },

  signRefreshToken: (id) => {
    return new Promise((resolve, reject) => {
      const options = {
        // expiresIn: '16s',
      }
      JWT.sign({ id }, process.env.REFRESH_TOKEN_SECRET, options, (err, token) => {
        if (err) reject(creatError.InternalServerError());
        resolve(token);
      })
    })
  },

  verilyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(creatError.Unauthorized());

      })
    })
  },

  verifyAccessToken: (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return next(creatError.Unauthorized())
    try {
      const verified = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.data = verified;
      next();
    } catch {
      res.status(400).send('Invalid Token');
    }
  }
};

