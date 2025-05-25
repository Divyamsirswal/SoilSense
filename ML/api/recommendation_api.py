import os
import sys
import pandas as pd
import logging
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field, validator
import uvicorn
import json

# Add the parent directory to the path to import from the config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from utils.data_utils import preprocess_soil_data, normalize_features
from utils.model_utils import load_model, predict_crops
from utils.recommendation_utils import generate_comprehensive_recommendation

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(config.LOGS_DIR, "api.log"))
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SoilGuardian Crop Recommendation API",
    description="API for crop recommendations based on soil data",
    version=config.MODEL_VERSION
)

# Define Pydantic models for request and response
class SoilDataInput(BaseModel):
    pH: float = Field(..., description="Soil pH level (0-14)", ge=0, le=14)
    nitrogen: float = Field(..., description="Nitrogen content in ppm", ge=0)
    phosphorus: float = Field(..., description="Phosphorus content in ppm", ge=0)
    potassium: float = Field(..., description="Potassium content in ppm", ge=0)
    moisture: float = Field(..., description="Soil moisture percentage", ge=0, le=100)
    temperature: float = Field(..., description="Soil temperature in Celsius", ge=-10, le=60)
    organicMatter: Optional[float] = Field(None, description="Organic matter percentage", ge=0, le=100)
    conductivity: Optional[float] = Field(None, description="Electrical conductivity in dS/m", ge=0)
    salinity: Optional[float] = Field(None, description="Salinity in ppt", ge=0)
    
    class Config:
        schema_extra = {
            "example": {
                "pH": 6.5,
                "nitrogen": 60,
                "phosphorus": 30,
                "potassium": 40,
                "moisture": 65,
                "temperature": 25,
                "organicMatter": 3.5,
                "conductivity": 0.8,
                "salinity": 0.5
            }
        }

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]] = Field(..., description="List of crop recommendations")
    comprehensive_recommendation: Optional[Dict[str, Any]] = Field(None, description="Comprehensive recommendation for the top crop")
    
    class Config:
        schema_extra = {
            "example": {
                "recommendations": [
                    {
                        "crop": "Wheat",
                        "confidence": 87.5,
                        "confidence_level": "High",
                        "reasoning": "pH (6.5) is within the optimal range for Wheat (6.0-7.0) and moisture (65%) is within the optimal range for Wheat (45-65%)."
                    },
                    {
                        "crop": "Corn",
                        "confidence": 75.2,
                        "confidence_level": "Medium",
                        "reasoning": "pH (6.5) is within the optimal range for Corn (5.8-7.0) and temperature (25°C) is within the optimal range for Corn (18-32°C)."
                    }
                ],
                "comprehensive_recommendation": {
                    "crop": "Wheat",
                    "timestamp": "2023-07-10T14:30:45.123456",
                    "suitability_assessment": {
                        "pH": {"actual": 6.5, "optimal_range": [6.0, 7.0], "status": "optimal"},
                        "moisture": {"actual": 65, "optimal_range": [45, 65], "status": "optimal"},
                        "temperature": {"actual": 25, "optimal_range": [15, 25], "status": "optimal"}
                    },
                    "fertilizer": {
                        "summary": "Apply 100 kg/ha of N, 45 kg/ha of P, and 30 kg/ha of K for optimal Wheat growth.",
                        "instructions": "Apply 40-50% of nitrogen and all phosphorus and potassium at planting. Apply remaining nitrogen in 1-2 split applications during peak growth stages."
                    },
                    "irrigation": {
                        "summary": "Current soil moisture is adequate (65%). Maintain current moisture levels.",
                        "stage_recommendations": {
                            "germination": "Ensure adequate soil moisture",
                            "tillering": "Irrigate at 21-25 days after sowing",
                            "jointing": "Irrigate at 45-60 days after sowing",
                            "heading": "Irrigate at 65-70 days after sowing",
                            "grain_filling": "Irrigate at 80-85 days after sowing"
                        }
                    },
                    "yield_potential": "High yield potential with proper management"
                }
            }
        }

