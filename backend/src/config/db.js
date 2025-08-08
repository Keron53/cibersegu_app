const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firmasDB';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false
    });
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error MongoDB:', err.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};

const checkDBConnection = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, checkDBConnection };

connectDB();
