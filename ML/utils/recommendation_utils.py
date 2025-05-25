import os
import sys
import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple, Union, Any
import json
from datetime import datetime

# Add the parent directory to the path to import from the config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(config.LOGS_DIR, "recommendation_utils.log"))
    ]
)
logger = logging.getLogger(__name__)

# Define fertilizer recommendations for crops
# Format: {crop_name: {nutrient: {low: amount, medium: amount, high: amount}}}
FERTILIZER_RECOMMENDATIONS = {
    "Rice": {
        "nitrogen": {"low": "120 kg/ha", "medium": "100 kg/ha", "high": "80 kg/ha"},
        "phosphorus": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"},
        "potassium": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"}
    },
    "Wheat": {
        "nitrogen": {"low": "120 kg/ha", "medium": "100 kg/ha", "high": "80 kg/ha"},
        "phosphorus": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"},
        "potassium": {"low": "40 kg/ha", "medium": "30 kg/ha", "high": "20 kg/ha"}
    },
    "Corn": {
        "nitrogen": {"low": "180 kg/ha", "medium": "150 kg/ha", "high": "120 kg/ha"},
        "phosphorus": {"low": "80 kg/ha", "medium": "60 kg/ha", "high": "40 kg/ha"},
        "potassium": {"low": "80 kg/ha", "medium": "60 kg/ha", "high": "40 kg/ha"}
    },
    "Potato": {
        "nitrogen": {"low": "150 kg/ha", "medium": "120 kg/ha", "high": "90 kg/ha"},
        "phosphorus": {"low": "100 kg/ha", "medium": "80 kg/ha", "high": "60 kg/ha"},
        "potassium": {"low": "150 kg/ha", "medium": "120 kg/ha", "high": "90 kg/ha"}
    },
    "Soybean": {
        "nitrogen": {"low": "30 kg/ha", "medium": "20 kg/ha", "high": "10 kg/ha"},
        "phosphorus": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"},
        "potassium": {"low": "80 kg/ha", "medium": "60 kg/ha", "high": "40 kg/ha"}
    },
    # Default fertilizer recommendation for any crop not explicitly defined
    "default": {
        "nitrogen": {"low": "100 kg/ha", "medium": "80 kg/ha", "high": "60 kg/ha"},
        "phosphorus": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"},
        "potassium": {"low": "60 kg/ha", "medium": "45 kg/ha", "high": "30 kg/ha"}
    }
}

# Define irrigation recommendations for crops
# Format: {crop_name: {stage: recommendation}}
IRRIGATION_RECOMMENDATIONS = {
    "Rice": {
        "germination": "Keep soil saturated",
        "vegetative": "Maintain 5-7 cm water depth",
        "reproductive": "Maintain 7-10 cm water depth",
        "ripening": "Drain field 10-15 days before harvest"
    },
    "Wheat": {
        "germination": "Ensure adequate soil moisture",
        "tillering": "Irrigate at 21-25 days after sowing",
        "jointing": "Irrigate at 45-60 days after sowing",
        "heading": "Irrigate at 65-70 days after sowing",
        "grain_filling": "Irrigate at 80-85 days after sowing"
    },
    "Corn": {
        "germination": "Ensure adequate soil moisture",
        "vegetative": "Weekly irrigation of 25-30 mm",
        "tasseling": "Critical irrigation period, 40-50 mm water",
        "grain_filling": "Maintain adequate soil moisture"
    },
    "Potato": {
        "sprouting": "Light, frequent irrigation",
        "vegetative": "25-30 mm water every 5-7 days",
        "tuber_initiation": "30-35 mm water every 3-4 days",
        "tuber_bulking": "35-40 mm water every 3-4 days",
        "maturation": "Reduce irrigation 10-15 days before harvest"
    },
    "Soybean": {
        "germination": "Ensure adequate soil moisture",
        "vegetative": "25-30 mm water every 7-10 days",
        "flowering": "Critical irrigation period, 30-35 mm water every 5-7 days",
        "pod_development": "35-40 mm water every 5-7 days",
        "maturation": "Reduce irrigation 15-20 days before harvest"
    },
    # Default irrigation recommendation for any crop not explicitly defined
    "default": {
        "germination": "Ensure adequate soil moisture",
        "vegetative": "Regular irrigation based on soil moisture levels",
        "reproductive": "Maintain consistent soil moisture",
        "maturation": "Reduce irrigation before harvest"
    }
}

