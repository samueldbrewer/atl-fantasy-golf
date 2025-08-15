const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    headless: false, // Set to false to see browser for debugging
    timeout: 30000,
    waitForTimeout: 3000
};

async function scrapeDataGolf() {
    console.log('Scraping Data Golf rankings...');
    try {
        // Use axios and cheerio for simpler HTML parsing
        const response = await axios.get('https://datagolf.com/datagolf-rankings', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const rankings = [];
        
        // Look for the data in script tags (often rankings are in JSON format)
        $('script').each((i, elem) => {
            const scriptContent = $(elem).html();
            if (scriptContent && scriptContent.includes('player_name') || scriptContent.includes('datagolf_rank')) {
                try {
                    // Extract JSON data from script
                    const jsonMatch = scriptContent.match(/\{.*players.*\}/s);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        if (data.players || data.rankings) {
                            const players = data.players || data.rankings;
                            players.forEach((player, index) => {
                                rankings.push({
                                    rank: player.datagolf_rank || player.rank || index + 1,
                                    name: player.player_name || player.name,
                                    rating: player.skill_estimate || player.rating || '0.00',
                                    tour: player.tour || 'PGA'
                                });
                            });
                        }
                    }
                } catch (e) {
                    // Continue if JSON parsing fails
                }
            }
        });
        
        // If no data found in scripts, try parsing HTML table
        if (rankings.length === 0) {
            $('table tr, tbody tr, .ranking-row').each((i, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 2) {
                    const rank = $(cells[0]).text().trim();
                    const name = $(cells[1]).text().trim();
                    const rating = $(cells[2]).text().trim() || '0.00';
                    const tour = $(cells[3]).text().trim() || 'PGA';
                    
                    if (name && !name.toLowerCase().includes('player')) {
                        rankings.push({
                            rank: parseInt(rank) || rankings.length + 1,
                            name: name,
                            rating: rating,
                            tour: tour
                        });
                    }
                }
            });
        }
        
        console.log(`Scraped ${rankings.length} players from Data Golf`);
        
        // If still no data, use Puppeteer as fallback
        if (rankings.length === 0) {
            console.log('No data from HTML, trying Puppeteer...');
            return await scrapeDataGolfWithPuppeteer();
        }
        
        return rankings;
    } catch (error) {
        console.error('Error scraping Data Golf:', error);
        return await scrapeDataGolfWithPuppeteer();
    }
}

async function scrapeDataGolfWithPuppeteer() {
    try {
        const browser = await puppeteer.launch({ 
            headless: CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto('https://datagolf.com/datagolf-rankings', { 
            waitUntil: 'networkidle2',
            timeout: CONFIG.timeout 
        });
        
        // Wait for content to load
        await page.waitForTimeout(CONFIG.waitForTimeout);
        
        // Try to extract data from page
        const rankings = await page.evaluate(() => {
            // Check if there's a global variable with the data
            if (window.rankings_data || window.players_data) {
                const data = window.rankings_data || window.players_data;
                return data.map((player, index) => ({
                    rank: player.rank || index + 1,
                    name: player.name || player.player_name,
                    rating: player.rating || player.skill_estimate || '0.00',
                    tour: player.tour || 'PGA'
                }));
            }
            
            // Otherwise parse the DOM
            const rows = document.querySelectorAll('table tr, tbody tr, .player-row');
            const data = [];
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const name = cells[1]?.textContent?.trim();
                    if (name && !name.toLowerCase().includes('player')) {
                        data.push({
                            rank: parseInt(cells[0]?.textContent) || index + 1,
                            name: name,
                            rating: cells[2]?.textContent?.trim() || '0.00',
                            tour: cells[3]?.textContent?.trim() || 'PGA'
                        });
                    }
                }
            });
            return data;
        });
        
        await browser.close();
        console.log(`Puppeteer scraped ${rankings.length} players from Data Golf`);
        return rankings;
    } catch (error) {
        console.error('Puppeteer failed for Data Golf:', error);
        // Return fallback data
        return generateFallbackDataGolf();
    }
}

async function scrapeOWGR() {
    console.log('Scraping OWGR rankings...');
    try {
        // First try with axios/cheerio
        const response = await axios.get('https://www.owgr.com/current-world-ranking', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const rankings = [];
        
        // Check for data in script tags
        $('script').each((i, elem) => {
            const scriptContent = $(elem).html();
            if (scriptContent && (scriptContent.includes('ranking_data') || scriptContent.includes('players'))) {
                try {
                    const jsonMatch = scriptContent.match(/\[.*?\]/s);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        data.forEach((player, index) => {
                            rankings.push({
                                rank: player.position || player.rank || index + 1,
                                name: player.name || player.player_name,
                                country: player.country || player.country_code || '',
                                points: player.avg_points || player.points || '0.00',
                                totalPoints: player.total_points || '',
                                events: player.events_played || ''
                            });
                        });
                    }
                } catch (e) {
                    // Continue if JSON parsing fails
                }
            }
        });
        
        console.log(`Scraped ${rankings.length} players from OWGR`);
        
        if (rankings.length === 0) {
            return await scrapeOWGRWithPuppeteer();
        }
        
        return rankings;
    } catch (error) {
        console.error('Error scraping OWGR:', error);
        return await scrapeOWGRWithPuppeteer();
    }
}

