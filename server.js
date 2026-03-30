import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_PATH = join(__dirname, 'dist');

console.log('__dirname:', __dirname);
console.log('DIST_PATH:', DIST_PATH);
console.log('dist exists:', fs.existsSync(DIST_PATH));

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(DIST_PATH));

// SPA fallback
app.use((req, res) => {
    console.log(`Fallback for URL: ${req.url}`);
    const indexPath = join(DIST_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('index.html not found at ' + indexPath);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
