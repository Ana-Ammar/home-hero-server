const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5165;

// Middleware
app.use(cors());
app.use(express.json());

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

    // Services API

    app.get("/services", async (req, res) => {
      const { email, category } = req.query;
      const query = {};
      if (email) query.email = email;
      if (category) query.category = category;
      const services = await serviceCollection.find(query).toArray();
      res.send(services);
    });

    app.post("/services", async (req, res) => {
      const newService = await serviceCollection.insertOne(req.body);
      res.send(newService);
    });

    app.delete("/services/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const deleteService = await serviceCollection.deleteOne(query);
      res.send(deleteService);
    });



    // Booking API

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
