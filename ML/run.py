#!/usr/bin/env python3
"""
Main script for running the SoilGuardian ML pipeline.

This script provides a command-line interface for running different components
of the ML pipeline, such as training a model, starting the API server, or
generating recommendations.
"""

import os
import sys
import argparse
import logging
import importlib.util
import subprocess
from typing import List, Optional, Dict, Any

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(config.LOGS_DIR, "run.log"))
    ]
)
logger = logging.getLogger(__name__)

def run_train(args: List[str]) -> int:
    """
    Run the model training script with the given arguments.
    
    Args:
        args: List of command-line arguments to pass to the training script
    
    Returns:
        Exit code from the training script
    """
    logger.info(f"Running model training with args: {args}")
    
    try:
        # Import the training module
        train_module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "train_model.py")
        spec = importlib.util.spec_from_file_location("train_model", train_module_path)
        train_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(train_module)
        
        # Parse the arguments for the training script
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
        
        train_args = parser.parse_args(args)
        
        # Run the training
        train_module.main(train_args)
        
        logger.info("Model training completed successfully")
        return 0
    
    except Exception as e:
        logger.error(f"Error running model training: {e}")
        return 1

def run_api(args: List[str]) -> int:
    """
    Run the API server with the given arguments.
    
    Args:
        args: List of command-line arguments to pass to the API server
    
    Returns:
        Exit code from the API server
    """
    logger.info(f"Starting API server with args: {args}")
    
    try:
        # Parse the arguments for the API server
        parser = argparse.ArgumentParser(description="Start the recommendation API server")
        parser.add_argument("--host", type=str, default=config.API_HOST, help="Host to bind the server to")
        parser.add_argument("--port", type=int, default=config.API_PORT, help="Port to bind the server to")
        parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
        
        api_args = parser.parse_args(args)
        
        # Build the command to run the API server
        api_module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api", "recommendation_api.py")
        command = [
            sys.executable,  # Use the current Python interpreter
            api_module_path,
        ]
        
        # Set environment variables for the API server
        env = os.environ.copy()
        env["HOST"] = api_args.host
        env["PORT"] = str(api_args.port)
        
        # Run the API server as a subprocess
        logger.info(f"Running command: {' '.join(command)}")
        process = subprocess.Popen(command, env=env)
        
        # Wait for the process to complete
        process.wait()
        
        logger.info(f"API server exited with code {process.returncode}")
        return process.returncode
    
    except Exception as e:
        logger.error(f"Error starting API server: {e}")
        return 1

def run_recommend(args: List[str]) -> int:
    """
    Run a one-off recommendation with the given arguments.
    
    Args:
        args: List of command-line arguments for the recommendation
    
    Returns:
        Exit code from the recommendation
    """
    logger.info(f"Generating recommendation with args: {args}")
    
    try:
        # Parse the arguments for the recommendation
        parser = argparse.ArgumentParser(description="Generate a crop recommendation")
        parser.add_argument("--ph", type=float, required=True, help="Soil pH level (0-14)")
        parser.add_argument("--nitrogen", type=float, required=True, help="Nitrogen content in ppm")
        parser.add_argument("--phosphorus", type=float, required=True, help="Phosphorus content in ppm")
        parser.add_argument("--potassium", type=float, required=True, help="Potassium content in ppm")
        parser.add_argument("--moisture", type=float, required=True, help="Soil moisture percentage")
        parser.add_argument("--temperature", type=float, required=True, help="Soil temperature in Celsius")
        parser.add_argument("--organic-matter", type=float, help="Organic matter percentage")
        parser.add_argument("--conductivity", type=float, help="Electrical conductivity in dS/m")
        parser.add_argument("--salinity", type=float, help="Salinity in ppt")
        parser.add_argument("--top-n", type=int, default=3, help="Number of top recommendations to return")
        parser.add_argument("--output", type=str, help="File to save the recommendation to (JSON format)")
        
        rec_args = parser.parse_args(args)
        
        # Import necessary modules
        import pandas as pd
        from utils.data_utils import preprocess_soil_data, normalize_features
        from utils.model_utils import load_model, predict_crops
        from utils.recommendation_utils import generate_comprehensive_recommendation
        import json
        
        # Create a DataFrame from the arguments
        soil_data = {
            "pH": rec_args.ph,
            "nitrogen": rec_args.nitrogen,
            "phosphorus": rec_args.phosphorus,
            "potassium": rec_args.potassium,
            "moisture": rec_args.moisture,
            "temperature": rec_args.temperature,
            "organicMatter": rec_args.organic_matter,
            "conductivity": rec_args.conductivity,
            "salinity": rec_args.salinity
        }
        
        # Remove None values
        soil_data = {k: v for k, v in soil_data.items() if v is not None}
        
        # Convert to DataFrame
        soil_df = pd.DataFrame([soil_data])
        
        # Preprocess the data
        processed_df = preprocess_soil_data(soil_df)
        
        # Extract features for the model
        feature_df = processed_df[config.REQUIRED_FEATURES]
        
        # Normalize features
        normalized_df = normalize_features(feature_df)
        
        # Load the model
        model = load_model()
        
        # Get crop recommendations
        crop_recommendations = predict_crops(model, normalized_df, top_n=rec_args.top_n)
        
        # If no recommendations, return error
        if not crop_recommendations or len(crop_recommendations) == 0 or len(crop_recommendations[0]) == 0:
            logger.error("No crop recommendations found for the given soil data")
            return 1
        
        # Prepare response
        recommendations = crop_recommendations[0]  # Just the first sample's recommendations
        
        # Generate comprehensive recommendation for top crop
        comprehensive_rec = None
        if len(recommendations) > 0:
            top_crop = recommendations[0]["crop"]
            comprehensive_rec = generate_comprehensive_recommendation(top_crop, soil_df.iloc[0])
        
        # Create the final recommendation
        final_recommendation = {
            "recommendations": recommendations,
            "comprehensive_recommendation": comprehensive_rec
        }
        
        # Output the recommendation
        if rec_args.output:
            with open(rec_args.output, "w") as f:
                json.dump(final_recommendation, f, indent=2)
            logger.info(f"Recommendation saved to {rec_args.output}")
        else:
            print(json.dumps(final_recommendation, indent=2))
        
        return 0
    
    except Exception as e:
        logger.error(f"Error generating recommendation: {e}")
        return 1

