import os
import sys
import pandas as pd
import numpy as np
import logging
import argparse
import json
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
import joblib

# Add the parent directory to the path to import from the config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import config
from utils.data_utils import (
    fetch_soil_data, 
    preprocess_soil_data, 
    normalize_features, 
    save_to_csv,
    load_data,
    preprocess_data,
    generate_synthetic_data
)
from utils.model_utils import (
    train_model, 
    evaluate_model, 
    save_model,
    initialize_mlflow
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def create_synthetic_dataset(n_samples=1000, random_state=42):
    """
    Create a synthetic dataset for training the crop recommendation model.
    
    In a production environment, this would be replaced with real data from your database.
    
    Args:
        n_samples: Number of samples to generate
        random_state: Random seed for reproducibility
    
    Returns:
        DataFrame containing the synthetic data
    """
    np.random.seed(random_state)
    
    # List of crops to include in the dataset
    crops = list(config.CROP_OPTIMAL_CONDITIONS.keys())
    
    # Create empty lists to store data
    data = []
    
    # Generate data for each crop
    for crop in crops:
        # Get optimal conditions for this crop
        optimal_conditions = config.CROP_OPTIMAL_CONDITIONS.get(crop, {})
        
        # Determine how many samples to generate for this crop
        crop_samples = n_samples // len(crops)
        
        for _ in range(crop_samples):
            # Start with a sample that's within the optimal range for this crop
            sample = {}
            
            # For each soil property, generate a value within or near the optimal range
            for property_name, (min_val, max_val) in optimal_conditions.items():
                # 80% chance of being within optimal range, 20% chance of being outside
                if np.random.random() < 0.8:
                    # Within optimal range
                    sample[property_name] = np.random.uniform(min_val, max_val)
                else:
                    # Outside optimal range (but not too far)
                    lower_bound = max(0, min_val - (min_val * 0.3))
                    upper_bound = max_val + (max_val * 0.3)
                    sample[property_name] = np.random.choice([
                        np.random.uniform(lower_bound, min_val),
                        np.random.uniform(max_val, upper_bound)
                    ])
            
            # Add other required properties that might not be in optimal_conditions
            for feature in config.REQUIRED_FEATURES:
                if feature not in sample:
                    if feature == "pH":
                        sample[feature] = np.random.uniform(5.0, 8.0)
                    elif feature == "nitrogen":
                        sample[feature] = np.random.uniform(10, 150)
                    elif feature == "phosphorus":
                        sample[feature] = np.random.uniform(5, 100)
                    elif feature == "potassium":
                        sample[feature] = np.random.uniform(10, 200)
                    elif feature == "moisture":
                        sample[feature] = np.random.uniform(20, 80)
                    elif feature == "temperature":
                        sample[feature] = np.random.uniform(15, 35)
                    elif feature == "organicMatter":
                        sample[feature] = np.random.uniform(1, 10) if np.random.random() > 0.2 else None
                    elif feature == "conductivity":
                        sample[feature] = np.random.uniform(0.1, 2.0) if np.random.random() > 0.3 else None
                    elif feature == "salinity":
                        sample[feature] = np.random.uniform(0.1, 1.5) if np.random.random() > 0.3 else None
            
            # Add the crop label
            sample["crop"] = crop
            
            # Add the sample to the dataset
            data.append(sample)
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Shuffle the data
    df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)
    
    logger.info(f"Created synthetic dataset with {len(df)} samples for {len(crops)} crops")
    
    return df

def main(args):
    """Main function for model training."""
    # Set environment variable to skip MLflow for local testing
    if args.skip_mlflow:
        os.environ["SKIP_MLFLOW"] = "true"
        
    logger.info("Starting model training process")
    
    try:
        # Initialize MLflow for experiment tracking
        initialize_mlflow()
        
        # Generate or load data
        if args.use_synthetic:
            # Generate synthetic data for testing
            logger.info(f"Generating synthetic data with {args.n_samples} samples")
            features, labels = generate_synthetic_data(n_samples=args.n_samples)
        else:
            # Load real data from configured path
            data_path = os.path.join(config.DATA_DIR, args.data_file if args.data_file else "soil_data.csv")
            logger.info(f"Loading data from {data_path}")
            data = load_data(data_path)
            features, labels = preprocess_data(data)
        
        # Train the model
        logger.info(f"Training model with algorithm: {args.model_type}")
        model, metrics = train_model(
            X=features,
            y=labels,
            model_type=args.model_type
        )
        
        # Save the model
        os.makedirs(config.MODELS_DIR, exist_ok=True)
        output_path = os.path.join(config.MODELS_DIR, f"{args.model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib")
        joblib.dump(model, output_path)
        logger.info(f"Model saved to {output_path}")
        
        # Print metrics
        logger.info("Model Performance Metrics:")
        for metric_name, metric_value in metrics.items():
            logger.info(f"  {metric_name}: {metric_value:.4f}")
            
    except Exception as e:
        logger.error(f"Error in model training: {str(e)}")
        raise

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Train a crop recommendation model")
    
    # Data source arguments
    data_group = parser.add_mutually_exclusive_group()
    data_group.add_argument("--use-synthetic", action="store_true", help="Use synthetic data for training")
    data_group.add_argument("--data-file", type=str, help="CSV file to load data from (must be in the data directory)")
    
    # Other arguments
    parser.add_argument("--days", type=int, default=365, help="Number of days to look back for data when fetching from database")
    parser.add_argument("--n-samples", type=int, default=1500, help="Number of samples to generate for synthetic data")
    parser.add_argument("--model-type", type=str, default="xgboost", choices=["xgboost", "lightgbm", "random_forest", "gradient_boosting"], help="Type of model to train")
    parser.add_argument("--model-version", type=str, default=config.MODEL_VERSION, help="Version for the saved model")
    parser.add_argument("--random-seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--skip-mlflow", action="store_true", help="Skip MLflow for local testing")
    
    args = parser.parse_args()
    
    # Run the main function
    main(args) 