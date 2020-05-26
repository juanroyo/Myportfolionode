if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

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
app.set('db', require('./endpoints.js'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }));
/*corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};*/
app.use(cors());
var serveroption = {
  useNewUrlParser: true,
  connectTimeoutMS: 30000,
  server: {
        socketOptions: {
          connectTimeoutMS: 60000,
          keepAlive: 120,
            poolSize: 10

        }
    },
    replset: {
        loggerLevel: 'debug',
        socketOptions: {
          connectTimeoutMS: 60000,
          keepAlive: 120,
            poolSize: 10

        }
    }

}
const url = "mongodb+srv://juanar:KELi1aO0zTS5pF1v@cluster0-axx5n.mongodb.net/test?retryWrites=true&w=majority&mydb?replicaSet=rs0";
MongoClient.connect(url, serveroption, function(err, db) {
  if (err) throw err;
  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//-------------CART----------------
app.post("/cart", async function (req, res)  {

     const {product, token} = req.body;
     console.log("PRODUCT", product.title);
     console.log("PRICE", product.total);
     const idempontencyKey = uuidv4()
     return await stripe.customers.create({
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


       console.log("this is the function!")

      var emailAddress = token.email;
      var bodyMessage = '<table>';
      var mail = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
    secure: true,
        auth: {
          user: 'zylenstudio@gmail.com',
          pass: 'Manolito.1'
        }
      });
       var mailOptions = {
          from: 'zylenstudio@gmail.com',
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
      }).then( async function(req, res) {
          if (err) throw err;
          var dbo = db.db("mydb");

          var payment = {
            email: token.email,
            products: req.body.product.addedItems,
            total: product.total
          };

        return await  dbo.collection("Payments").insertOne(payment, function(err, result) {
            if (err) throw err;
            console.log(result)
            res.json(result);

          })
        }).then(result =>  res.status(200).json(result))
     .catch(err => console.log(err))
});





  async function sendEmail(req, res) {
    let emailAddress = req.body.email;
    let message =  req.body.textarea;
    //var total = req.body.total;
    console.log("this is the function!")

   let mail = nodemailer.createTransport({
     service: 'gmail',
     port: 465,
     secure: true,
     auth: {
       user: 'zylenstudio@gmail.com',
       pass: 'Manolito.1'
     }
   });
    let mailOptions = {
       from:  emailAddress,
       to: 'zylenstudio@gmail.com',
       subject: 'Sending Email using Node.js',
       html: `<td><p>${message}</p></td><td><p>That was easy!${emailAddress}</p></td>`
     }
   return await mail.sendMail(mailOptions, function(error, info){
       if (error) {
         console.log(error);
       } else {
         console.log('Email sent: ' + info.response);
       }
     });
   }


//--------CONTACT POST-------------
app.post('/contact', sendEmail, async function(req, res) {



    console.log("hola" + req.body);
    var dbo = db.db("mydb");
    var myobj = {
          email: req.body.email,
          textarea: req.body.textarea
          };

    return await dbo.collection("Messages").insertOne(myobj, function(err, result) {
      if (err) throw err;
      console.log("1 document inserted");
      res.json(result);


})
})



//-------------SHOP-----------------
app.get('/shop', async function(req, res) {

    var dbo = db.db("mydb");

    return await dbo.collection("Albums").find({}).toArray(function(err, result) {
      if (err) throw err;

      res.json(result);

    });
  });
app.get('/data', async function(req, res) {

    var dbo = db.db("mydb");

    return await dbo.collection("Albums").find( { projection: { _id: 1, title: 1, author: 1, genre: 1, desc: 1, price:1, img: 1, audio:1 } }).toArray(function(err, result) {
      if (err) throw err;

      res.json(result);

    });
  });

app.get('/offers', async function(req, res) {

    var dbo = db.db("mydb");

  return await dbo.collection("Offers").find( { projection: { _id: 1, title: 1, desc: 1,  img: 1 } }).toArray(function(err, result) {
      if (err) throw err;

      res.json(result);

    });
  });





app.get('/login',async function(req, res) {

    var dbo = db.db("mydb");

    return await dbo.collection("Payments").find( { projection: { _id: 1, email: 1, products: 1,  total: 1 } }).toArray(function(err, result) {
      if (err) throw err;

      res.json(result);
  db.close();
    });
  });

});


app.use(router);


const dbName = "test";

const client = new MongoClient(url, serveroption);
async function run() {
    try {
        await client.connect();
        console.log("Connected correctly to server!");

    } catch (err) {
        console.log(err.stack);
    }
    finally {

        return await client.close();
    }
}

run().catch(console.dir);
app.listen(process.env.PORT || 5000, function(){
console.log('Back is running')
});
