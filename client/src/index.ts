import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI!;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Connection error', err);
    process.exit(1);
  });
