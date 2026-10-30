"""
WealthIQ AI - Machine Learning Forecasting Microservice
Exposes REST endpoints using FastAPI for secure cross-service forecasting.
"""

from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from forecaster import WealthIQForecaster

app = FastAPI(
    title="WealthIQ ML Forecasting Service",
    version="1.2.0",
    description="Autonomous time-series expense prediction and budget risk engine"
)

forecaster = WealthIQForecaster()

class TransactionItem(BaseModel):
    id: Optional[str] = None
    date: str
    amount: float
    category: str
    type: str
    description: Optional[str] = ""

class BudgetItem(BaseModel):
    category: str
    amount: float
    warning_threshold: Optional[float] = 0.8

class ForecastRequest(BaseModel):
    transactions: List[TransactionItem]
    budgets: Optional[List[BudgetItem]] = []

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WealthIQ Python ML Engine",
        "version": "1.2.0",
        "model": "Ridge Hybrid + EMA Baseline"
    }

@app.post("/api/forecast")
def generate_forecast(payload: ForecastRequest):
    try:
        tx_data = [t.model_dump() for t in payload.transactions]
        bg_data = [b.model_dump() for b in payload.budgets] if payload.budgets else []
        result = forecaster.forecast_next_month(tx_data, bg_data)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
