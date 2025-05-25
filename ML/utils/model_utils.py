import os
import logging
import joblib
import mlflow
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import xgboost as xgb
import lightgbm as lgb

# Configure logging
logger = logging.getLogger(__name__)

# Import config (assumes this file is in the utils directory)
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config

def initialize_mlflow():
    """Initialize MLflow tracking."""
    try:
        # Check if we should skip MLflow (for development/testing)
        if os.getenv("SKIP_MLFLOW", "false").lower() == "true":
            logger.info("Skipping MLflow initialization as requested by environment variable")
            return False
            
        mlflow.set_tracking_uri(config.MLFLOW_TRACKING_URI)
        mlflow.set_experiment(config.MLFLOW_EXPERIMENT_NAME)
        logger.info(f"MLflow initialized: {config.MLFLOW_TRACKING_URI}, experiment: {config.MLFLOW_EXPERIMENT_NAME}")
        return True
    except Exception as e:
        logger.warning(f"Error initializing MLflow (continuing without it): {e}")
        return False

def train_model(
    X: pd.DataFrame, 
    y: pd.Series, 
    model_type: str = "xgboost", 
    params: Optional[Dict[str, Any]] = None
) -> Tuple[Any, Dict[str, float]]:
    """
    Train a machine learning model for crop recommendation.
    
    Args:
        X: Feature DataFrame
        y: Target Series (crop names)
        model_type: Type of model to train ('xgboost', 'lightgbm', 'random_forest', or 'gradient_boosting')
        params: Optional parameters for the model
    
    Returns:
        Tuple of (trained model, performance metrics)
    """
    try:
        # Initialize MLflow for experiment tracking
        mlflow_enabled = initialize_mlflow()
        
        # Split data into training and validation sets
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        logger.info(f"Training {model_type} model with {len(X_train)} samples")
        
        # Set default parameters if not provided
        if params is None:
            params = get_default_model_params(model_type)
        
        # Train the appropriate model based on model_type
        if mlflow_enabled:
            with mlflow.start_run():
                # Log model parameters
                mlflow.log_params(params)
                
                model = _create_and_train_model(model_type, params, X_train, y_train)
                
                # Evaluate the model
                y_pred = model.predict(X_val)
                metrics = evaluate_model(y_val, y_pred)
                
                # Log metrics to MLflow
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(metric_name, metric_value)
                
                # Log the model to MLflow
                mlflow.sklearn.log_model(model, "model")
        else:
            # Train without MLflow
            model = _create_and_train_model(model_type, params, X_train, y_train)
            
            # Evaluate the model
            y_pred = model.predict(X_val)
            metrics = evaluate_model(y_val, y_pred)
        
        logger.info(f"Model training completed. Accuracy: {metrics['accuracy']:.4f}")
        
        return model, metrics
    
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise

def _create_and_train_model(model_type: str, params: Dict[str, Any], X_train: pd.DataFrame, y_train: pd.Series) -> Any:
    """
    Create and train a model of the specified type.
    
    Args:
        model_type: Type of model to train
        params: Parameters for the model
        X_train: Training features
        y_train: Training targets
    
    Returns:
        Trained model
    """
    if model_type == "xgboost":
        model = xgb.XGBClassifier(**params)
    elif model_type == "lightgbm":
        model = lgb.LGBMClassifier(**params)
    elif model_type == "random_forest":
        model = RandomForestClassifier(**params)
    elif model_type == "gradient_boosting":
        model = GradientBoostingClassifier(**params)
    else:
        logger.error(f"Unsupported model type: {model_type}")
        raise ValueError(f"Unsupported model type: {model_type}")
    
    # Train the model
    model.fit(X_train, y_train)
    return model

def get_default_model_params(model_type: str) -> Dict[str, Any]:
    """
    Get default parameters for the specified model type.
    
    Args:
        model_type: Type of model ('xgboost', 'lightgbm', 'random_forest', or 'gradient_boosting')
    
    Returns:
        Dictionary of default parameters
    """
    if model_type == "xgboost":
        return {
            "n_estimators": 100,
            "max_depth": 5,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "objective": "multi:softprob",
            "random_state": 42
        }
    elif model_type == "lightgbm":
        return {
            "n_estimators": 100,
            "max_depth": 5,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42
        }
    elif model_type == "random_forest":
        return {
            "n_estimators": 100,
            "max_depth": 10,
            "min_samples_split": 2,
            "min_samples_leaf": 1,
            "random_state": 42
        }
    elif model_type == "gradient_boosting":
        return {
            "n_estimators": 100,
            "max_depth": 5,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "random_state": 42
        }
    else:
        logger.warning(f"No default parameters for model type: {model_type}")
        return {}

