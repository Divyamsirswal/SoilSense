import os
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

# Import config (assumes this file is in the utils directory)
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config

def connect_to_database():
    """
    Connect to the database specified in the config.
    Returns the database connection object.
    """
    try:
        # In a production environment, you would use the actual Prisma client
        # or other database connection method
        logger.info("Connecting to database...")
        # This is a placeholder for the actual connection logic
        # Normally, you would return the prisma client or other DB connection
        return None
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise

def fetch_soil_data(days: int = 30, farm_id: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch soil data from the database for the specified period.
    
    Args:
        days: Number of days to look back for data
        farm_id: Optional farm ID to filter the data
    
    Returns:
        DataFrame containing the soil data
    """
    try:
        # This is a placeholder for actual database fetching logic
        # In a real implementation, you would query the database
        
        # Example query logic (pseudocode):
        # date_threshold = datetime.now() - timedelta(days=days)
        # if farm_id:
        #     query = "SELECT * FROM SoilData WHERE timestamp >= ? AND farmId = ?"
        #     params = [date_threshold, farm_id]
        # else:
        #     query = "SELECT * FROM SoilData WHERE timestamp >= ?"
        #     params = [date_threshold]
        # result = execute_query(query, params)
        
        # For demonstration, create a mock dataset
        logger.info(f"Fetching soil data for the last {days} days")
        mock_data = generate_mock_soil_data(100, farm_id)
        return pd.DataFrame(mock_data)
    except Exception as e:
        logger.error(f"Error fetching soil data: {e}")
        return pd.DataFrame()

def generate_mock_soil_data(n_samples: int, farm_id: Optional[str] = None) -> List[Dict]:
    """
    Generate mock soil data for testing purposes.
    
    Args:
        n_samples: Number of samples to generate
        farm_id: Optional farm ID to include in the data
    
    Returns:
        List of dictionaries containing the mock data
    """
    np.random.seed(42)  # For reproducibility
    
    # Generate random data within realistic ranges
    data = []
    for i in range(n_samples):
        sample = {
            "id": f"soil_{i}",
            "pH": round(np.random.uniform(5.0, 8.0), 1),
            "nitrogen": round(np.random.uniform(10, 150), 1),
            "phosphorus": round(np.random.uniform(5, 100), 1),
            "potassium": round(np.random.uniform(10, 200), 1),
            "moisture": round(np.random.uniform(20, 80), 1),
            "temperature": round(np.random.uniform(15, 35), 1),
            "organicMatter": round(np.random.uniform(1, 10), 1) if np.random.random() > 0.2 else None,
            "conductivity": round(np.random.uniform(0.1, 2.0), 2) if np.random.random() > 0.3 else None,
            "salinity": round(np.random.uniform(0.1, 1.5), 2) if np.random.random() > 0.3 else None,
            "timestamp": (datetime.now() - timedelta(days=np.random.randint(0, 30))).isoformat(),
            "deviceId": f"device_{np.random.randint(1, 10)}",
            "farmId": farm_id if farm_id else f"farm_{np.random.randint(1, 5)}"
        }
        data.append(sample)
    
    return data

def preprocess_soil_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess the soil data for machine learning.
    
    Args:
        df: DataFrame containing the soil data
    
    Returns:
        Preprocessed DataFrame
    """
    if df.empty:
        logger.warning("Empty DataFrame received for preprocessing")
        return df
    
    try:
        # Copy to avoid modifying the original
        processed_df = df.copy()
        
        # Convert timestamp to datetime if it's not already
        if 'timestamp' in processed_df.columns and not pd.api.types.is_datetime64_any_dtype(processed_df.timestamp):
            processed_df['timestamp'] = pd.to_datetime(processed_df.timestamp)
        
        # Fill missing values with sensible defaults
        # For soil data, it's often better to use domain knowledge than simple imputation
        if 'organicMatter' in processed_df.columns:
            processed_df['organicMatter'].fillna(processed_df['organicMatter'].mean(), inplace=True)
        
        if 'conductivity' in processed_df.columns:
            processed_df['conductivity'].fillna(processed_df['conductivity'].mean(), inplace=True)
            
        if 'salinity' in processed_df.columns:
            processed_df['salinity'].fillna(processed_df['salinity'].mean(), inplace=True)
        
        # Ensure all required features are present
        for feature in config.REQUIRED_FEATURES:
            if feature not in processed_df.columns:
                logger.error(f"Required feature {feature} not found in the data")
                raise ValueError(f"Required feature {feature} not found in the data")
        
        # Log preprocessing success
        logger.info(f"Successfully preprocessed {len(processed_df)} soil data records")
        
        return processed_df
    
    except Exception as e:
        logger.error(f"Error preprocessing soil data: {e}")
        raise

def save_to_csv(df: pd.DataFrame, filename: str) -> str:
    """
    Save a DataFrame to a CSV file.
    
    Args:
        df: DataFrame to save
        filename: Name of the file to save to (without extension)
    
    Returns:
        Path to the saved file
    """
    try:
        filepath = os.path.join(config.DATA_DIR, f"{filename}.csv")
        df.to_csv(filepath, index=False)
        logger.info(f"Saved data to {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Error saving data to CSV: {e}")
        raise

def load_from_csv(filename: str) -> pd.DataFrame:
    """
    Load a DataFrame from a CSV file.
    
    Args:
        filename: Name of the file to load from (without extension)
    
    Returns:
        Loaded DataFrame
    """
    try:
        filepath = os.path.join(config.DATA_DIR, f"{filename}.csv")
        if not os.path.exists(filepath):
            logger.error(f"File {filepath} does not exist")
            return pd.DataFrame()
        
        df = pd.read_csv(filepath)
        logger.info(f"Loaded data from {filepath}: {len(df)} records")
        return df
    except Exception as e:
        logger.error(f"Error loading data from CSV: {e}")
        return pd.DataFrame()

def extract_features_for_model(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract features from the processed data for the model.
    
    Args:
        df: Preprocessed DataFrame
    
    Returns:
        DataFrame containing only the features needed for the model
    """
    if df.empty:
        return df
    
    try:
        # Select only the columns needed for the model
        features_df = df[config.SOIL_FEATURES].copy()
        
        # Handle any missing features by creating them with NaN values
        for feature in config.SOIL_FEATURES:
            if feature not in features_df.columns:
                features_df[feature] = np.nan
        
        logger.info(f"Extracted features for model: {features_df.columns.tolist()}")
        return features_df
    
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return pd.DataFrame()

def normalize_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize the features for the model.
    
    Args:
        df: DataFrame containing the features
    
    Returns:
        DataFrame with normalized features
    """
    if df.empty:
        return df
    
    try:
        # Simple min-max normalization
        normalized_df = df.copy()
        
        # Define reasonable min-max values for each feature
        # These should be determined from domain knowledge and data analysis
        normalization_ranges = {
            "pH": (0, 14),  # pH scale
            "nitrogen": (0, 200),  # ppm
            "phosphorus": (0, 150),  # ppm
            "potassium": (0, 300),  # ppm
            "moisture": (0, 100),  # percentage
            "temperature": (0, 50),  # Celsius
            "organicMatter": (0, 20),  # percentage
            "conductivity": (0, 5),  # dS/m
            "salinity": (0, 3)  # ppt
        }
        
        # Apply normalization to each feature
        for feature, (min_val, max_val) in normalization_ranges.items():
            if feature in normalized_df.columns:
                normalized_df[feature] = (normalized_df[feature] - min_val) / (max_val - min_val)
                # Clip values to [0, 1] range in case of outliers
                normalized_df[feature] = normalized_df[feature].clip(0, 1)
        
        logger.info(f"Normalized {len(normalized_df.columns)} features")
        return normalized_df
    
    except Exception as e:
        logger.error(f"Error normalizing features: {e}")
        return df  # Return original data on error 

def generate_synthetic_data(n_samples=100, random_state=42):
    """
    Generate synthetic soil data for testing the ML pipeline.
    
    Args:
        n_samples: Number of samples to generate
        random_state: Random seed for reproducibility
        
    Returns:
        Tuple of (features DataFrame, labels Series)
    """
    np.random.seed(random_state)
    
    # Map config feature names to more common names for soil properties 
    feature_mapping = {
        'pH': 'ph',
        'nitrogen': 'N', 
        'phosphorus': 'P',
        'potassium': 'K',
        'moisture': 'humidity',
        'temperature': 'temperature',
        'organicMatter': 'organic_matter',
        'conductivity': 'conductivity',
        'salinity': 'salinity'
    }
    
    # Define realistic ranges for soil properties
    soil_properties = {
        'N': (0, 140),    # Nitrogen (kg/ha)
        'P': (5, 145),    # Phosphorus (kg/ha)
        'K': (5, 205),    # Potassium (kg/ha)
        'temperature': (8.8, 43.7),  # Temperature (°C)
        'humidity': (14.3, 99.9),    # Humidity (%)
        'ph': (3.5, 9.9),  # pH value
        'rainfall': (20.2, 298.6),    # Rainfall (mm)
        'organic_matter': (0.5, 10.0),  # Organic matter (%)
        'conductivity': (0.2, 4.0),     # Electrical conductivity (dS/m)
        'salinity': (0.1, 3.0)          # Salinity (ppt)
    }
    
    # Create empty DataFrame
    features = pd.DataFrame()
    
    # Generate random values for each soil feature in config
    for feature in config.SOIL_FEATURES:
        feature_key = feature_mapping.get(feature, feature).lower()
        if feature_key in soil_properties:
            min_val, max_val = soil_properties[feature_key]
            features[feature_key] = np.random.uniform(min_val, max_val, n_samples)
        else:
            # Default range for any features not specifically defined
            features[feature_key] = np.random.uniform(0, 100, n_samples)
    
    # Define crop classes based on soil conditions
    crops = ['rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas',
             'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate',
             'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 'apple',
             'orange', 'papaya', 'coconut', 'cotton', 'jute', 'coffee']
    
    # Generate crop labels (simplified logic for demonstration)
    labels = []
    for _, row in features.iterrows():
        ph_value = row.get('ph', 7.0)  # Default to neutral if not available
        temp_value = row.get('temperature', 25.0)  # Default to moderate temp
        humidity_value = row.get('humidity', 60.0)  # Default to moderate humidity
        
        if ph_value < 5.5:
            # Acidic soil crops
            crop_group = ['rice', 'watermelon', 'mango', 'papaya', 'coconut']
        elif ph_value > 7.5:
            # Alkaline soil crops
            crop_group = ['chickpea', 'lentil', 'cotton', 'mothbeans', 'mungbean']
        else:
            # Neutral pH crops
            crop_group = ['maize', 'banana', 'orange', 'apple', 'grapes']
            
        # Add temperature and moisture consideration
        if temp_value > 30 and humidity_value > 70:
            # Hot and humid crops
            crop_group = list(set(crop_group + ['rice', 'banana', 'coconut', 'papaya']))
        elif temp_value < 20:
            # Cool weather crops
            crop_group = list(set(crop_group + ['apple', 'grapes', 'pomegranate']))
            
        # Select a random crop from the appropriate group
        labels.append(np.random.choice(crop_group))
    
    return features, pd.Series(labels, name='crop')

def load_data(data_path):
    """
    Load data from a CSV file.
    
    Args:
        data_path: Path to the CSV file
        
    Returns:
        Pandas DataFrame with the loaded data
    """
    try:
        logger.info(f"Loading data from {data_path}")
        if not os.path.exists(data_path):
            logger.error(f"Data file not found: {data_path}")
            raise FileNotFoundError(f"Data file not found: {data_path}")
            
        df = pd.read_csv(data_path)
        logger.info(f"Loaded {len(df)} records from {data_path}")
        return df
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise

def preprocess_data(data):
    """
    Preprocess data for model training.
    
    Args:
        data: Pandas DataFrame with raw data
        
    Returns:
        Tuple of (features DataFrame, labels Series)
    """
    try:
        logger.info("Preprocessing data")
        
        # Check if the data contains the target column
        if "crop" not in data.columns:
            logger.error("Data does not contain the 'crop' column, which is required for training")
            raise ValueError("Data does not contain the 'crop' column")
        
        # Extract labels
        labels = data["crop"]
        
        # Convert column names to lowercase if needed
        column_mapping = {col: col.lower() for col in data.columns}
        data_lower = data.rename(columns=column_mapping)
        
        # Try to match SOIL_FEATURES with data columns (case insensitive)
        available_features = []
        for feature in config.SOIL_FEATURES:
            feature_lower = feature.lower()
            if feature_lower in data_lower.columns:
                available_features.append(feature_lower)
            elif feature in data.columns:
                available_features.append(feature)
        
        if not available_features:
            logger.warning(f"Could not find any matching features from config.SOIL_FEATURES in data columns. "
                          f"Available columns: {list(data.columns)}")
            # Use all numeric columns as features
            features = data.select_dtypes(include=['number']).drop(['crop'], errors='ignore')
        else:
            # Get soil features from config
            features = data_lower[available_features].copy()
        
        # Handle missing values (if any)
        if features.isnull().any().any():
            logger.warning(f"Found {features.isnull().sum().sum()} missing values, filling with column means")
            features = features.fillna(features.mean())
        
        # Normalize features
        features = normalize_features(features)
        
        logger.info("Data preprocessing completed")
        return features, labels
    
    except Exception as e:
        logger.error(f"Error preprocessing data: {e}")
        raise 