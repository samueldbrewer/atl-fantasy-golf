#!/usr/bin/env python3
"""
Comprehensive scraper to get ALL available players from golf ranking sites
"""

import json
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
import re
import requests
from bs4 import BeautifulSoup

def get_fedex_cup_direct():
    """Get FedEx Cup data directly via HTTP request"""
    try:
        url = "https://www.espn.com/golf/stats/player/_/table/general/sort/cupPoints/dir/desc"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        fedex_standings = []
        
        # Find all table rows with player data
        rows = soup.find_all('tr', class_='Table__TR')
        
        for i, row in enumerate(rows, 1):
            try:
                # Get player name
                name_cell = row.find('a', class_='AnchorLink')
                if name_cell:
                    player_name = name_cell.text.strip()
                    
                    # Get FedEx Cup points (usually in the last td)
                    cells = row.find_all('td')
                    points = 'N/A'
                    for cell in reversed(cells):
                        text = cell.text.strip()
                        if text and text.replace(',', '').isdigit():
                            points = text
                            break
                    
                    fedex_standings.append({
                        'rank': str(i),
                        'player': player_name,
                        'points': points
                    })
            except Exception as e:
                continue
        
        print(f"✅ Got {len(fedex_standings)} FedEx Cup players via direct scraping")
        return fedex_standings
        
    except Exception as e:
        print(f"❌ Error getting FedEx Cup data: {e}")
        return []

async def get_owgr_comprehensive():
    """Get comprehensive OWGR data with all available players"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("Loading OWGR comprehensive data...")
            await page.goto('https://www.owgr.com/current-world-ranking', wait_until='networkidle', timeout=30000)
            
            # Wait for table to load
            await page.wait_for_selector('table', timeout=10000)
            
            rankings = []
            
            # Get ALL table rows
            rows = await page.query_selector_all('table tbody tr')
            print(f"Found {len(rows)} total OWGR rows")
            
            for row in rows:
                try:
                    # Get all cells in the row
                    cells = await row.query_selector_all('td')
                    
                    if len(cells) >= 4:
                        # Extract rank, name, and points
                        rank_cell = await cells[1].inner_text()
                        name_cell = await cells[3].inner_text()
                        points_cell = await cells[4].inner_text()
                        
                        # Clean up the data
                        rank = rank_cell.strip()
                        name = name_cell.strip()
                        points = points_cell.strip()
                        
                        if rank and name and rank.replace('-','').replace('\n','').replace(' ','').isdigit():
                            # Extract just the number from rank
                            rank_num = re.search(r'\d+', rank)
                            if rank_num and name and len(name) > 2:
                                rankings.append({
                                    'rank': rank_num.group(),
                                    'player': name,
                                    'points': points
                                })
                except Exception as e:
                    continue
            
            await browser.close()
            print(f"✅ Scraped {len(rankings)} OWGR players")
            return rankings
            
        except Exception as e:
            print(f"❌ Error scraping OWGR: {e}")
            await browser.close()
            return []

async def get_datagolf_comprehensive():
    """Get comprehensive Data Golf rankings"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("Loading Data Golf comprehensive data...")
            await page.goto('https://datagolf.com/datagolf-rankings', wait_until='networkidle', timeout=30000)
            
            await page.wait_for_timeout(5000)
            
            rankings = []
            
            # Try to find ranking table/list with ALL players
            selectors = [
                'table tbody tr',
                '.ranking-table tr',
                '[class*="player-row"]',
                'div[class*="rank"]'
            ]
            
            for selector in selectors:
                elements = await page.query_selector_all(selector)
                if elements and len(elements) > 10:
                    print(f"Found {len(elements)} Data Golf elements with selector: {selector}")
                    
                    for i, element in enumerate(elements, 1):
                        try:
                            text = await element.inner_text()
                            
                            # Parse player info from text
                            lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
                            
                            for line in lines:
                                # Look for player names (not numbers, not very short)
                                if line and not line.isdigit() and len(line) > 3 and not line.startswith('+') and not line.startswith('-'):
                                    # Skip headers and other non-player text
                                    if 'ranking' not in line.lower() and 'amateur' not in line.lower():
                                        rankings.append({
                                            'rank': str(len(rankings) + 1),
                                            'player': line.strip(),
                                            'rating': 'N/A'
                                        })
                                        break
                        except Exception as e:
                            continue
                    
                    if len(rankings) > 10:
                        break
            
            # Remove duplicates while preserving order
            seen = set()
            unique_rankings = []
            for player in rankings:
                if player['player'] not in seen:
                    seen.add(player['player'])
                    unique_rankings.append(player)
            
            await browser.close()
            print(f"✅ Scraped {len(unique_rankings)} Data Golf players")
            return unique_rankings[:100]  # Cap at 100 to avoid duplicates
            
        except Exception as e:
            print(f"❌ Error scraping Data Golf: {e}")
            await browser.close()
            return []

async def main():
    """Main function to get comprehensive data from all sites"""
    print("="*70)
    print("COMPREHENSIVE GOLF RANKINGS SCRAPER")
    print("Getting ALL available players from each site")
    print("="*70)
    
    # Get data from all sources
    print("\n1. Getting FedEx Cup data...")
    fedex = get_fedex_cup_direct()
    
    print("\n2. Getting OWGR data...")
    owgr = await get_owgr_comprehensive()
    
    print("\n3. Getting Data Golf data...")
    datagolf = await get_datagolf_comprehensive()
    
    # Save comprehensive data
    rankings_data = {
        'timestamp': datetime.now().isoformat(),
        'source': 'Comprehensive scraping - ALL available players',
        'owgr': owgr,
        'datagolf': datagolf,
        'fedex': fedex
    }
    
    # Save to file
    with open('rankings_data.json', 'w') as f:
        json.dump(rankings_data, f, indent=2)
    
    print("\n" + "="*70)
    print("COMPREHENSIVE SCRAPING COMPLETE")
    print(f"✅ OWGR: {len(owgr)} players")
    print(f"✅ Data Golf: {len(datagolf)} players")
    print(f"✅ FedEx Cup: {len(fedex)} players")
    print(f"📊 Total players collected: {len(owgr) + len(datagolf) + len(fedex)}")
    print("="*70)
    
    # Show sample from each
    if owgr:
        print(f"\n🏆 OWGR Top 5 (of {len(owgr)}):")
        for p in owgr[:5]:
            print(f"  {p['rank']}. {p['player']} - {p['points']} pts")
    
    if datagolf:
        print(f"\n📊 Data Golf Top 5 (of {len(datagolf)}):")
        for p in datagolf[:5]:
            print(f"  {p['rank']}. {p['player']} - {p.get('rating', 'N/A')}")
    
    if fedex:
        print(f"\n🏌️ FedEx Cup Top 5 (of {len(fedex)}):")
        for p in fedex[:5]:
            print(f"  {p['rank']}. {p['player']} - {p.get('points', 'N/A')}")
    
    return rankings_data

if __name__ == "__main__":
    asyncio.run(main())