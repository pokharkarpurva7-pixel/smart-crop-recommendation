import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
from typing import List

HERE = os.path.dirname(__file__)
MODEL_DIR = os.path.join(HERE, '..', 'models')
PIPELINE_PATH = os.path.join(MODEL_DIR, 'pipeline.joblib')
LE_PATH = os.path.join(MODEL_DIR, 'label_encoder.joblib')

if not os.path.exists(PIPELINE_PATH) or not os.path.exists(LE_PATH):
    raise FileNotFoundError("Model files not found. Run `python src/train.py` first.")

pipeline = joblib.load(PIPELINE_PATH)  # pipeline with scaler + clf
le = joblib.load(LE_PATH)
clf = pipeline.named_steps['clf']  # the trained classifier

app = FastAPI(title="Crop Recommendation API", version="0.2")

# Allow calls from local frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production change to your domain
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall']

class Features(BaseModel):
    N: float = Field(..., description="Nitrogen")
    P: float = Field(..., description="Phosphorus")
    K: float = Field(..., description="Potassium")
    temperature: float = Field(..., description="Temperature (°C)")
    humidity: float = Field(..., description="Humidity (%)")
    pH: float = Field(..., description="Soil pH")
    rainfall: float = Field(..., description="Rainfall (mm)")

class Prediction(BaseModel):
    crop: str
    probability: float

class PredictionResponse(BaseModel):
    recommendations: List[Prediction]

@app.get("/")
def root():
    return {"message": "Crop Recommendation API. POST to /predict"}

@app.post("/predict", response_model=PredictionResponse)
def predict(features: Features, top_k: int = Query(3, ge=1, le=10)):
    # Build input array in the same column order used for training
    x = np.array([[features.N, features.P, features.K,
                   features.temperature, features.humidity,
                   features.pH, features.rainfall]])
    try:
        probs = pipeline.predict_proba(x)[0]  # probabilities for each encoded class
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {e}")

    # clf.classes_ contains encoded labels in the order of probs
    encoded_classes = clf.classes_.astype(int)  # ensure int
    # map each encoded class back to crop name
    mapped = []
    for enc, p in zip(encoded_classes, probs):
        crop_name = le.inverse_transform([enc])[0]
        mapped.append((crop_name, float(p)))

    # sort by probability descending and return top_k
    mapped.sort(key=lambda x: x[1], reverse=True)
    top_k = min(top_k, len(mapped))
    recs = [Prediction(crop=name, probability=prob) for name, prob in mapped[:top_k]]
    return PredictionResponse(recommendations=recs)

@app.get("/health")
def health():
    return {"status": "ok"}