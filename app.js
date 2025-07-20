const express = require('express');
const app = express();

const dotenv = require('dotenv');
const path = require('path');
const connectDataBase = require('./config/connectDataBase');

dotenv.config({path: path.join(__dirname, 'config', 'config.env')})

connectDataBase();

app.listen(process.env.PORT, ()=> {
    console.log("server is running in the port 8080");
    
})