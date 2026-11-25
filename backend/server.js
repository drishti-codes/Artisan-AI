require('dns').setServers(['8.8.8.8', '1.1.1.1']);
// Entry point: loads .env, connects to MongoDB, then starts the HTTP server.
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(); // stops the app with a clear message if MongoDB is not reachable
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