def main():
    """Main entry point for the script."""
    # Create the main parser
    parser = argparse.ArgumentParser(description="SoilGuardian ML Pipeline")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Train command
    train_parser = subparsers.add_parser("train", help="Train a model")
    train_parser.add_argument("--use-synthetic", action="store_true", help="Use synthetic data for training")
    train_parser.add_argument("--data-file", type=str, help="CSV file to load data from (must be in the data directory)")
    train_parser.add_argument("--days", type=int, default=365, help="Number of days to look back for data when fetching from database")
    train_parser.add_argument("--n-samples", type=int, default=1500, help="Number of samples to generate for synthetic data")
    train_parser.add_argument("--model-type", type=str, default="xgboost", choices=["xgboost", "lightgbm", "random_forest", "gradient_boosting"], help="Type of model to train")
    train_parser.add_argument("--model-version", type=str, default=config.MODEL_VERSION, help="Version for the saved model")
    train_parser.add_argument("--random-seed", type=int, default=42, help="Random seed for reproducibility")
    
    # API command
    api_parser = subparsers.add_parser("api", help="Start the API server")
    api_parser.add_argument("--host", type=str, default=config.API_HOST, help="Host to bind the server to")
    api_parser.add_argument("--port", type=int, default=config.API_PORT, help="Port to bind the server to")
    api_parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    
    # Recommend command
    recommend_parser = subparsers.add_parser("recommend", help="Generate a recommendation")
    recommend_parser.add_argument("--ph", type=float, required=True, help="Soil pH level (0-14)")
    recommend_parser.add_argument("--nitrogen", type=float, required=True, help="Nitrogen content in ppm")
    recommend_parser.add_argument("--phosphorus", type=float, required=True, help="Phosphorus content in ppm")
    recommend_parser.add_argument("--potassium", type=float, required=True, help="Potassium content in ppm")
    recommend_parser.add_argument("--moisture", type=float, required=True, help="Soil moisture percentage")
    recommend_parser.add_argument("--temperature", type=float, required=True, help="Soil temperature in Celsius")
    recommend_parser.add_argument("--organic-matter", type=float, help="Organic matter percentage")
    recommend_parser.add_argument("--conductivity", type=float, help="Electrical conductivity in dS/m")
    recommend_parser.add_argument("--salinity", type=float, help="Salinity in ppt")
    recommend_parser.add_argument("--top-n", type=int, default=3, help="Number of top recommendations to return")
    recommend_parser.add_argument("--output", type=str, help="File to save the recommendation to (JSON format)")
    
    # Parse the arguments
    args = parser.parse_args()
    
    # Run the appropriate command
    if args.command == "train":
        return run_train(sys.argv[2:])
    elif args.command == "api":
        return run_api(sys.argv[2:])
    elif args.command == "recommend":
        return run_recommend(sys.argv[2:])
    else:
        parser.print_help()
        return 0

if __name__ == "__main__":
    sys.exit(main()) 