# SoilGuardian ML Integration Guide

This guide explains how to integrate the Machine Learning (ML) pipeline with the SoilGuardian application.

## Overview

The ML integration consists of:

1. **ML Pipeline**: A standalone Python-based system for crop recommendations
2. **API Endpoints**: FastAPI server to expose ML capabilities to the main app
3. **Frontend Components**: React components to display ML-based recommendations
4. **Database Models**: Prisma models to store ML recommendations

## Setup

### 1. Install Dependencies

First, ensure you have all the required dependencies installed:

```bash
# Install Node.js dependencies for the main app
npm install

# Install Python dependencies for the ML pipeline
cd ML
pip install -r requirements.txt
cd ..
```

### 2. Database Setup

Run the Prisma migration to add the ML recommendation model:

```bash
npx prisma migrate dev --name add-ml-recommendations
```

### 3. Environment Variables

Add the following environment variables to your `.env.local` file:

```
# ML API Configuration
ML_API_URL=http://localhost:8000
```

### 4. Train the ML Model

Before you can use the ML recommendations, you need to train a model:

```bash
cd ML
python models/train_model.py --use-synthetic --n-samples 1000 --model-type random_forest --skip-mlflow
cd ..
```

## Running the Application

### Option 1: Start Each Service Separately

Start the ML API server:

```bash
cd ML
SKIP_MLFLOW=true uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

In a separate terminal, start the Next.js app:

```bash
npm run dev
```

### Option 2: Start All Services Together

Use the combined services script:

```bash
npm run start-services
```

This will start both the ML API server and the Next.js app with a single command.

## How it Works

### Data Flow

1. User views soil data in the SoilGuardian app
2. User requests an ML-based crop recommendation
3. The app calls the `/api/ml-recommendation` Next.js API endpoint
4. This endpoint forwards the soil data to the ML API server
5. The ML model processes the data and returns recommendations
6. Results are stored in the database and displayed to the user

### Key Components

- **ML API Server**: `ML/api/main.py` - FastAPI server exposing ML functionality
- **Next.js API Route**: `app/api/ml-recommendation/route.ts` - Bridge between frontend and ML API
- **ML Recommendation Component**: `components/ml-crop-recommendation.tsx` - UI for displaying recommendations
- **Soil Data Detail Page**: `app/(dashboard)/soil-data/[id]/page.tsx` - Page integrating the ML recommendation

## Adding New Features

### Adding a New ML Model

1. Train the new model in `ML/models/train_model.py`
2. Update the model selection logic in `ML/api/predict.py`

### Enhancing Recommendations

1. Modify `ML/utils/data_utils.py` to process additional soil parameters
2. Update the recommendation generation in `ML/api/predict.py`
3. Update the UI component in `components/ml-crop-recommendation.tsx`

## Troubleshooting

### ML API Server Not Starting

- Check if the required Python packages are installed
- Ensure port 8000 is not in use by another application
- Verify that SKIP_MLFLOW is set to "true" to avoid MLflow connection issues

### Recommendations Not Showing

- Check if a trained model exists in the `ML/models` directory
- Verify the Next.js API is correctly forwarding requests to the ML API
- Check browser console for any errors in the frontend

### Model Training Issues

- Try with a smaller sample size: `--n-samples 100`
- Use a simpler model type: `--model-type random_forest`
- Check if all required packages are installed 