# Define pH adjustment recommendations
PH_ADJUSTMENT_RECOMMENDATIONS = {
    "low": {
        "method": "Apply agricultural lime (calcium carbonate)",
        "rate": "1-2 tons/ha depending on soil type and target pH",
        "notes": "Apply lime 2-3 months before planting. Incorporate into soil with tillage."
    },
    "high": {
        "method": "Apply agricultural sulfur or acidifying fertilizers",
        "rate": "200-500 kg/ha of elemental sulfur depending on soil type and target pH",
        "notes": "Apply 2-3 months before planting. Incorporate into soil with tillage."
    }
}

# Define organic matter improvement recommendations
ORGANIC_MATTER_RECOMMENDATIONS = {
    "low": {
        "method": "Apply compost or well-rotted manure",
        "rate": "10-20 tons/ha",
        "notes": "Incorporate into soil before planting. Consider cover crops in rotation."
    },
    "medium": {
        "method": "Apply compost or incorporate crop residues",
        "rate": "5-10 tons/ha of compost",
        "notes": "Maintain organic matter levels with regular additions and reduced tillage."
    },
    "high": {
        "method": "Incorporate crop residues",
        "rate": "Maintain current practices",
        "notes": "Continue good soil management practices."
    }
}

def categorize_nutrient_level(nutrient: str, value: float) -> str:
    """
    Categorize a nutrient level as low, medium, or high.
    
    Args:
        nutrient: Name of the nutrient (nitrogen, phosphorus, potassium)
        value: Nutrient value in ppm
    
    Returns:
        Category as string ("low", "medium", or "high")
    """
    if nutrient == "nitrogen":
        if value < 40:
            return "low"
        elif value < 80:
            return "medium"
        else:
            return "high"
    elif nutrient == "phosphorus":
        if value < 20:
            return "low"
        elif value < 40:
            return "medium"
        else:
            return "high"
    elif nutrient == "potassium":
        if value < 50:
            return "low"
        elif value < 100:
            return "medium"
        else:
            return "high"
    else:
        logger.warning(f"Unknown nutrient: {nutrient}")
        return "medium"

def categorize_ph(ph_value: float) -> str:
    """
    Categorize soil pH as low, optimal, or high.
    
    Args:
        ph_value: Soil pH value
    
    Returns:
        Category as string ("low", "optimal", or "high")
    """
    if ph_value < 5.5:
        return "low"
    elif ph_value <= 7.0:
        return "optimal"
    else:
        return "high"

def categorize_organic_matter(om_value: float) -> str:
    """
    Categorize soil organic matter as low, medium, or high.
    
    Args:
        om_value: Organic matter percentage
    
    Returns:
        Category as string ("low", "medium", or "high")
    """
    if om_value < 2:
        return "low"
    elif om_value < 5:
        return "medium"
    else:
        return "high"