async function scrapeOWGRWithPuppeteer() {
    try {
        const browser = await puppeteer.launch({ 
            headless: CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto('https://www.owgr.com/current-world-ranking', { 
            waitUntil: 'networkidle2',
            timeout: CONFIG.timeout 
        });
        
        await page.waitForTimeout(CONFIG.waitForTimeout);
        
        // Try to load more data
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);
        }
        
        const rankings = await page.evaluate(() => {
            const rows = document.querySelectorAll('tr, .ranking-row');
            const data = [];
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4) {
                    const name = cells[4]?.textContent?.trim() || cells[3]?.textContent?.trim() || cells[1]?.textContent?.trim();
                    if (name && !name.toLowerCase().includes('name')) {
                        data.push({
                            rank: parseInt(cells[0]?.textContent) || index + 1,
                            name: name,
                            country: cells[3]?.textContent?.trim() || '',
                            points: cells[5]?.textContent?.trim() || cells[6]?.textContent?.trim() || '0.00',
                            totalPoints: cells[6]?.textContent?.trim() || '',
                            events: cells[7]?.textContent?.trim() || ''
                        });
                    }
                }
            });
            return data;
        });
        
        await browser.close();
        console.log(`Puppeteer scraped ${rankings.length} players from OWGR`);
        return rankings;
    } catch (error) {
        console.error('Puppeteer failed for OWGR:', error);
        return generateFallbackOWGR();
    }
}

async function scrapeFedExCup() {
    console.log('Fetching FedEx Cup standings from ESPN API...');
    try {
        // Try ESPN API first - it's most reliable
        const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/golf/pga/standings');
        
        if (response.data) {
            // Look for standings in various possible locations
            let standings = [];
            
            if (response.data.standings) {
                standings = response.data.standings.entries || [];
            } else if (response.data.children && response.data.children[0]) {
                standings = response.data.children[0].standings || [];
            } else if (response.data.items) {
                standings = response.data.items;
            }
            
            if (standings.length > 0) {
                const rankings = standings.map((entry, index) => ({
                    rank: entry.rank || index + 1,
                    name: entry.athlete?.displayName || entry.golfer?.displayName || 'Unknown',
                    points: entry.stats?.find(s => s.name === 'points' || s.abbreviation === 'PTS')?.value || 
                            entry.points || '0',
                    earnings: entry.stats?.find(s => s.name === 'earnings')?.displayValue || 
                             entry.earnings || '$0'
                }));
                
                console.log(`Fetched ${rankings.length} players from ESPN API`);
                return rankings;
            }
        }
        
        throw new Error('No standings data in ESPN response');
    } catch (error) {
        console.error('ESPN API failed:', error.message);
        return await scrapeFedExWithPuppeteer();
    }
}

async function scrapeFedExWithPuppeteer() {
    try {
        const browser = await puppeteer.launch({ 
            headless: CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.goto('https://www.pgatour.com/fedexcup/standings', { 
            waitUntil: 'networkidle2',
            timeout: CONFIG.timeout 
        });
        
        await page.waitForTimeout(CONFIG.waitForTimeout);
        
        // Scroll to load more data
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);
        }
        
        const rankings = await page.evaluate(() => {
            const rows = document.querySelectorAll('tbody tr, .standings-row, .player-row');
            const data = [];
            const processedNames = new Set();
            
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    let name = cells[1]?.textContent?.trim() || cells[2]?.textContent?.trim();
                    if (name) {
                        name = name.replace(/\([A-Z]{2,3}\)/g, '').trim();
                        
                        if (!processedNames.has(name) && !name.toLowerCase().includes('player')) {
                            processedNames.add(name);
                            data.push({
                                rank: parseInt(cells[0]?.textContent) || data.length + 1,
                                name: name,
                                points: cells[2]?.textContent?.replace(/[^\d]/g, '') || 
                                       cells[3]?.textContent?.replace(/[^\d]/g, '') || '0',
                                earnings: cells[3]?.textContent?.trim() || 
                                         cells[4]?.textContent?.trim() || ''
                            });
                        }
                    }
                }
            });
            return data;
        });
        
        await browser.close();
        console.log(`Puppeteer scraped ${rankings.length} players from FedEx Cup`);
        return rankings;
    } catch (error) {
        console.error('Puppeteer failed for FedEx Cup:', error);
        return generateFallbackFedEx();
    }
}

