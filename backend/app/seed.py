import pandas as pd
import random
from datetime import datetime, timedelta
import os

ROUTES = [("DEL", "BOM"), ("DEL", "BLR"), ("BOM", "BLR"), ("DEL", "CCU"), ("BLR", "HYD"), ("MAA", "DEL")]
AIRLINES = ["IndiGo", "Air India", "Akasa Air", "SpiceJet"]
WINDOWS = [1, 7, 15, 30, 45]
BASE_FARES = {
    ("DEL", "BOM"): 5000, ("DEL", "BLR"): 6000, ("BOM", "BLR"): 4000,
    ("DEL", "CCU"): 5500, ("BLR", "HYD"): 3500, ("MAA", "DEL"): 6500
}

def generate_mock_data(days=30):
    records = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    for i in range(days):
        current_date = start_date + timedelta(days=i)
        search_date_str = current_date.strftime("%Y-%m-%d")

        for origin, dest in ROUTES:
            for window in WINDOWS:
                travel_date = current_date + timedelta(days=window)
                base = BASE_FARES[(origin, dest)]
                
                # Prices jump significantly closer to the departure date
                multiplier = 1.0 + (50 - window) * 0.015
                base_price = base * multiplier

                for airline in random.sample(AIRLINES, k=random.randint(2, 4)):
                    final_fare = round(base_price * random.uniform(0.9, 1.1))
                    
                    records.append({
                        "source": "demo_connector",
                        "airline": airline,
                        "origin": origin,
                        "destination": dest,
                        "search_date": search_date_str,
                        "travel_date": travel_date.strftime("%Y-%m-%d"),
                        "advance_days": window,
                        "total_fare": final_fare,
                        "status": "AVAILABLE"
                    })

    df = pd.DataFrame(records)
    # Save one level up in the 'data' folder
    os.makedirs("../data", exist_ok=True)
    df.to_csv("../data/sample_fares.csv", index=False)
    print(f"✅ Generated {len(df)} realistic airfare records in data/sample_fares.csv")

if __name__ == "__main__":
    generate_mock_data()