def generate_fertilizer_recommendation(crop: str, soil_data: pd.Series) -> Dict[str, Any]:
    """
    Generate fertilizer recommendations based on crop and soil data.
    
    Args:
        crop: Name of the crop
        soil_data: Series containing soil data for a single sample
    
    Returns:
        Dictionary containing fertilizer recommendations
    """
    try:
        # Get crop-specific fertilizer recommendations, or use default if not found
        crop_fertilizer = FERTILIZER_RECOMMENDATIONS.get(crop, FERTILIZER_RECOMMENDATIONS["default"])
        
        # Categorize nutrient levels
        n_level = categorize_nutrient_level("nitrogen", soil_data.get("nitrogen", 0))
        p_level = categorize_nutrient_level("phosphorus", soil_data.get("phosphorus", 0))
        k_level = categorize_nutrient_level("potassium", soil_data.get("potassium", 0))
        
        # Generate recommendations
        recommendations = {
            "nitrogen": {
                "level": n_level,
                "value": soil_data.get("nitrogen", 0),
                "recommendation": crop_fertilizer["nitrogen"][n_level]
            },
            "phosphorus": {
                "level": p_level,
                "value": soil_data.get("phosphorus", 0),
                "recommendation": crop_fertilizer["phosphorus"][p_level]
            },
            "potassium": {
                "level": k_level,
                "value": soil_data.get("potassium", 0),
                "recommendation": crop_fertilizer["potassium"][k_level]
            }
        }
        
        # Generate a summary
        summary = f"Apply {recommendations['nitrogen']['recommendation']} of N, {recommendations['phosphorus']['recommendation']} of P, and {recommendations['potassium']['recommendation']} of K for optimal {crop} growth."
        
        # Generate application instructions
        instructions = "Apply 40-50% of nitrogen and all phosphorus and potassium at planting. Apply remaining nitrogen in 1-2 split applications during peak growth stages."
        
        return {
            "nutrients": recommendations,
            "summary": summary,
            "instructions": instructions
        }
    
    except Exception as e:
        logger.error(f"Error generating fertilizer recommendation: {e}")
        return {
            "summary": f"Standard fertilizer application recommended for {crop}.",
            "instructions": "Consult with a local agronomist for specific rates."
        }

def generate_irrigation_recommendation(crop: str, soil_data: pd.Series) -> Dict[str, Any]:
    """
    Generate irrigation recommendations based on crop and soil data.
    
    Args:
        crop: Name of the crop
        soil_data: Series containing soil data for a single sample
    
    Returns:
        Dictionary containing irrigation recommendations
    """
    try:
        # Get crop-specific irrigation recommendations, or use default if not found
        crop_irrigation = IRRIGATION_RECOMMENDATIONS.get(crop, IRRIGATION_RECOMMENDATIONS["default"])
        
        # Current soil moisture
        current_moisture = soil_data.get("moisture", 50)
        
        # Determine general irrigation strategy based on current moisture
        if current_moisture < 30:
            moisture_status = "dry"
            initial_strategy = "Immediate irrigation needed"
        elif current_moisture < 60:
            moisture_status = "moderate"
            initial_strategy = "Monitor soil moisture closely"
        else:
            moisture_status = "adequate"
            initial_strategy = "Maintain current moisture levels"
        
        # Generate a summary
        summary = f"Current soil moisture is {moisture_status} ({current_moisture}%). {initial_strategy}."
        
        return {
            "current_moisture": current_moisture,
            "moisture_status": moisture_status,
            "initial_strategy": initial_strategy,
            "stage_recommendations": crop_irrigation,
            "summary": summary
        }
    
    except Exception as e:
        logger.error(f"Error generating irrigation recommendation: {e}")
        return {
            "summary": f"Regular irrigation recommended for {crop} based on soil moisture levels.",
            "stage_recommendations": IRRIGATION_RECOMMENDATIONS["default"]
        }

