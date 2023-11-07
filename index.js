const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


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





//custom middleware 

const logger = async (req, res, next) => {
  // console.log('LOGGER Called ', req.host, req.originalUrl);
  next();
}

const verifyToken = async (req, res, next) => {

  const token = req.cookies?.token;
  // console.log('Our token is here from VERIFYYYYYY', token);
  if (!token) {
    return res.status(401).send({ message: 'forbidden' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log('bro LMAO');
      return res.status(401).send({ message: 'Not valid' });
    }

    console.log('DECODED MESSAGE IS', decoded);
    req.user = decoded;
    next();
  })

}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const bookCollection = client.db('bookDB').collection('books');
    const borrowedCollection = client.db('bookDB').collection('borrowed');
    const categoryCollection = client.db('bookDB').collection('catCollection');





    //jwt token related api 

    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",

          expiresIn: '5h',
        })
        .send({ success: true });
    })


    //cookie clearing server code 

    app.post('/logout', async (req, res) => {

      res.clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",

      }).send({ success: true });
    })




    //main server api
    app.post('/book', logger, verifyToken, async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    })

    app.get('/book', logger, verifyToken, async (req, res) => {
      const cursor = bookCollection.find();
      console.log('Here is the token in the /book api', req.cookies.token);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/category', async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })



    app.get('/filter', logger, verifyToken, async (req, res) => {
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
          return res.status(404).send('Book not found');
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });


    app.put('/bookUpdate/:id', logger, verifyToken, async (req, res) => {
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



    app.patch('/book', logger, verifyToken, async (req, res) => {
      const book = req.body;
      // console.log('patch is hit ', book);
      const filter = { _id: new ObjectId(book.id) };
      const updatedDoc = {
        $set: {
          quantity: book.quantity,

        }
      }
      console.log('Updated Doc', updatedDoc);
      const result = await bookCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })




    app.post('/borrowed', logger, verifyToken, async (req, res) => {
      const addedBook = req.body;

      const result = await borrowedCollection.insertOne(addedBook);
      res.send(result);
    })

    app.get('/borrowed', logger, verifyToken, async (req, res) => {
      const email = req.query.email; // the query parameter is named 'email'
      const query = { email: email }; // Define the query object with the email parameter
      console.log('Here is req.user from verify token inside borrowed', req.user?.email);

      // if (req.query.email !== req.user?.email) {
         
      // }

      if (req.user?.email !== req.query.email) {
        return res.status(403).send({ message: 'Forbidden Access' });
      }

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




    app.delete('/borrowed/:id', logger, verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
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
