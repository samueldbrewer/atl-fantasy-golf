const express = require('express');
const path = require('path');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Fantasy Golf server is running' });
});

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Use Railway's PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fantasy Golf app running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});