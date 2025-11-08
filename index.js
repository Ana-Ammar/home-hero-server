const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
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


    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
};

run().catch(console.dir);

app.listen(port, () => {
  console.log(`home hero server is running on port: ${port}`);
});
