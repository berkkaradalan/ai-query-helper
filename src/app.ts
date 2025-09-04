import express from 'express';
import itemRoutes from './routes/databasesRoutes';
import connectionRoutes from './routes/connectionRoutes'
import config from './config/config';
import { connectMongoDB } from './config/mongoose';

const app = express();

app.use(express.json());

app.use('/api/databases', itemRoutes);
app.use('/api/connection', connectionRoutes)

connectMongoDB().then(() => {
  app.listen(config.port, config.host, () => {
    console.log(`Server is running on ${config.host}:${config.port}`);
  });
});