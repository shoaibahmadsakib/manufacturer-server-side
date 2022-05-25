const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
// data base

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.u3jkk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


// jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.USER_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    await client.connect();

    const userCollection = client.db("Manufacturer").collection("tools");
    const OrderCollection = client.db("Manufacturer").collection("Order");
    const UserEmail = client.db("Manufacturer").collection("user");
    console.log("connect");
    //for checking connection
   

    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });
    // find single id
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //user infor
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await UserEmail.updateOne(filter, updateDoc, options);

      const token = jwt.sign({ email: email }, process.env.USER_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result ,token});
    });

    // ///////////

    app.post("/Order", async (req, res) => {
      const booking = req.body;
      const query = {
        email: booking.email,
        name: booking.name,
        number: booking.number,
        quentity: booking.quentity,
      };
      const exists = await OrderCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await OrderCollection.insertOne(booking);
      return res.send({ success: true, result });
    });

    app.get('/Order',async(req,res)=>{
      const query = {};
      const cursor = OrderCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    })
    // user
    app.get('/user',async(req,res)=>{
      const query = {};
      const cursor = UserEmail.find(query);
      const users = await cursor.toArray();
      res.send(users);
    })
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//
//
