#!/usr/bin/env python3
"""
Accurate golf rankings scraper using the exact URLs provided
"""

import json
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
import re

async def scrape_owgr():
    """Scrape OWGR from https://www.owgr.com/current-world-ranking"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            print("Loading OWGR: https://www.owgr.com/current-world-ranking")
            await page.goto('https://www.owgr.com/current-world-ranking', wait_until='networkidle', timeout=30000)
            
            # Wait for table to load
            await page.wait_for_selector('table', timeout=10000)
            
            rankings = []
            
            # Get all table rows
            rows = await page.query_selector_all('table tbody tr')
            
            for row in rows:  # Get ALL available rows
                try:
                    # Get all cells in the row
                    cells = await row.query_selector_all('td')
                    
                    if len(cells) >= 4:
                        # Extract rank, name, and points
                        rank_cell = await cells[1].inner_text()  # Second column is rank
                        name_cell = await cells[3].inner_text()  # Fourth column is name
                        points_cell = await cells[4].inner_text()  # Fifth column is points
                        
                        # Clean up the data
                        rank = rank_cell.strip()
                        name = name_cell.strip()
                        points = points_cell.strip()
                        
                        if rank and name and rank.replace('-','').replace('\n','').isdigit():
                            # Extract just the number from rank (remove arrows/changes)
                            rank_num = re.search(r'\d+', rank)
                            if rank_num:
                                rankings.append({
                                    'rank': rank_num.group(),
                                    'player': name,
                                    'points': points
                                })
                except Exception as e:
                    continue
            
            await browser.close()
            print(f"✅ Scraped {len(rankings)} OWGR rankings")
            return rankings
            
        except Exception as e:
            print(f"❌ Error scraping OWGR: {e}")
            await browser.close()
            return []

async def scrape_datagolf():
    """Scrape Data Golf from https://datagolf.com/datagolf-rankings"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            print("Loading Data Golf: https://datagolf.com/datagolf-rankings")
            await page.goto('https://datagolf.com/datagolf-rankings', wait_until='networkidle', timeout=30000)
            
            # Wait for rankings to load
            await page.wait_for_timeout(3000)
            
            rankings = []
            
            # Try to find the ranking table or list
            # Data Golf might use a different structure
            selectors = [
                'table tbody tr',
                '.ranking-row',
                '[class*="player"]',
                'div[class*="rank"]'
            ]
            
            for selector in selectors:
                elements = await page.query_selector_all(selector)
                if elements and len(elements) > 5:
                    print(f"Found {len(elements)} elements with selector: {selector}")
                    
                    for i, element in enumerate(elements, 1):
                        text = await element.inner_text()
                        
                        # Parse the text to extract player info
                        lines = text.strip().split('\n')
                        if lines:
                            # Try to extract player name
                            for line in lines:
                                if line and not line.isdigit() and len(line) > 3:
                                    rankings.append({
                                        'rank': str(i),
                                        'player': line.strip(),
                                        'rating': 'N/A'  # Will need to extract if available
                                    })
                                    break
                    
                    if rankings:
                        break
            
            await browser.close()
            print(f"✅ Scraped {len(rankings)} Data Golf rankings")
            return rankings
            
        except Exception as e:
            print(f"❌ Error scraping Data Golf: {e}")
            await browser.close()
            return []

async def scrape_fedex():
    """Scrape FedEx Cup from https://www.pgatour.com/fedexcup"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            print("Loading FedEx Cup: https://www.pgatour.com/fedexcup")
            await page.goto('https://www.pgatour.com/fedexcup', wait_until='networkidle', timeout=30000)
            
            # Wait for content to load
            await page.wait_for_timeout(5000)
            
            standings = []
            
            # PGA Tour website structure
            selectors = [
                'table tbody tr',
                '.standings-table tr',
                '[class*="leaderboard"] tr',
                '.player-row',
                '[data-player]'
            ]
            
            for selector in selectors:
                elements = await page.query_selector_all(selector)
                if elements and len(elements) > 5:
                    print(f"Found {len(elements)} elements with selector: {selector}")
                    
                    for element in elements:
                        text = await element.inner_text()
                        
                        # Parse the row
                        parts = text.split('\t')
                        if len(parts) >= 2:
                            # Try to identify rank, player, points
                            rank = None
                            player = None
                            points = None
                            
                            for part in parts:
                                part = part.strip()
                                if part.isdigit() and not rank:
                                    rank = part
                                elif part and len(part) > 3 and not part.isdigit() and not player:
                                    player = part
                                elif part and not points:
                                    points = part
                            
                            if rank and player:
                                standings.append({
                                    'rank': rank,
                                    'player': player,
                                    'points': points or 'N/A'
                                })
                    
                    if standings:
                        break
            
            await browser.close()
            print(f"✅ Scraped {len(standings)} FedEx Cup standings")
            return standings
            
        except Exception as e:
            print(f"❌ Error scraping FedEx Cup: {e}")
            await browser.close()
            return []

async def main():
    """Main function to scrape all three sites"""
    print("="*60)
    print("ACCURATE GOLF RANKINGS SCRAPER")
    print("Using exact URLs provided")
    print("="*60)
    
    # Run all three scrapers
    print("\nScraping all three sites...")
    owgr, datagolf, fedex = await asyncio.gather(
        scrape_owgr(),
        scrape_datagolf(),
        scrape_fedex()
    )
    
    # Clean up OWGR data (remove entries with bad player names)
    owgr_clean = []
    for entry in owgr:
        if entry['player'] and not entry['player'].startswith('-') and len(entry['player']) > 3:
            owgr_clean.append(entry)
    
    # Save the real data
    rankings_data = {
        'timestamp': datetime.now().isoformat(),
        'source': 'Real scraped data from official sites',
        'owgr': owgr_clean,  # ALL available players
        'datagolf': datagolf,  # ALL available players
        'fedex': fedex  # ALL available players
    }
    
    # Save to file
    with open('rankings_data.json', 'w') as f:
        json.dump(rankings_data, f, indent=2)
    
    print("\n" + "="*60)
    print("SCRAPING COMPLETE - REAL DATA")
    print(f"✅ OWGR: {len(owgr_clean)} players")
    print(f"✅ Data Golf: {len(datagolf)} players")
    print(f"✅ FedEx Cup: {len(fedex)} players")
    print("="*60)
    
    # Show top 5 from each
    if owgr_clean:
        print("\n🏆 Top 5 OWGR (REAL):")
        for p in owgr_clean[:5]:
            print(f"  {p['rank']}. {p['player']} - {p['points']} pts")
    
    if datagolf:
        print("\n📊 Top 5 Data Golf (REAL):")
        for p in datagolf[:5]:
            print(f"  {p['rank']}. {p['player']} - {p.get('rating', 'N/A')}")
    
    if fedex:
        print("\n🏌️ Top 5 FedEx Cup (REAL):")
        for p in fedex[:5]:
            print(f"  {p['rank']}. {p['player']} - {p.get('points', 'N/A')}")
    
    return rankings_data

if __name__ == "__main__":
    asyncio.run(main())