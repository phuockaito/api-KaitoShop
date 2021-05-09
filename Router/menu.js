const express = require("express");
const createError = require('http-errors')
const router = express.Router();

const Product = require("../Model/Product");
router.get('/', async (req, res, next) => {
  try {
    const NSXAdidas = [],
      NSXnike = [],
      NSXNewBalance = [],
      NSXVans = [],
      NSXPuma = [],
      NSXConverse = []
      ;
    const Adidas = await Product.find({ key: 'adidas' });
    const nike = await Product.find({ key: 'nike' });
    const NewBalance = await Product.find({ key: 'newbalance' });
    const Vans = await Product.find({ key: 'vans' });
    const Puma = await Product.find({ key: 'puma' });
    const Converse = await Product.find({ key: 'converse' });
    Adidas.forEach(Adidas => {
      NSXAdidas.push(Adidas.NSX.trim().toLowerCase());
    });

    nike.forEach(nike => {
      NSXnike.push(nike.NSX.trim().toLowerCase());
    });

    NewBalance.forEach(NewBalance => {
      NSXNewBalance.push(NewBalance.NSX.trim().toLowerCase());
    });

    Vans.forEach(Vans => {
      NSXVans.push(Vans.NSX.trim().toLowerCase());
    });

    Puma.forEach(Vans => {
      NSXPuma.push(Vans.NSX.trim().toLowerCase());
    });

    Converse.forEach(Vans => {
      NSXConverse.push(Vans.NSX.trim().toLowerCase());
    })
    res.json({
      Adidas: [... new Set(NSXAdidas)],
      Nike: [... new Set(NSXnike)],
      NewBalance: [... new Set(NSXNewBalance)],
      Vans: [... new Set(NSXVans)],
      Puma: [... new Set(NSXPuma)],
      Converse: [... new Set(NSXConverse)]
    })

  } catch (error) {
    res.send(createError(404, 'no product found'))
  }
})

module.exports = router;