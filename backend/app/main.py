from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.index_engine import calculate_current_index, get_route_metrics, load_data

app = FastAPI(
    title="AirIndex India API",
    description="Real-time airfare price index prototype for SIH26056",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "AirIndex India API", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.get("/api/index/latest")
def get_latest_index():
    return calculate_current_index()

@app.get("/api/routes/metrics")
def get_route_data():
    return get_route_metrics()

@app.get("/api/fares/sample")
def get_sample_fares():
    df = load_data()
    if df.empty:
        return []
    return df.tail(50).to_dict(orient="records")