def evaluate_model(y_true, y_pred):
    """
    Evaluate model performance on predictions.
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        
    Returns:
        Dictionary of performance metrics
    """
    try:
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted'),
            'recall': recall_score(y_true, y_pred, average='weighted'),
            'f1': f1_score(y_true, y_pred, average='weighted')
        }
        
        return metrics
    except Exception as e:
        logger.error(f"Error evaluating model: {e}")
        # Return basic metrics if we encounter an error
        return {'accuracy': 0.0, 'precision': 0.0, 'recall': 0.0, 'f1': 0.0}

def save_model(model: Any, version: Optional[str] = None) -> str:
    """
    Save the trained model to disk.
    
    Args:
        model: Trained model object
        version: Optional version string (defaults to the one in config)
    
    Returns:
        Path to the saved model
    """
    try:
        if version is None:
            version = config.MODEL_VERSION
        
        model_filename = f"crop_recommendation_model_v{version}.joblib"
        model_path = os.path.join(config.MODELS_DIR, model_filename)
        
        joblib.dump(model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        return model_path
    
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise

def load_model(version: Optional[str] = None) -> Any:
    """
    Load a saved model from disk.
    
    Args:
        version: Optional version string (defaults to the one in config)
    
    Returns:
        Loaded model object
    """
    try:
        if version is None:
            version = config.MODEL_VERSION
        
        model_filename = f"crop_recommendation_model_v{version}.joblib"
        model_path = os.path.join(config.MODELS_DIR, model_filename)
        
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        model = joblib.load(model_path)
        logger.info(f"Model loaded from {model_path}")
        
        return model
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def predict_crops(model: Any, soil_data: pd.DataFrame, top_n: int = 3) -> List[Dict[str, Any]]:
    """
    Predict suitable crops for the given soil data.
    
    Args:
        model: Trained model object
        soil_data: DataFrame containing soil data
        top_n: Number of top crops to recommend
    
    Returns:
        List of dictionaries containing crop recommendations with confidence scores
    """
    try:
        # Get probability predictions for all crop classes
        probabilities = model.predict_proba(soil_data)
        
        # Get crop class names
        crop_classes = model.classes_
        
        # Create a list to store recommendations for each soil sample
        all_recommendations = []
        
        for i, probs in enumerate(probabilities):
            # Get indices of top N crops by probability
            top_indices = np.argsort(probs)[::-1][:top_n]
            
            # Create recommendations for this soil sample
            recommendations = []
            for idx in top_indices:
                crop_name = crop_classes[idx]
                confidence = probs[idx] * 100  # Convert to percentage
                
                # Determine confidence level
                if confidence >= config.HIGH_CONFIDENCE:
                    confidence_level = "High"
                elif confidence >= config.MEDIUM_CONFIDENCE:
                    confidence_level = "Medium"
                else:
                    confidence_level = "Low"
                
                # Get the optimal conditions for this crop
                optimal_conditions = config.CROP_OPTIMAL_CONDITIONS.get(crop_name, {})
                
                # Generate reasoning based on soil conditions
                reasoning = generate_crop_reasoning(soil_data.iloc[i], crop_name, optimal_conditions)
                
                recommendations.append({
                    "crop": crop_name,
                    "confidence": round(confidence, 2),
                    "confidence_level": confidence_level,
                    "reasoning": reasoning
                })
            
            all_recommendations.append(recommendations)
        
        return all_recommendations
    
    except Exception as e:
        logger.error(f"Error predicting crops: {e}")
        return []

def generate_crop_reasoning(soil_sample: pd.Series, crop_name: str, optimal_conditions: Dict[str, Tuple[float, float]]) -> str:
    """
    Generate reasoning for why a crop is suitable based on soil conditions.
    
    Args:
        soil_sample: Series containing soil data for a single sample
        crop_name: Name of the recommended crop
        optimal_conditions: Dictionary of optimal ranges for the crop
    
    Returns:
        String explaining why the crop is suitable
    """
    try:
        reasons = []
        
        # Check each relevant soil property against optimal conditions
        for property_name, (min_val, max_val) in optimal_conditions.items():
            if property_name in soil_sample:
                actual_value = soil_sample[property_name]
                
                # Determine if the property is in the optimal range
                if min_val <= actual_value <= max_val:
                    reasons.append(f"{property_name} ({actual_value:.1f}) is within the optimal range for {crop_name} ({min_val}-{max_val})")
                elif actual_value < min_val:
                    reasons.append(f"{property_name} ({actual_value:.1f}) is slightly below the optimal range for {crop_name} ({min_val}-{max_val})")
                else:
                    reasons.append(f"{property_name} ({actual_value:.1f}) is slightly above the optimal range for {crop_name} ({min_val}-{max_val})")
        
        # If we have specific reasons, join them
        if reasons:
            return " and ".join(reasons) + "."
        
        # Generic fallback if no specific conditions are available
        return f"{crop_name} is suitable for the given soil conditions based on the model prediction."
    
    except Exception as e:
        logger.error(f"Error generating crop reasoning: {e}")
        return f"{crop_name} is recommended based on overall soil conditions." 