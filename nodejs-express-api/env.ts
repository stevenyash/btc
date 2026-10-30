import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const profileFile = env === 'production' ? '.env.production' : '.env.development';
const selectedProfile = path.resolve(__dirname, profileFile);

dotenv.config({ path: selectedProfile });

// Environment variables are now available via process.env
// Example: process.env.APP_NAME, process.env.DB_HOST, etc.
