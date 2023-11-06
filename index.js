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
    const borrowedCollection = client.db('bookDB').collection('borrowed');
    const categoryCollection = client.db('bookDB').collection('catCollection');

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

    app.get('/category', async(req,res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    
    app.get('/filter', async (req, res) => {
      const cursor = bookCollection.find({ quantity: { $gt: 0 } }); // the $gt operator to filter for quantity > 0
      const result = await cursor.toArray();
      res.send(result);
    })
    

    app.get('/testing', async (req, res) => {
      const cursor = bookCollection.find(
        { quantity: { $gt: 2 } }, // Query for quantity > 0
        { projection: { author: 1, quantity: 1, _id: 0 } } // Include only author and quantity, exclude _id
      );
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get('/book/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await bookCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/getBook/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
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

    
    app.put('/bookUpdate/:id', async(req,res) => {
      const id = req.params.id;
      const newBook = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProd = {
        $set: {
          image: newBook.image,
          name: newBook.name,
          author: newBook.author,
          category: newBook.category,
          rating: newBook.rating,
        }
      }

      const result = await bookCollection.updateOne(filter, updatedProd, options);
      res.send(result);
    })

    

    app.patch('/book',async(req,res) => {
      const book = req.body;
      // console.log('patch is hit ', book);
      const filter = {_id: new ObjectId(book.id)};
      const updatedDoc = {
         $set : {
           quantity: book.quantity,
          
         }
      }
      console.log('Updated Doc',updatedDoc);
      const result = await bookCollection.updateOne(filter,updatedDoc);
      res.send(result);
   })




   app.post('/borrowed', async (req, res) => {
    const addedBook = req.body;
    const result = await borrowedCollection.insertOne(addedBook);
    res.send(result);
  })
  
  app.get('/borrowed', async (req, res) => {
    const email = req.query.email; // the query parameter is named 'email'
    const query = { email: email }; // Define the query object with the email parameter
    
    const cursor = borrowedCollection.find(query); // Using the query in the find function
    const result = await cursor.toArray();
    res.send(result);
  });
   

  //   app.patch('/book',async(req,res) => {
  //     const user = req.body;
  //     const filter = {email: user.email};
  //     const updatedDoc = {
  //        $set : {
  //          lastLoggedAt: user.lastLoggedAt,
  //        }
  //     }

  //     const result = await userCollection.updateOne(filter,updatedDoc);
  //     res.send(result);
  //  })




  // app.patch('/product/:id', async (req, res) => {
  //   try {
  //     const id = req.params.id;
  
  //     if (!ObjectId.isValid(id)) {
  //       return res.status(400).send('Invalid ID');
  //     }
  
  //     const updatedFields = req.body;
  //     const filter = { _id: new ObjectId(id) };
  //     const update = {
  //       $set: updatedFields
  //     };
  
  //     const result = await productCollection.updateOne(filter, update);
  
  //     if (result.matchedCount === 0) {
  //       return res.status(404).send('Product not found');
  //     }
  
  //     res.send(result);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  //   }
  // });
  
   

  
  app.delete('/borrowed/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const query = { _id: new ObjectId(id)};
    const result = await borrowedCollection.deleteOne(query);
    res.send(result);
  })





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
