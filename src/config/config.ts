import dotenv from 'dotenv';

dotenv.config();

interface Config {
  host: string;
  port: number;
  nodeEnv: string;
  dbUser: string;
  dbPass: string;
  dbHost: string;
  dbName: string;
  dbPort: string;
  geminiApiKey: string;
}

const config: Config = {
  host: process.env.HOST || 'http://localhost',
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUser: process.env.DB_USER || 'mongodbuser',
  dbPass: process.env.DB_PASS || 'mongodbpass',
  dbHost: process.env.DB_HOST || 'mongodbhost',
  dbName: process.env.DB_NAME || 'mongodbname',
  dbPort: process.env.DB_PORT || '27017',
  geminiApiKey: process.env.GEMINI_API_KEY || 'sk-geminiapikey',
};

export default config;