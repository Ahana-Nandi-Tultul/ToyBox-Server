const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.epxwefd.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();


    const subCategoryCollection = client.db('toyBoxDB').collection('subCategories');
    const toyCollection = client.db('toyBoxDB').collection('toys');

    app.get('/subCategories', async(req, res) => {
      const result = await subCategoryCollection.find().toArray();
      res.send(result);
    })

    app.get('/toys', async(req, res) => {
      const search = req.query.search;
      let query = {};
      if(search){
        query = {toyName : search}
      }
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/toy/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const email = req.query.email;
      const query = {_id : new ObjectId(id)}
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/toys/:categoryName', async(req, res)=>{
      const categoryName = req.params.categoryName;
      const query = {subCategory: categoryName};
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/totalToys', async(req, res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({totalToys: result})
    })

    app.get('/toysPerPage', async(req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 0;
      const skip = page * limit;
      const result = await toyCollection.find().skip(skip).limit(limit).toArray();
      res.send(result)
    })

    app.get('/myToys', async( req, res ) => {
      const email = req.query.email;
      const query = {
        sellerEmail: email
      }
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/toys', async(req, res) => {
      const toys = req.body;
      const result = await toyCollection.insertOne(toys)
      res.send(result);
    })

    app.patch('/toys/:id', async(req, res) => {
      const id = req.params.id;
      // console.log(id);
      const email = req.query.email;
      const toy = req.body;
      // console.log(toy);
      const filter = {_id : new ObjectId(id)}
      const updateToy = {
        $set: {
          toyPrice: toy.toyPrice, 
          quantity: toy.quantity, 
          description : toy.description
        }
      }
      const result = await toyCollection.updateOne(filter, updateToy)
      res.send(result);
    })

    app.delete('/toys/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const email = req.query.email;
      // console.log(email);
      const query = {_id : new ObjectId(id)};
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('ToyBox is opening');
})

app.listen(port, () => {
    console.log('Toy Box is running on the port:', port);
})