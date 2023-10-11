const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://toybox-97639.web.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.epxwefd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
} 


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const subCategoryCollection = client.db('toyBoxDB').collection('subCategories');
    const toyCollection = client.db('toyBoxDB').collection('toys');

    app.post('/jwt', async(req, res) => {
      const loggedUser = req.body;
      // console.log(loggedUser)
      const token = jwt.sign(loggedUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
      res.send({token});
    })

    app.get('/subCategories', async(req, res) => {
      const result = await subCategoryCollection.find().toArray();
      res.send(result);
    })

    app.get('/toys', async(req, res) => {
      const search = req?.query?.search;
      let query = {};
      if(search){
        query = {toyName : {$regex : search, $options: 'i'}}
      }
      
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/toys/gallery', async(req, res) => {
      const query = {};
      const options = {
        projection: { _id: 1, toyName: 1, photo: 1 }
      };
      const result = await toyCollection.find(query, options).limit(9).toArray();
      res.send(result);
    })

    app.get('/toy/:id', async(req, res) => {
      const id = req.params.id;
      // console.log(id);
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

    app.get('/myToys',verifyJWT, async( req, res ) => {
      const email = req.query.email;
      const sort = req?.query?.sort == 'true' ? 1 : -1;
      const query = {
        sellerEmail: email
      }
      const result = await toyCollection.find(query).sort({toyPrice : sort }).toArray();
      res.send(result);
    })

    app.post('/toys', verifyJWT, async(req, res) => {
      const toys = req.body;
      const result = await toyCollection.insertOne(toys)
      res.send(result);
    })

    app.patch('/toys/:id', verifyJWT, async(req, res) => {
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

    app.delete('/toys/:id', verifyJWT, async(req, res) => {
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
