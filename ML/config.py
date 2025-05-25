import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
LOGS_DIR = os.path.join(BASE_DIR, "logs")

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Model parameters
MODEL_VERSION = "1.0.0"
MODEL_FILENAME = f"crop_recommendation_model_v{MODEL_VERSION}.joblib"
MODEL_PATH = os.path.join(MODELS_DIR, MODEL_FILENAME)

# Feature definitions
SOIL_FEATURES = [
    "pH", 
    "nitrogen", 
    "phosphorus", 
    "potassium", 
    "moisture", 
    "temperature", 
    "organicMatter",
    "conductivity",
    "salinity"
]

# Required features (minimum set needed for prediction)
REQUIRED_FEATURES = [
    "pH", 
    "nitrogen", 
    "phosphorus", 
    "potassium", 
    "moisture", 
    "temperature"
]

# Target crops with ideal conditions
# These are example values - should be refined with actual agronomic data
CROP_OPTIMAL_CONDITIONS = {
    "Rice": {"pH": (5.5, 6.5), "temperature": (20, 30), "moisture": (60, 80)},
    "Wheat": {"pH": (6.0, 7.0), "temperature": (15, 25), "moisture": (45, 65)},
    "Corn": {"pH": (5.8, 7.0), "temperature": (18, 32), "moisture": (50, 75)},
    "Potato": {"pH": (5.0, 6.5), "temperature": (15, 25), "moisture": (60, 80)},
    "Soybean": {"pH": (6.0, 7.0), "temperature": (20, 30), "moisture": (50, 70)},
    "Cotton": {"pH": (5.8, 7.0), "temperature": (20, 35), "moisture": (40, 65)},
    "Tomato": {"pH": (5.5, 7.0), "temperature": (18, 32), "moisture": (50, 70)},
    "Carrot": {"pH": (5.5, 7.0), "temperature": (15, 25), "moisture": (55, 75)},
    "Onion": {"pH": (5.5, 7.0), "temperature": (15, 27), "moisture": (50, 70)},
    "Lettuce": {"pH": (6.0, 7.0), "temperature": (12, 23), "moisture": (60, 80)},
    "Cabbage": {"pH": (6.0, 7.5), "temperature": (15, 25), "moisture": (55, 75)},
    "Cucumber": {"pH": (5.5, 7.0), "temperature": (18, 30), "moisture": (50, 70)},
    "Pepper": {"pH": (5.5, 7.0), "temperature": (18, 30), "moisture": (50, 70)},
    "Strawberry": {"pH": (5.5, 6.5), "temperature": (15, 26), "moisture": (55, 75)},
    "Watermelon": {"pH": (5.8, 7.2), "temperature": (20, 32), "moisture": (45, 65)},
}

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# MLflow settings
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
MLFLOW_EXPERIMENT_NAME = "crop_recommendation"

# Confidence score thresholds
HIGH_CONFIDENCE = 80  # 80% and above
MEDIUM_CONFIDENCE = 60  # 60-79%
# Below 60% is considered low confidence

# Recommendation settings
MAX_RECOMMENDATIONS = 5  # Maximum number of crops to recommend 