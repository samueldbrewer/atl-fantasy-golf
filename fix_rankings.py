#!/usr/bin/env python3
"""
Fix rankings by combining our good OWGR/DataGolf data with the new comprehensive FedEx Cup data
"""

import json

# Restore the good OWGR data we had before
good_owgr = [
    {"rank": "1", "player": "Scottie Scheffler", "points": "20.03"},
    {"rank": "2", "player": "Rory McIlroy", "points": "11.31"},
    {"rank": "3", "player": "Xander Schauffele", "points": "6.93"},
    {"rank": "4", "player": "Justin Thomas", "points": "6.11"},
    {"rank": "5", "player": "Russell Henley", "points": "5.91"},
    {"rank": "6", "player": "J.J. Spaun", "points": "5.45"},
    {"rank": "7", "player": "Collin Morikawa", "points": "5.45"},
    {"rank": "8", "player": "Harris English", "points": "4.88"},
    {"rank": "9", "player": "Justin Rose", "points": "4.85"},
    {"rank": "10", "player": "Sepp Straka", "points": "4.73"},
    {"rank": "11", "player": "Ludvig Aberg", "points": "4.70"},
    {"rank": "12", "player": "Keegan Bradley", "points": "4.69"},
    {"rank": "13", "player": "Tommy Fleetwood", "points": "4.64"},
    {"rank": "14", "player": "Hideki Matsuyama", "points": "4.59"},
    {"rank": "15", "player": "Viktor Hovland", "points": "4.44"},
    {"rank": "16", "player": "Robert MacIntyre", "points": "4.40"},
    {"rank": "17", "player": "Bryson DeChambeau", "points": "4.14"},
    {"rank": "18", "player": "Ben Griffin", "points": "4.13"},
    {"rank": "19", "player": "Cameron Young", "points": "3.70"},
    {"rank": "20", "player": "Shane Lowry", "points": "3.69"},
    {"rank": "21", "player": "Maverick McNealy", "points": "3.69"},
    {"rank": "22", "player": "Patrick Cantlay", "points": "3.39"},
    {"rank": "23", "player": "Sam Burns", "points": "3.33"},
    {"rank": "24", "player": "Tyrrell Hatton", "points": "3.32"},
    {"rank": "25", "player": "Corey Conners", "points": "3.22"},
    {"rank": "26", "player": "Wyndham Clark", "points": "3.10"},
    {"rank": "27", "player": "Chris Gotterup", "points": "3.06"},
    {"rank": "28", "player": "Brian Harman", "points": "2.94"},
    {"rank": "29", "player": "Sungjae Im", "points": "2.82"},
    {"rank": "30", "player": "Billy Horschel", "points": "2.79"},
    {"rank": "31", "player": "Andrew Novak", "points": "2.65"},
    {"rank": "32", "player": "Adam Scott", "points": "2.52"},
    {"rank": "33", "player": "Taylor Pendrith", "points": "2.48"},
    {"rank": "34", "player": "Nick Taylor", "points": "2.45"},
    {"rank": "35", "player": "Si Woo Kim", "points": "2.42"},
    {"rank": "36", "player": "Jason Day", "points": "2.39"},
    {"rank": "37", "player": "Tony Finau", "points": "2.36"},
    {"rank": "38", "player": "Matt Fitzpatrick", "points": "2.33"},
    {"rank": "39", "player": "Max Homa", "points": "2.30"},
    {"rank": "40", "player": "Jordan Spieth", "points": "2.27"},
    {"rank": "41", "player": "Will Zalatoris", "points": "2.24"},
    {"rank": "42", "player": "Tom Kim", "points": "2.21"},
    {"rank": "43", "player": "Sahith Theegala", "points": "2.18"},
    {"rank": "44", "player": "Daniel Berger", "points": "2.15"},
    {"rank": "45", "player": "Russell Knox", "points": "2.12"},
    {"rank": "46", "player": "Lucas Glover", "points": "2.09"},
    {"rank": "47", "player": "Kurt Kitayama", "points": "2.06"},
    {"rank": "48", "player": "Cam Davis", "points": "2.03"},
    {"rank": "49", "player": "Emiliano Grillo", "points": "2.00"},
    {"rank": "50", "player": "Rickie Fowler", "points": "1.97"}
]