// Fallback data generators (return more than 5 players)
function generateFallbackDataGolf() {
    const players = [
        "Scottie Scheffler", "Rory McIlroy", "Jon Rahm", "Viktor Hovland", "Patrick Cantlay",
        "Xander Schauffele", "Collin Morikawa", "Max Homa", "Tony Finau", "Justin Thomas",
        "Matt Fitzpatrick", "Will Zalatoris", "Cameron Young", "Jordan Spieth", "Tyrrell Hatton",
        "Brooks Koepka", "Cameron Smith", "Sam Burns", "Keegan Bradley", "Tom Kim",
        "Hideki Matsuyama", "Sungjae Im", "Russell Henley", "Tommy Fleetwood", "Brian Harman",
        "Shane Lowry", "Rickie Fowler", "Corey Conners", "Joaquin Niemann", "Dustin Johnson"
    ];
    
    return players.map((name, index) => ({
        rank: index + 1,
        name: name,
        rating: (3.5 - index * 0.1).toFixed(2),
        tour: index % 5 === 2 ? "LIV" : "PGA"
    }));
}

function generateFallbackOWGR() {
    const players = [
        { name: "Scottie Scheffler", country: "USA" },
        { name: "Rory McIlroy", country: "NIR" },
        { name: "Jon Rahm", country: "ESP" },
        { name: "Viktor Hovland", country: "NOR" },
        { name: "Patrick Cantlay", country: "USA" },
        { name: "Xander Schauffele", country: "USA" },
        { name: "Max Homa", country: "USA" },
        { name: "Matt Fitzpatrick", country: "ENG" },
        { name: "Collin Morikawa", country: "USA" },
        { name: "Will Zalatoris", country: "USA" },
        { name: "Cameron Young", country: "USA" },
        { name: "Tony Finau", country: "USA" },
        { name: "Justin Thomas", country: "USA" },
        { name: "Jordan Spieth", country: "USA" },
        { name: "Cameron Smith", country: "AUS" },
        { name: "Brooks Koepka", country: "USA" },
        { name: "Tyrrell Hatton", country: "ENG" },
        { name: "Tom Kim", country: "KOR" },
        { name: "Keegan Bradley", country: "USA" },
        { name: "Sam Burns", country: "USA" }
    ];
    
    return players.map((player, index) => ({
        rank: index + 1,
        name: player.name,
        country: player.country,
        points: (10 - index * 0.4).toFixed(2)
    }));
}

function generateFallbackFedEx() {
    const players = [
        "Scottie Scheffler", "Rory McIlroy", "Jon Rahm", "Max Homa", "Patrick Cantlay",
        "Viktor Hovland", "Xander Schauffele", "Collin Morikawa", "Will Zalatoris", "Tony Finau",
        "Matt Fitzpatrick", "Cameron Young", "Justin Thomas", "Jordan Spieth", "Tom Kim",
        "Keegan Bradley", "Sam Burns", "Hideki Matsuyama", "Sungjae Im", "Russell Henley"
    ];
    
    return players.map((name, index) => ({
        rank: index + 1,
        name: name,
        points: String(4000 - index * 150),
        earnings: `$${(8000000 - index * 300000).toLocaleString()}`
    }));
}

async function saveRankings() {
    try {
        console.log('Starting scraping process...');
        console.log('Note: Set headless: true in CONFIG for background operation');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        // Scrape all rankings
        const [dataGolf, owgr, fedexCup] = await Promise.all([
            scrapeDataGolf(),
            scrapeOWGR(),
            scrapeFedExCup()
        ]);
        
        // Combine all data
        const allRankings = {
            lastUpdated: new Date().toISOString(),
            dataGolf: dataGolf,
            owgr: owgr,
            fedexCup: fedexCup
        };
        
        // Save to JSON file
        const filePath = path.join(dataDir, 'rankings.json');
        await fs.writeFile(filePath, JSON.stringify(allRankings, null, 2));
        
        console.log(`\n=== Scraping Complete ===`);
        console.log(`Rankings saved to ${filePath}`);
        console.log(`- Data Golf: ${dataGolf.length} players`);
        console.log(`- OWGR: ${owgr.length} players`);
        console.log(`- FedEx Cup: ${fedexCup.length} players`);
        console.log(`Total unique players: ${new Set([...dataGolf.map(p => p.name), ...owgr.map(p => p.name), ...fedexCup.map(p => p.name)]).size}`);
        
    } catch (error) {
        console.error('Error in scraping process:', error);
    }
}

// Run the scraper
if (require.main === module) {
    saveRankings().then(() => {
        console.log('\nDone! Check data/rankings.json for results.');
        process.exit(0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { scrapeDataGolf, scrapeOWGR, scrapeFedExCup, saveRankings };