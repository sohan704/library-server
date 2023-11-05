const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


//mongodb code starts



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjvt8fn.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const bookCollection = client.db('bookDB').collection('books');

    app.post('/book', async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    })

    app.get('/book', async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get('/book/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await bookCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/book/:category/:id', async (req, res) => {
      try {
        const category = req.params.category;
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send('Invalid ID');
        }

        const query = { category: category, _id: new ObjectId(id) };
        const result = await bookCollection.findOne(query);

        if (!result) {
          return res.status(404).send('Product not found');
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//mongodb code ends



app.get('/', (req, res) => {
  res.send('LIBRARY IS OPEN FOR ALL');
})

app.listen(port, () => {
  console.log(`LIBRARY IS ONLINE ON PORT :- ${port}`);
})