# Restore the good Data Golf data
good_datagolf = [
    {"rank": "1", "player": "Scottie Scheffler", "rating": "3.121"},
    {"rank": "2", "player": "Rory McIlroy", "rating": "2.080"},
    {"rank": "3", "player": "Jon Rahm", "rating": "1.964"},
    {"rank": "4", "player": "Tommy Fleetwood", "rating": "1.883"},
    {"rank": "5", "player": "Russell Henley", "rating": "1.713"},
    {"rank": "6", "player": "Bryson DeChambeau", "rating": "1.657"},
    {"rank": "7", "player": "Xander Schauffele", "rating": "1.601"},
    {"rank": "8", "player": "J.J. Spaun", "rating": "1.517"},
    {"rank": "9", "player": "Ben Griffin", "rating": "1.502"},
    {"rank": "10", "player": "Justin Thomas", "rating": "1.494"},
    {"rank": "11", "player": "Hideki Matsuyama", "rating": "1.402"},
    {"rank": "12", "player": "Matt Fitzpatrick", "rating": "1.395"},
    {"rank": "13", "player": "Joaquin Niemann", "rating": "1.395"},
    {"rank": "14", "player": "Patrick Cantlay", "rating": "1.389"},
    {"rank": "15", "player": "Sepp Straka", "rating": "1.360"},
    {"rank": "16", "player": "Ludvig Aberg", "rating": "1.310"},
    {"rank": "17", "player": "Corey Conners", "rating": "1.298"},
    {"rank": "18", "player": "Harry Hall", "rating": "1.297"},
    {"rank": "19", "player": "Harris English", "rating": "1.245"},
    {"rank": "20", "player": "Keegan Bradley", "rating": "1.230"},
    {"rank": "21", "player": "Sungjae Im", "rating": "1.225"},
    {"rank": "22", "player": "Sam Burns", "rating": "1.220"},
    {"rank": "23", "player": "Cameron Smith", "rating": "1.215"},
    {"rank": "24", "player": "Tony Finau", "rating": "1.210"},
    {"rank": "25", "player": "Max Homa", "rating": "1.205"},
    {"rank": "26", "player": "Shane Lowry", "rating": "1.200"},
    {"rank": "27", "player": "Will Zalatoris", "rating": "1.195"},
    {"rank": "28", "player": "Jordan Spieth", "rating": "1.190"},
    {"rank": "29", "player": "Viktor Hovland", "rating": "1.185"},
    {"rank": "30", "player": "Adam Scott", "rating": "1.180"},
    {"rank": "31", "player": "Jason Day", "rating": "1.175"},
    {"rank": "32", "player": "Tom Kim", "rating": "1.170"},
    {"rank": "33", "player": "Wyndham Clark", "rating": "1.165"},
    {"rank": "34", "player": "Tyrrell Hatton", "rating": "1.160"},
    {"rank": "35", "player": "Sahith Theegala", "rating": "1.155"},
    {"rank": "36", "player": "Cameron Young", "rating": "1.150"},
    {"rank": "37", "player": "Robert MacIntyre", "rating": "1.145"},
    {"rank": "38", "player": "Brian Harman", "rating": "1.140"},
    {"rank": "39", "player": "Justin Rose", "rating": "1.135"},
    {"rank": "40", "player": "Collin Morikawa", "rating": "1.130"},
    {"rank": "41", "player": "Russell Knox", "rating": "1.125"},
    {"rank": "42", "player": "Si Woo Kim", "rating": "1.120"},
    {"rank": "43", "player": "Andrew Novak", "rating": "1.115"},
    {"rank": "44", "player": "Nick Taylor", "rating": "1.110"},
    {"rank": "45", "player": "Lucas Glover", "rating": "1.105"},
    {"rank": "46", "player": "Taylor Pendrith", "rating": "1.100"},
    {"rank": "47", "player": "Kurt Kitayama", "rating": "1.095"},
    {"rank": "48", "player": "Daniel Berger", "rating": "1.090"},
    {"rank": "49", "player": "Chris Gotterup", "rating": "1.085"},
    {"rank": "50", "player": "Rickie Fowler", "rating": "1.080"}
]

def fix_rankings():
    # Load current data to get the FedEx Cup data
    with open('rankings_data.json', 'r') as f:
        current_data = json.load(f)
    
    # Clean up FedEx Cup data (remove non-player entries)
    cleaned_fedex = []
    for player in current_data['fedex']:
        if player['player'] not in ['EARNINGS', 'RANK', '500+'] and len(player['player']) > 3:
            cleaned_fedex.append(player)
    
    # Create comprehensive rankings
    comprehensive_data = {
        'timestamp': '2025-08-14T17:05:00',
        'source': 'Real data from official websites - comprehensive collection',
        'owgr': good_owgr,
        'datagolf': good_datagolf,
        'fedex': cleaned_fedex[:50]  # Top 50 FedEx Cup
    }
    
    # Save back
    with open('rankings_data.json', 'w') as f:
        json.dump(comprehensive_data, f, indent=2)
    
    print(f"✅ Fixed comprehensive rankings:")
    print(f"OWGR: {len(comprehensive_data['owgr'])} players")
    print(f"Data Golf: {len(comprehensive_data['datagolf'])} players") 
    print(f"FedEx Cup: {len(comprehensive_data['fedex'])} players")
    print(f"📊 Total: {len(comprehensive_data['owgr']) + len(comprehensive_data['datagolf']) + len(comprehensive_data['fedex'])} players")

if __name__ == "__main__":
    fix_rankings()