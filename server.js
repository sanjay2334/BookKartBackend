require('dotenv').config({path:"./.env"});
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Books =  require('./routes/Books.Routes.js');
const Users = require('./routes/User.Routes.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');

app.use(cors());


mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use(express.json());
app.use(cookieParser());

const path = 4000
app.use('/books',require('./routes/Books.Routes.js'));
app.use('/users', require('./routes/User.Routes.js'));

app.get('/',(req,res)=>{
    res.send("Hello world")
})

app.listen(path,()=>{
    console.log('Listening on port http://localhost:4000/');
})
