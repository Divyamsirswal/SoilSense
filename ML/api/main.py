import os
import sys
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field

# Add the parent directory to the path to import from the config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import config
from utils.data_utils import normalize_features
from api.predict import load_model, get_latest_model, generate_recommendation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SoilGuardian Crop Recommendation API",
    description="API for getting crop recommendations based on soil data",
    version="1.0.0"
)

# Define input model
class SoilData(BaseModel):
    ph: float = Field(..., description="Soil pH value", ge=0, le=14)
    temperature: float = Field(..., description="Temperature in Celsius", ge=-10, le=60)
    humidity: float = Field(..., description="Humidity percentage", ge=0, le=100)
    nitrogen: float = Field(..., description="Nitrogen content (N)", ge=0, le=200)
    phosphorus: float = Field(..., description="Phosphorus content (P)", ge=0, le=200)
    potassium: float = Field(..., description="Potassium content (K)", ge=0, le=200)
    organic_matter: Optional[float] = Field(None, description="Organic matter percentage", ge=0, le=20)
    conductivity: Optional[float] = Field(None, description="Electrical conductivity", ge=0)
    salinity: Optional[float] = Field(None, description="Salinity", ge=0)

# Define output model
class CropRecommendation(BaseModel):
    recommended_crop: str
    confidence: float
    alternatives: List[Dict[str, Any]]
    advice: Dict[str, str]
    timestamp: str

# Global variable to store the loaded model
model = None

# Dependency to get the model
def get_model():
    global model
    if model is None:
        model_path = get_latest_model()
        if model_path is None:
            raise HTTPException(status_code=500, detail="No model found. Please train a model first.")
        model = load_model(model_path)
    return model

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SoilGuardian Crop Recommendation API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/recommend", response_model=CropRecommendation)
def recommend_crop(soil_data: SoilData, model=Depends(get_model)):
    try:
        # Convert input to DataFrame
        features = pd.DataFrame({
            'ph': [soil_data.ph],
            'temperature': [soil_data.temperature],
            'humidity': [soil_data.humidity],
            'n': [soil_data.nitrogen],
            'p': [soil_data.phosphorus],
            'k': [soil_data.potassium],
            'organic_matter': [soil_data.organic_matter or 5.0],
            'conductivity': [soil_data.conductivity or 1.0],
            'salinity': [soil_data.salinity or 1.0]
        })
        
        # Generate recommendation
        recommendation = generate_recommendation(model, features)
        
        # Check for errors
        if 'error' in recommendation:
            raise HTTPException(status_code=500, detail=recommendation['error'])
            
        return recommendation
    except Exception as e:
        logger.error(f"Error generating recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
def get_model_info(model=Depends(get_model)):
    try:
        info = {
            "model_type": type(model).__name__,
            "n_features": len(model.feature_names_in_) if hasattr(model, 'feature_names_in_') else "unknown",
            "features": list(model.feature_names_in_) if hasattr(model, 'feature_names_in_') else "unknown",
            "n_classes": len(model.classes_) if hasattr(model, 'classes_') else "unknown",
            "classes": list(model.classes_) if hasattr(model, 'classes_') else "unknown"
        }
        return info
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT) 