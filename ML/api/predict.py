import os
import sys
import logging
import argparse
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Add the parent directory to the path to import from the config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import config
from utils.data_utils import normalize_features, generate_synthetic_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def load_model(model_path):
    """
    Load a trained model from disk.
    
    Args:
        model_path: Path to the saved model
        
    Returns:
        Loaded model
    """
    try:
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
            
        model = joblib.load(model_path)
        logger.info(f"Model loaded from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def get_latest_model(model_type=None):
    """
    Get the path to the latest trained model.
    
    Args:
        model_type: Optional filter by model type
        
    Returns:
        Path to the latest model
    """
    try:
        model_files = []
        for file in os.listdir(config.MODELS_DIR):
            if file.endswith('.joblib'):
                if model_type is None or file.startswith(model_type):
                    model_files.append(os.path.join(config.MODELS_DIR, file))
                    
        if not model_files:
            logger.error(f"No model files found in {config.MODELS_DIR}")
            return None
            
        # Sort by modification time (latest first)
        model_files.sort(key=os.path.getmtime, reverse=True)
        logger.info(f"Latest model: {model_files[0]}")
        return model_files[0]
    except Exception as e:
        logger.error(f"Error finding latest model: {e}")
        return None

def generate_recommendation(model, features):
    """
    Generate crop recommendation based on soil features.
    
    Args:
        model: Trained model
        features: DataFrame with soil features
        
    Returns:
        Dictionary with recommendations
    """
    try:
        # Get the feature names used during training (for random forest)
        if hasattr(model, 'feature_names_in_'):
            required_features = model.feature_names_in_
            logger.info(f"Model requires these features: {required_features}")
            
            # Check if we have all required features
            missing_features = [f for f in required_features if f not in features.columns]
            if missing_features:
                # Add missing features with default values
                for feature in missing_features:
                    features[feature] = 5.0  # Default value
                logger.warning(f"Added missing features with default values: {missing_features}")
            
            # Reorder columns to match the model's expected order
            features = features[required_features]
        
        # Ensure features are normalized
        normalized_features = normalize_features(features)
        
        # Get prediction probabilities
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(normalized_features)
            predicted_crop = model.classes_[np.argmax(probs, axis=1)][0]
            confidence = np.max(probs, axis=1)[0] * 100
            
            # Get top 3 recommendations
            top_indices = np.argsort(probs[0])[::-1][:3]
            top_crops = [model.classes_[i] for i in top_indices]
            top_probabilities = [probs[0][i] * 100 for i in top_indices]
            
            recommendations = []
            for i, (crop, prob) in enumerate(zip(top_crops, top_probabilities)):
                recommendations.append({
                    "crop": crop,
                    "probability": round(prob, 2),
                    "rank": i + 1
                })
                
            result = {
                "recommended_crop": predicted_crop,
                "confidence": round(confidence, 2),
                "alternatives": recommendations,
                "timestamp": datetime.now().isoformat()
            }
            
            # Add advice based on the crop
            result["advice"] = get_crop_advice(predicted_crop, features)
            
            return result
        else:
            # For models without probability support
            prediction = model.predict(normalized_features)[0]
            return {
                "recommended_crop": prediction,
                "confidence": None,
                "alternatives": [],
                "timestamp": datetime.now().isoformat(),
                "advice": get_crop_advice(prediction, features)
            }
    except Exception as e:
        logger.error(f"Error generating recommendation: {e}")
        return {"error": str(e)}

def get_crop_advice(crop, features):
    """
    Generate specific advice for the recommended crop based on soil conditions.
    
    Args:
        crop: Recommended crop
        features: Soil features
        
    Returns:
        Dictionary with advice
    """
    # Default advice template
    advice = {
        "irrigation": "Maintain consistent soil moisture. Avoid waterlogging.",
        "fertilizer": "Apply balanced NPK fertilizer according to soil test results.",
        "planting": "Follow recommended spacing and planting depth.",
        "care": "Regular monitoring for pests and diseases."
    }
    
    # Get the first row of features if it's a DataFrame
    if isinstance(features, pd.DataFrame):
        soil_data = features.iloc[0]
    else:
        soil_data = features
    
    # Customize advice based on crop and soil conditions
    try:
        ph_value = soil_data.get('ph', None)
        if ph_value is not None:
            if crop.lower() in ['rice', 'watermelon']:
                if ph_value < 5.5:
                    advice["soil"] = "pH is in good range for this crop. No lime needed."
                else:
                    advice["soil"] = f"Current pH {ph_value:.1f} is higher than optimal. Consider using acidifying amendments."
            elif crop.lower() in ['chickpea', 'lentil', 'cotton']:
                if ph_value > 7.0:
                    advice["soil"] = "pH is in good range for this crop."
                else:
                    advice["soil"] = f"Current pH {ph_value:.1f} is lower than optimal. Consider adding agricultural lime."
        
        # Add more specific advice based on other soil parameters
        if 'N' in soil_data or 'nitrogen' in soil_data:
            n_value = soil_data.get('N', soil_data.get('nitrogen', 0))
            if crop.lower() in ['rice', 'maize', 'banana']:
                if n_value < 80:
                    advice["fertilizer"] = f"Nitrogen levels ({n_value:.1f}) are low for {crop}. Apply nitrogen-rich fertilizer."
                else:
                    advice["fertilizer"] = f"Nitrogen levels ({n_value:.1f}) are adequate. Apply maintenance fertilization."
        
        # Add irrigation advice based on moisture/humidity
        moisture = soil_data.get('moisture', soil_data.get('humidity', 50))
        if crop.lower() in ['rice']:
            advice["irrigation"] = "Maintain standing water during critical growth stages."
        elif crop.lower() in ['watermelon', 'muskmelon']:
            advice["irrigation"] = "Use drip irrigation to maintain consistent soil moisture without wetting foliage."
        elif moisture < 30:
            advice["irrigation"] = "Soil moisture is low. Increase irrigation frequency."
        
    except Exception as e:
        logger.warning(f"Error generating custom advice: {e}")
    
    return advice

def main(args):
    """Main function for testing model prediction."""
    try:
        # Load the model
        if args.model_path:
            model_path = args.model_path
        else:
            model_path = get_latest_model(args.model_type)
            
        if not model_path:
            logger.error("No model found. Please train a model first or specify a model path.")
            return
            
        model = load_model(model_path)
        
        # Generate or load test data
        if args.use_synthetic:
            # Generate a single synthetic sample for testing
            features, _ = generate_synthetic_data(n_samples=1)
            logger.info(f"Generated synthetic data for testing: {features.iloc[0].to_dict()}")
        else:
            # Create a DataFrame from the provided values using lowercase feature names
            features = pd.DataFrame({
                'ph': [args.ph],
                'temperature': [args.temperature],
                'humidity': [args.humidity],
                'n': [args.nitrogen],
                'p': [args.phosphorus],
                'k': [args.potassium]
            })
            
            # Add missing features with default values to match training data
            if 'organic_matter' not in features.columns:
                features['organic_matter'] = 5.0
            if 'conductivity' not in features.columns:
                features['conductivity'] = 1.0
            if 'salinity' not in features.columns:
                features['salinity'] = 1.0
                
            logger.info(f"Using provided values for prediction: {features.iloc[0].to_dict()}")
        
        # Generate recommendation
        recommendation = generate_recommendation(model, features)
        
        # Print the recommendation
        if 'error' in recommendation:
            logger.error(f"Error generating recommendation: {recommendation['error']}")
            return
            
        logger.info("\n===== CROP RECOMMENDATION =====")
        logger.info(f"Recommended crop: {recommendation['recommended_crop']}")
        if recommendation.get('confidence'):
            logger.info(f"Confidence: {recommendation['confidence']:.2f}%")
        
        if recommendation.get('alternatives'):
            logger.info("\nAlternative options:")
            for alt in recommendation['alternatives']:
                logger.info(f"  {alt['rank']}. {alt['crop']} ({alt['probability']:.2f}%)")
        
        logger.info("\nCrop management advice:")
        for key, value in recommendation['advice'].items():
            logger.info(f"  {key.capitalize()}: {value}")
            
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test crop recommendation model")
    parser.add_argument("--model-path", type=str, help="Path to the trained model")
    parser.add_argument("--model-type", type=str, default="random_forest", help="Model type to use (if not specifying a path)")
    parser.add_argument("--use-synthetic", action="store_true", help="Use synthetic data for testing")
    parser.add_argument("--ph", type=float, default=6.5, help="Soil pH value")
    parser.add_argument("--temperature", type=float, default=25.0, help="Temperature in Celsius")
    parser.add_argument("--humidity", type=float, default=65.0, help="Humidity percentage")
    parser.add_argument("--nitrogen", type=float, default=50.0, help="Nitrogen content (N)")
    parser.add_argument("--phosphorus", type=float, default=30.0, help="Phosphorus content (P)")
    parser.add_argument("--potassium", type=float, default=40.0, help="Potassium content (K)")
    
    args = parser.parse_args()
    main(args) 