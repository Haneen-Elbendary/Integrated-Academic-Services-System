const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config({ path: './.env' });

const app = require('./app');

// Database Connection
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log('✅ Database connected successfully!'))
  .catch((err) => console.error('❌ Database connection error:', err));

const PORT = 3000 | process.env.PORT;

// Start the Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}...`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.name, err.message);
  console.log('🛑 Shutting down server...');
  server.close(() => process.exit(1));
});
