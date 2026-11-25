# ArtisanAI Backend (Node.js + Express + MongoDB)

## Run
1. npm install
2. Open .env and set MONGODB_URI (MongoDB Atlas link or local MongoDB)
3. npm run dev
4. Test: GET http://localhost:5000/api/health

## Folder structure
- server.js: starts the app
- src/app.js: middleware and routes
- src/config/db.js: MongoDB connection
- src/middleware: error handler and 404 handler
- src/modules/<feature>: each feature (health, auth, products ...) in its own folder
- src/utils/response.js: common JSON response format
