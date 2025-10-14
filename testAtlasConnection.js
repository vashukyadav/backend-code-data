const { MongoClient, ServerApiVersion } = require('mongodb');

// const uri = "mongodb+srv://vashuuyadav08_db_user:XbhTDJqbX9E1fnOF@photography-portfolio.3xmu9a2.mongodb.net/photography-portfolio?retryWrites=true&w=majority&appName=photography-portfolio";
const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
// mongodb+srv://vashuuyadav08_db_user:@photography-portfolio.3xmu9a2.mongodb.net/
