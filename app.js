const express = require('express');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDataBase = require('./config/connectDataBase');
const sapRoutes = require('./routes/sapRoutes.js'); 

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

connectDataBase(); // MongoDB connection

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sap', sapRoutes);

// Server
app.listen(process.env.PORT || 8080, () => {
  console.log("🚀 Server running on port", process.env.PORT || 8080);
});
