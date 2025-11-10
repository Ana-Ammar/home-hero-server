const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 5165;
const serviceAccount = require("./firebase-adminsdk-token-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors());
app.use(express.json());

const verifyFirebaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorizes access" });
  }
  const token = authorization.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    console.log(decoded.email);
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorizes access" });
  }
};

app.get("/", (req, res) => {
  res.send("home hero server is running now");
});

// Mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lh2xuij.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();
    const db = client.db("home_hero");
    const serviceCollection = db.collection("services");
    const bookingCollection = db.collection("bookings");

    // ---------Services API------------ //

    app.get("/services", async (req, res) => {
      const { category, min, max } = req.query;
      const query = {};
      if (category) query.category = category;
      if (min && max)
        query.price = { $gte: parseInt(min), $lte: parseInt(max) };
      else if (min) query.price = { $gte: parseInt(min) };
      else if (max) query.price = { $lte: parseInt(max) };
      const services = await serviceCollection
        .find(query)
        .sort({ price: 1 })
        .toArray();
      res.send(services);
    });

    // Top rated services
    app.get("/top-rated-services", async (req, res) => {
      const services = await serviceCollection
        .aggregate([
          { $addFields: { reviewCount: { $size: "$reviews" } } },
          { $sort: { reviewCount: -1 } },
          { $limit: 6 },
        ])
        .sort({ price: 1 })
        .toArray();
      res.send(services);
    });

    // Secure APIs

    app.get("/my-services", verifyFirebaseToken, async (req, res) => {
      const query = { email: req.query.email };
      const services = await serviceCollection
        .find(query)
        .sort({ price: 1 })
        .toArray();
      res.send(services);
    });

    app.get("/services/:id", verifyFirebaseToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const singleService = await serviceCollection.findOne(query);
      res.send(singleService);
    });

    app.post("/services", verifyFirebaseToken, async (req, res) => {
      const newService = await serviceCollection.insertOne(req.body);
      res.send(newService);
    });

    // Review API
    app.post("/services/:id/reviews", verifyFirebaseToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const review = req.body;
      review.date = new Date();
      const addReview = { $push: { reviews: review } };
      const result = await serviceCollection.updateOne(query, addReview);
      res.send(result);
    });

    app.patch("/services/:id", verifyFirebaseToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const updateService = { $set: req.body };
      const result = await serviceCollection.updateOne(query, updateService);
      res.send(result);
    });

    app.delete("/services/:id", verifyFirebaseToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const deleteService = await serviceCollection.deleteOne(query);
      res.send(deleteService);
    });

    // ---------Booking API------------ //

    app.get("/bookings", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) query.email = email;
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.get("/bookings/:serviceId", async (req, res) => {
      const query = { serviceId: req.params.serviceId };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", verifyFirebaseToken, async (req, res) => {
      const booking = req.body;
      booking.bookingDate = new Date();
      const newBooking = await bookingCollection.insertOne(booking);
      res.send(newBooking);
    });

    app.delete("/bookings/:id", verifyFirebaseToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
};

run().catch(console.dir);

app.listen(port, () => {
  console.log(`home hero server is running on port: ${port}`);
});
