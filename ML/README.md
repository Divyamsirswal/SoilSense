# SoilGuardian Machine Learning Pipeline

This directory contains the machine learning pipeline for the SoilGuardian application, which provides crop recommendations based on soil data.

## Directory Structure

- `ML/data/` - Data storage for training and testing datasets
- `ML/models/` - Trained models and model training scripts
- `ML/utils/` - Utility functions for data processing and model operations
- `ML/api/` - FastAPI endpoints for serving model predictions
- `ML/notebooks/` - Jupyter notebooks for data exploration and analysis

## Setup and Installation

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Make sure the required directories exist:

```bash
mkdir -p data models/saved logs
```

## Training a Model

Train a model using synthetic data:

```bash
python models/train_model.py --use-synthetic --n-samples 1000 --model-type random_forest --skip-mlflow
```

Available model types:

- `random_forest`
- `xgboost`
- `lightgbm`
- `gradient_boosting`

## Making Predictions

Test the model with synthetic data:

```bash
python api/predict.py --use-synthetic
```

Or with custom soil parameters:

```bash
python api/predict.py --ph 6.5 --temperature 25 --humidity 60 --nitrogen 80 --phosphorus 30 --potassium 40
```

## API Integration

The ML pipeline can be integrated with the main application through the FastAPI endpoints in the `api` directory.

Start the API server:

```bash
uvicorn api.main:app --reload
```

## Model Improvement

To improve the model:

1. Collect more real-world soil and crop data
2. Update the feature engineering in `utils/data_utils.py`
3. Tune model hyperparameters in `models/train_model.py`
4. Add more crop-specific advice in `api/predict.py`

## Contribution

When contributing to this ML pipeline:

1. Always create test cases in `tests/`
2. Document new features and parameters
3. Follow the existing code style and structure
