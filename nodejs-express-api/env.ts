import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';

const envFiles = [
  '.env',
  `.env.${env}`,
  '.env.local',
];

for (const envFile of envFiles) {
  dotenv.config({ path: path.resolve(__dirname, envFile) });
}

// Environment variables are now available via process.env
// Example: process.env.APP_NAME, process.env.DB_HOST, etc.
