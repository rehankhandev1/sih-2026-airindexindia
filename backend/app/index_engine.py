import pandas as pd
import numpy as np
import os

DATA_PATH = "../data/sample_fares.csv"

def load_data():
    if not os.path.exists(DATA_PATH):
        return pd.DataFrame()
    return pd.read_csv(DATA_PATH)

def calculate_current_index():
    df = load_data()
    if df.empty:
        return {"error": "No data found"}

    df['search_date'] = pd.to_datetime(df['search_date'])
    min_date = df['search_date'].min()
    ref_period_end = min_date + pd.Timedelta(days=7)

    ref_data = df[df['search_date'] <= ref_period_end]
    current_data = df[df['search_date'] == df['search_date'].max()]

    if current_data.empty:
        return {"index": 100.0}

    ref_avg = ref_data.groupby(['origin', 'destination'])['total_fare'].mean().reset_index()
    curr_avg = current_data.groupby(['origin', 'destination'])['total_fare'].mean().reset_index()

    merged = pd.merge(curr_avg, ref_avg, on=['origin', 'destination'], suffixes=('_curr', '_ref'))
    merged['price_relative'] = merged['total_fare_curr'] / merged['total_fare_ref']

    geometric_index = 100 * np.exp(np.mean(np.log(merged['price_relative'])))

    return {
        "index": round(geometric_index, 2),
        "latest_date": current_data['search_date'].max().strftime("%Y-%m-%d"),
        "routes_tracked": len(merged),
        "observations_processed": len(current_data)
    }

def get_route_metrics():
    df = load_data()
    if df.empty:
        return []
    
    # Convert search_date to datetime so the filter works correctly
    df['search_date'] = pd.to_datetime(df['search_date'])
    latest_date = df['search_date'].max()
    latest_data = df[df['search_date'] == latest_date]
    
    grouped = latest_data.groupby(['origin', 'destination', 'advance_days'])['total_fare'].mean().round().reset_index()
    return grouped.to_dict(orient='records')