# Dynamic AI-Powered Database Query API

A TypeScript backend that connects to multiple databases (MongoDB, PostgreSQL, MySQL), generates dynamic queries using AI, and executes them safely.

## Features
- Connect to MongoDB, PostgreSQL, and MySQL dynamically
- Store multiple database connection configurations in MongoDB
- AI-assisted query generation (SQL or MongoDB) using Google Gemini AI
- Executes queries securely and returns results in structured JSON format
- Modular and extensible architecture

## Structure
```
src/
├── app.ts
├── config/
│   ├── config.ts
│   └── mongoose.ts
├── controller/
│   ├── connectionController.ts
│   └── databasesController.ts
├── models/
│   └── databases.ts
├── routes/
│   ├── connectionRoutes.ts
│   └── databasesRoutes.ts
├── utils/
│   └── prompts.ts
└── middleware/
    └── errorHandler.ts
```

## Installation
```bash
git clone <repo_url>
cd <repo_folder>
npm install
```

## Running Locally
1. Start MongoDB:
```bash
docker run -d -p 3000:3000 \
  -e GEMINI_API_KEY=secret-gemini-key \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e NODE_ENV=development \
  -e DB_USER=admin \
  -e DB_PASS=secret \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=27017 \
  -e DB_NAME=mydatabase \
  --name ai-query-helper ai-query-helper
```
2. Set `.env` variables:
```
GEMINI_API_KEY=secret-gemini-key
HOST=0.0.0.0
PORT=3000
NODE_ENV=development
DB_USER=admin
DB_PASS=secret
DB_HOST=host.docker.internal
DB_PORT=27017
DB_NAME=mydatabase
```

3. Start the app:

```bash
npm run dev
```

## API Endpoints

### Database Connections
```
- GET   /api/databases — list all connections
- POST  /api/databases — add a new connection
- GET   /api/databases/:id — get a database data
- POST  /api/connection/:id - run a manual query
- POST  /api/connection/ai/:id - run a query with ai
```
