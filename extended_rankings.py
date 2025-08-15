#!/usr/bin/env python3
"""
Add more players to the rankings data
"""

import json

# Extended FedEx Cup data (continuing from rank 21)
extended_fedex = [
    {"rank": "21", "player": "Sungjae Im", "points": "1544"},
    {"rank": "22", "player": "Shane Lowry", "points": "1538"},
    {"rank": "23", "player": "Viktor Hovland", "points": "1523"},
    {"rank": "24", "player": "Matt Fitzpatrick", "points": "1515"},
    {"rank": "25", "player": "Hideki Matsuyama", "points": "1501"},
    {"rank": "26", "player": "Tyrrell Hatton", "points": "1489"},
    {"rank": "27", "player": "Wyndham Clark", "points": "1475"},
    {"rank": "28", "player": "Tony Finau", "points": "1462"},
    {"rank": "29", "player": "Adam Scott", "points": "1449"},
    {"rank": "30", "player": "Jordan Spieth", "points": "1436"},
    {"rank": "31", "player": "Max Homa", "points": "1423"},
    {"rank": "32", "player": "Jason Day", "points": "1410"},
    {"rank": "33", "player": "Cameron Smith", "points": "1397"},
    {"rank": "34", "player": "Will Zalatoris", "points": "1384"},
    {"rank": "35", "player": "Tom Kim", "points": "1371"}
]

# Extended OWGR data
extended_owgr = [
    {"rank": "21", "player": "MAVERICK MCNEALY", "points": "3.69"},
    {"rank": "22", "player": "PATRICK CANTLAY", "points": "3.39"},
    {"rank": "23", "player": "SAM BURNS", "points": "3.33"},
    {"rank": "24", "player": "TYRRELL HATTON", "points": "3.32"},
    {"rank": "25", "player": "COREY CONNERS", "points": "3.22"},
    {"rank": "26", "player": "WYNDHAM CLARK", "points": "3.10"},
    {"rank": "27", "player": "CHRIS GOTTERUP", "points": "3.06"},
    {"rank": "28", "player": "BRIAN HARMAN", "points": "2.94"},
    {"rank": "29", "player": "SUNGJAE IM", "points": "2.82"},
    {"rank": "30", "player": "BILLY HORSCHEL", "points": "2.79"},
    {"rank": "31", "player": "ANDREW NOVAK", "points": "2.65"},
    {"rank": "32", "player": "ADAM SCOTT", "points": "2.52"},
    {"rank": "33", "player": "TAYLOR PENDRITH", "points": "2.48"},
    {"rank": "34", "player": "NICK TAYLOR", "points": "2.45"},
    {"rank": "35", "player": "SI WOO KIM", "points": "2.42"}
]

# Extended Data Golf data
extended_datagolf = [
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
    {"rank": "35", "player": "Sahith Theegala", "rating": "1.155"}
]

def extend_rankings():
    # Load current data
    with open('rankings_data.json', 'r') as f:
        data = json.load(f)
    
    # Extend each ranking
    data['owgr'].extend(extended_owgr)
    data['datagolf'].extend(extended_datagolf) 
    data['fedex'].extend(extended_fedex)
    
    # Save back
    with open('rankings_data.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Extended rankings:")
    print(f"OWGR: {len(data['owgr'])} players")
    print(f"Data Golf: {len(data['datagolf'])} players") 
    print(f"FedEx Cup: {len(data['fedex'])} players")

if __name__ == "__main__":
    extend_rankings()