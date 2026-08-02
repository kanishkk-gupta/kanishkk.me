import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import contactHandler from './api/contact.js';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
    // Vercel serverless functions handle req/res directly
    await chatHandler(req, res);
});

// Mount the contact serverless function
app.post('/api/contact', async (req, res) => {
    await contactHandler(req, res);
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`🚀 Chatbot backend running on http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});