# Global variable to store the loaded model
model = None

@app.on_event("startup")
async def startup_event():
    """Load the model at startup."""
    global model
    try:
        logger.info("Loading model on startup")
        model = load_model()
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        # Continue without model - will try to load it again when needed

def get_model():
    """Dependency to get the model."""
    global model
    if model is None:
        try:
            logger.info("Loading model on demand")
            model = load_model()
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise HTTPException(status_code=500, detail="Model not available")
    return model

@app.get("/", tags=["Status"])
async def root():
    """API root endpoint, returns status information."""
    return {
        "status": "online",
        "api_version": config.MODEL_VERSION,
        "model_version": config.MODEL_VERSION,
        "description": "SoilGuardian Crop Recommendation API"
    }

@app.get("/health", tags=["Status"])
async def health_check():
    """Health check endpoint."""
    global model
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def recommend_crops(
    soil_data: SoilDataInput,
    model=Depends(get_model),
    top_n: int = Query(3, description="Number of top recommendations to return", ge=1, le=10),
    include_comprehensive: bool = Query(True, description="Whether to include comprehensive recommendation for top crop")
):
    """
    Get crop recommendations based on soil data.
    
    This endpoint accepts soil data parameters and returns crop recommendations
    with confidence scores and optionally detailed growing recommendations.
    """
    try:
        logger.info(f"Received recommendation request with soil data: {soil_data.dict()}")
        
        # Convert input to DataFrame
        soil_df = pd.DataFrame([soil_data.dict()])
        
        # Preprocess the data
        processed_df = preprocess_soil_data(soil_df)
        
        # Extract features for the model
        feature_df = processed_df[config.REQUIRED_FEATURES]
        
        # Normalize features
        normalized_df = normalize_features(feature_df)
        
        # Get crop recommendations
        crop_recommendations = predict_crops(model, normalized_df, top_n=top_n)
        
        # If no recommendations, return error
        if not crop_recommendations or len(crop_recommendations) == 0 or len(crop_recommendations[0]) == 0:
            raise HTTPException(status_code=404, detail="No crop recommendations found for the given soil data")
        
        # Prepare response
        recommendations = crop_recommendations[0]  # Just the first sample's recommendations
        
        # Generate comprehensive recommendation for top crop if requested
        comprehensive_rec = None
        if include_comprehensive and len(recommendations) > 0:
            top_crop = recommendations[0]["crop"]
            comprehensive_rec = generate_comprehensive_recommendation(top_crop, soil_df.iloc[0])
        
        return {
            "recommendations": recommendations,
            "comprehensive_recommendation": comprehensive_rec
        }
    
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.get("/crops", tags=["Information"])
async def get_available_crops():
    """Get the list of crops that can be recommended."""
    return {
        "crops": list(config.CROP_OPTIMAL_CONDITIONS.keys())
    }

@app.get("/model-info", tags=["Information"])
async def get_model_info():
    """Get information about the currently loaded model."""
    global model
    model_loaded = model is not None
    
    if not model_loaded:
        try:
            model = load_model()
            model_loaded = True
        except:
            pass
    
    info = {
        "model_version": config.MODEL_VERSION,
        "model_loaded": model_loaded,
        "required_features": config.REQUIRED_FEATURES,
        "all_features": config.SOIL_FEATURES
    }
    
    if model_loaded:
        try:
            info["model_type"] = type(model).__name__
            if hasattr(model, "classes_"):
                info["supported_crops"] = model.classes_.tolist()
        except Exception as e:
            logger.error(f"Error getting model details: {e}")
    
    return info

if __name__ == "__main__":
    # Run the API server if this file is executed directly
    port = int(os.getenv("PORT", config.API_PORT))
    host = os.getenv("HOST", config.API_HOST)
    
    logger.info(f"Starting API server on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port) 