const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.DB_sk)
const app = express()
const port = process.env.PORT || 5000


// middle ware 
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.nhw8ipw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


    const usersCollection = client.db('scholarShip').collection('users')
    const scholarshipsCollection = client.db('scholarShip').collection('scholarships')
    const reviewsCollection = client.db('scholarShip').collection('reviews')
    const appliesCollection = client.db('scholarShip').collection('applies')
    const paymentsCollection = client.db('scholarShip').collection('payments')


    // jwt api 
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })
      res.send({ token })
    })

    // verify token    
    const verifyToken = (req, res, next) => { 
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access !' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: 'unauthorized access !' })
        }
        req.decoded = decoded

        next()
      })
    }
    // const verifyAdmin 
    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query)
    //   const isAdmin = user?.role === 'admin'
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }

    // const verifyModerator 
    // const verifyModerator = async (req, res, next) => {
    //   const email = req.decoded.email
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query)
    //   const isModerator = user?.role === 'moderator'
    //   if (!isModerator) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }

    // post users 
    app.post('/users',  async (req, res) => {
      const user = req.body
      const query = { email: user?.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    // get users 
    app.get('/users',verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // get admin user  
    app.get('/users/admin/:email',verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === "admin";
      }
      res.send({admin})
    })  

    // get moderator user 
    app.get('/users/moderator/:email',verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let moderator = false;
      if(user){
        moderator = user?.role === "moderator";
      }
      res.send({moderator})
    }) 

    // get users by id 
    app.get('/users/:id',verifyToken,  async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.findOne(query)
      res.send(result)
    }) 

    // delete user 
    app.delete('/users/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    // update user role 
    app.patch('/users/:id',verifyToken,  async (req, res) => {
      const id = req.params.id
      const currentUser = req.body
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          image: currentUser.image,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    // scholarship data post 
    app.post('/scholarships',verifyToken,  async (req, res) => {
      const data = req.body
      const result = await scholarshipsCollection.insertOne(data)
      res.send(result)
    })

    // get all scholarship data 
    app.get('/scholarships',verifyToken,  async (req, res) => {
      const result = await scholarshipsCollection.find().toArray()
      res.send(result)
    })

    // get scholarship data by id 
    app.get('/scholarships/:id',verifyToken,  async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await scholarshipsCollection.findOne(query)
      res.send(result)
    })

    // delete a scholarship data 
    app.delete('/scholarships/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await scholarshipsCollection.deleteOne(query)
      res.send(result)
    })

    // update a scholarship data 
    app.patch('/scholarships/:id',verifyToken,  async (req, res) => {
      const data = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          postDate: data.postDate,
          applicationDeadline: data.applicationDeadline,
          postedUserEmail: data.postedUserEmail,
          scholarshipName: data.scholarshipName,
          universityCity: data.universityCity,
          universityCountry: data.universityCountry,
          universityName: data.universityName,
          universityWorldRank: data.universityWorldRank,
          subjectCategory: data.subjectCategory,
          scholarshipCategory: data.scholarshipCategory,
          degree: data.degree,
          applicationFees: data.applicationFees,
          serviceCharge: data.serviceCharge,
          image: data.image
        }
      }
      const result = await scholarshipsCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // review post 
    app.post('/reviews',verifyToken, async (req, res) => {
      const data = req.body
      const result = await reviewsCollection.insertOne(data)
      res.send(result)
    })

    // review get 
    app.get('/reviews',verifyToken, async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })

    // reviews get  by email query 
    app.get('/reviews/ree',verifyToken, async (req, res) => {
      const email = req.query.email
      const query = { reviewerEmail: email }
      const result = await reviewsCollection.find(query).toArray()
      res.send(result)
    })

    // reviews get By id 
    app.get('/reviews/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await reviewsCollection.findOne(query)
      res.send(result)
    })

    // update a review by id 
    app.patch('/reviews/:id',verifyToken, async (req, res) => {
      const data = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          reviewerName: data.reviewerName,
          ratingPoint: data.ratingPoint,
          reviewerComments: data.reviewerComments,
          reviewerImage: data.reviewerImage
        }
      }
      const result = await reviewsCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // reviews delete by id 
    app.delete('/reviews/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await reviewsCollection.deleteOne(query)
      res.send(result)
    })

    // applies post 
    app.post('/applies',verifyToken, async (req, res) => {
      const data = req.body
      const result = await appliesCollection.insertOne(data)
      res.send(result)
    })

    // applies get 
    app.get('/applies',verifyToken, async (req, res) => {
      const result = await appliesCollection.find().toArray()
      res.send(result)
    })

    // applies get by email query  
    app.get('/applies/app',verifyToken, async (req, res) => {
      const email = req.query.email
      const query = { UserEmail: email }
      const result = await appliesCollection.find(query).toArray()
      res.send(result)
    })

    // applies get By id 
    app.get('/applies/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await appliesCollection.findOne(query)
      res.send(result)
    })

    // applies get By id 
    app.delete('/applies/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await appliesCollection.deleteOne(query)
      res.send(result)
    })

    // update applies by id 
    app.patch('/applies/:id',verifyToken, async (req, res) => {
      const data = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          applicantName: data.applicantName,
          applicantPhoneNumber: data.applicantPhoneNumber,
          applicantUniversityName: data.applicantUniversityName,
          applicantAddress: data.applicantAddress,
          gender: data.gender,
          applicantSubjectCategory: data.applicantSubjectCategory,
          applicantScholarshipCategory: data.applicantScholarshipCategory,
          applicantDegree: data.applicantDegree,
          SSCresult: data.SSCresult,
          HSCresult: data.HSCresult,
          feedBack: data.feedBack,
          status: data.status,
          applicantImage: data.applicantImage
        }
      }
      const result = await appliesCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // payment post 
    app.post('/payments',verifyToken, async (req, res) => {
      const data = req.body
      const result = await paymentsCollection.insertOne(data)
      res.send(result)
    })

    // payment intent 
    app.post('/create-payment-intent',verifyToken, async (req, res) => {
      const { fees } = req.body
      const amount = parseInt(fees * 100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server is running..............')
})
app.listen(port, () => {
  console.log(`server in running on port : ${port}`)
})