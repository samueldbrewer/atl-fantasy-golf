# PGA Fantasy Golf App

## Quick Start

### Option 1: Using Python (Recommended)
```bash
python3 server.py
```
Then open http://localhost:8000 in your browser

### Option 2: Using Node.js
```bash
npx http-server -p 8000 --cors
```
Then open http://localhost:8000 in your browser

### Option 3: Using Live Server (VS Code)
If you have VS Code with Live Server extension:
1. Right-click on `index.html`
2. Select "Open with Live Server"

## Important Notes

⚠️ **The app MUST be served through a web server** (not opened as file://) for the JSON data to load properly due to CORS restrictions.

## Viewing the Data

1. Open the browser console (F12) to see debugging information
2. You should see messages like "Displaying 49 players in worldRankings"
3. The app loads data from `data/rankings.json` which contains 49 players

## Updating Rankings Data

To fetch fresh data from ESPN:
```bash
node fetch-real-data.js
```

To run the full scraper (requires puppeteer):
```bash
npm install
npm run scrape
```

## Troubleshooting

If data doesn't load:
1. Check browser console for errors
2. Ensure you're accessing via http://localhost:8000 (not file://)
3. Verify `data/rankings.json` exists
4. Check that all 49 players are in the JSON file

## Files
- `index.html` - Main app interface
- `app.js` - Frontend JavaScript
- `styles.css` - Styling
- `data/rankings.json` - Player rankings data (49 players)
- `server.py` - Simple Python server with CORS
- `fetch-real-data.js` - Fetches data from ESPN API
- `scraper.js` - Full web scraper (backup)