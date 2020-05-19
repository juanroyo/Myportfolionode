
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const emailp = process.env.EMAILP;
const express = require('express')
const app = express()
const http = require('http')
const readline = require('readline');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt')

const stripe = require("stripe")("sk_test_qi9RJCWRFOU6Ry4X8m1kvNad002D09YcIO")
const { v4: uuidv4 } = require('uuid');
const cors = require("cors")
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const MongoClient = require('mongodb').MongoClient;
const router = express.Router();
//var url = "mongodb://localhost:27017/";
app.set('db', require('./models.js'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }));
app.use(cors());




//-------------CART----------------
app.post("/cart", (req, res) => {

     const {product, token} = req.body;
     console.log("PRODUCT", product.title);
     console.log("PRICE", product.total);
     const idempontencyKey = uuidv4()
     return stripe.customers.create({
       email: token.email,
       source: token.id
     }).then(customer => {
       stripe.charges.create({
         amount: product.total * 100,
         currency: 'eur',
         customer: customer.id,
         //email: token.email,
         description: product.title,

       }).catch(err => console.log(err))
     }).then(function sendEmail() {
       var products = req.body;
       JSON.stringify(products)
       var productosParaEnviar = products.product.addedItems;
       var ids = []
       productosParaEnviar.map(function(item, index) {
         return ids = item._id
         })

       console.log("hola"+ids)
       console.log("PRICE", productosParaEnviar);
       console.log("this is the function!")

      var emailAddress = token.email;
      var bodyMessage = '<table>';
      var mail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'ju.val.roy@gmail.com',
          pass: 'Manolito.1'
        }
      });
       var mailOptions = {
          from: 'ju.val.roy@gmail.com',
          to: emailAddress,
          subject: 'Sending Email using Node.js',
          html: `<td><h1>thanks for buying ${productosParaEnviar.map(function(item, index) {
            return item.title
          })}, ${productosParaEnviar.map(function(item, index) {
            return item.genre
          })}, ${productosParaEnviar.map(function(item, index) {
            return item.quantity
          })}, ${productosParaEnviar.map(function(item, index) {
            return item.img
          })}, ${productosParaEnviar.map(function(item, index) {
            return `<a href="${item.download}" download>Download Here
          <a/> `})}
          , price ${product.total}</h1></td><td><p>That was easy!</p></td>`
        }
        mail.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        })
      }).then(MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var dbo = db.db("mydb");

          var payment = {
            email: token.email,
            products: req.body.product.addedItems,
            total: product.total
          };
          dbo.collection("Payments").insertOne(payment, function(err, result) {
            if (err) throw err;
            console.log(result)
            res.json(result);
            db.close();
          })
        })).then(result =>  res.status(200).json(result))
     .catch(err => console.log(err))
});

app.get('/cart', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("Albums").find().toArray(function(err, result) {
      if (err) throw err;
      console.log(result)
      res.json(result);
      db.close();
    });
  });
});


app.get('/cart/:id', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var albumid = req.params._id;
    dbo.collection("Albums").find(albumid).toArray(function(err, result) {
      if (err) throw err;
      console.log(result)
      res.json(result);
      db.close();
    });
  });
});

//--------CONTACT POST-------------
app.post('/contact', function(req, res) {
  function sendEmail() {
    var emailAddress = req.body.email;
    var message =  req.body.textarea;
    //var total = req.body.total;
    console.log("this is the function!")

   var mail = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: 'ju.val.roy@gmail.com',
       pass: 'Manolito.1'
     }
   });
    var mailOptions = {
       from:  emailAddress,
       to: 'ju.val.roy@gmail.com',
       subject: 'Sending Email using Node.js',
       html: `<td><p>${message}</p></td><td><p>That was easy!${emailAddress}</p></td>`
     }
     mail.sendMail(mailOptions, function(error, info){
       if (error) {
         console.log(error);
       } else {
         console.log('Email sent: ' + info.response);
       }
     });
   }
   sendEmail()
     MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("hola" + req.body);
    var dbo = db.db("mydb");
    var myobj = {
          email: req.body.email,
          textarea: req.body.textarea
          };
    dbo.collection("Messages").insertOne(myobj, function(err, result) {
      if (err) throw err;
      console.log("1 document inserted");
      res.json(result);
      db.close();

})
})

});

//-------------SHOP-----------------
app.get('/shop', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");

    dbo.collection("Albums").find().toArray(function(err, result) {
      if (err) throw err;

      res.json(result);
      db.close();
    });
  });
});
app.get('/offers', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");

    dbo.collection("Offers").find().toArray(function(err, result) {
      if (err) throw err;

      res.json(result);
      db.close();
    });
  });
});


app.get('/shop/:id', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");

    dbo.collection("Albums").find().toArray(function(err, result) {
      if (err) throw err;
      console.log(result)
      res.json(result);
      db.close();
    });
  });
});

app.get('/login', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");

    dbo.collection("Payments").find({}, { projection: { _id: 1, email: 1, products: 1,  total: 1 } }).toArray(function(err, result) {
      if (err) throw err;

      res.json(result);
      db.close();
    });
  });
});


app.use(router);
const url = "mongodb+srv://juanar:KELi1aO0zTS5pF1v@cluster0-axx5n.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(url);
const dbName = "test";

async function run() {
    try {
        await client.connect();
        console.log("Connected correctly to server");

    } catch (err) {
        console.log(err.stack);
    }
    finally {
        await client.close();
    }
}

run().catch(console.dir);
app.listen(process.env.PORT || 5000, function(){
console.log('Back is running')
});