def generate_soil_amendment_recommendations(soil_data: pd.Series) -> Dict[str, Any]:
    """
    Generate soil amendment recommendations based on soil data.
    
    Args:
        soil_data: Series containing soil data for a single sample
    
    Returns:
        Dictionary containing soil amendment recommendations
    """
    try:
        recommendations = {}
        
        # pH adjustment
        if "pH" in soil_data:
            ph_category = categorize_ph(soil_data["pH"])
            if ph_category == "low":
                recommendations["ph_adjustment"] = PH_ADJUSTMENT_RECOMMENDATIONS["low"]
                recommendations["ph_adjustment"]["current_ph"] = soil_data["pH"]
                recommendations["ph_adjustment"]["target_ph"] = "6.0-6.5"
            elif ph_category == "high":
                recommendations["ph_adjustment"] = PH_ADJUSTMENT_RECOMMENDATIONS["high"]
                recommendations["ph_adjustment"]["current_ph"] = soil_data["pH"]
                recommendations["ph_adjustment"]["target_ph"] = "6.0-6.5"
        
        # Organic matter
        if "organicMatter" in soil_data:
            om_category = categorize_organic_matter(soil_data["organicMatter"])
            recommendations["organic_matter"] = ORGANIC_MATTER_RECOMMENDATIONS[om_category]
            recommendations["organic_matter"]["current_om"] = soil_data["organicMatter"]
        
        return recommendations
    
    except Exception as e:
        logger.error(f"Error generating soil amendment recommendations: {e}")
        return {}

def generate_comprehensive_recommendation(crop: str, soil_data: pd.Series) -> Dict[str, Any]:
    """
    Generate a comprehensive crop recommendation including fertilizer, irrigation, and soil amendments.
    
    Args:
        crop: Name of the crop
        soil_data: Series containing soil data for a single sample
    
    Returns:
        Dictionary containing comprehensive recommendations
    """
    try:
        # Generate individual recommendations
        fertilizer_rec = generate_fertilizer_recommendation(crop, soil_data)
        irrigation_rec = generate_irrigation_recommendation(crop, soil_data)
        amendment_rec = generate_soil_amendment_recommendations(soil_data)
        
        # Get optimal conditions for the crop
        optimal_conditions = config.CROP_OPTIMAL_CONDITIONS.get(crop, {})
        
        # Generate suitability assessment
        suitability = {}
        for property_name, (min_val, max_val) in optimal_conditions.items():
            if property_name in soil_data:
                actual_value = soil_data[property_name]
                if min_val <= actual_value <= max_val:
                    status = "optimal"
                elif actual_value < min_val:
                    status = "below_optimal"
                else:
                    status = "above_optimal"
                
                suitability[property_name] = {
                    "actual": actual_value,
                    "optimal_range": (min_val, max_val),
                    "status": status
                }
        
        # Generate planting guidelines
        planting_guidelines = {
            "season": "Consult local agricultural extension for optimal planting dates",
            "seed_rate": "Standard seed rate for local conditions",
            "spacing": "Standard spacing for local conditions",
            "depth": "Standard planting depth for local conditions"
        }
        
        # Generate expected yield potential
        yield_potential = "Medium to high with proper management"
        if len(suitability) > 0:
            optimal_count = sum(1 for prop in suitability.values() if prop["status"] == "optimal")
            if optimal_count == len(suitability):
                yield_potential = "High yield potential with proper management"
            elif optimal_count >= len(suitability) // 2:
                yield_potential = "Medium to high yield potential with proper management"
            else:
                yield_potential = "Medium yield potential with additional soil amendments and proper management"
        
        # Combine all recommendations
        comprehensive_rec = {
            "crop": crop,
            "timestamp": datetime.now().isoformat(),
            "soil_data": {k: float(v) if isinstance(v, (int, float)) else v for k, v in soil_data.items()},
            "suitability_assessment": suitability,
            "fertilizer": fertilizer_rec,
            "irrigation": irrigation_rec,
            "soil_amendments": amendment_rec,
            "planting_guidelines": planting_guidelines,
            "yield_potential": yield_potential,
            "summary": f"{crop} is recommended with specific management practices. {fertilizer_rec.get('summary', '')} {irrigation_rec.get('summary', '')}"
        }
        
        return comprehensive_rec
    
    except Exception as e:
        logger.error(f"Error generating comprehensive recommendation: {e}")
        return {
            "crop": crop,
            "timestamp": datetime.now().isoformat(),
            "summary": f"{crop} is recommended, but there was an error generating detailed recommendations."
        } 