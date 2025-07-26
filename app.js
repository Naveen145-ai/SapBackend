const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDataBase = require('./config/connectDataBase');
const sapRoutes = require('./routes/sapRoutes');
const mentorRoutes = require('./routes/mentorAuthRoutes');
const userRoutes = require('./routes/userAuthRoutes');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

const app = express();

connectDataBase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/sap', sapRoutes);
app.use('/api/sap',mentorRoutes);
app.use('/api/sap',userRoutes);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
