const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

const connectDataBase = require('./config/connectDataBase');
const sapRoutes = require('./routes/sapRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const userRoutes = require('./routes/userAuthRoutes');
const mentorDashboard = require('./routes/mentorRoutes');

dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

const app = express();

connectDataBase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field. Please check field names.' });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

app.use('/api/sap', sapRoutes);
app.use('/api/sap',mentorRoutes);
app.use('/api/sap',userRoutes);
app.use('/api/mentor', mentorDashboard); // ✅ correct route


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
