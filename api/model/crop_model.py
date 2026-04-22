import os
import joblib
import numpy as np

# Load model and encoders
MODEL_PATH = os.path.join(os.path.dirname(__file__), "trained", "crop_yield_model.joblib")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "trained", "encoders.joblib")
FEATURE_NAMES_PATH = os.path.join(os.path.dirname(__file__), "trained", "feature_names.joblib")

model = None
encoders = None
feature_names = None

def load_model():
    global model, encoders, feature_names
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            encoders = joblib.load(ENCODER_PATH)
            feature_names = joblib.load(FEATURE_NAMES_PATH)
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")

def predict_yield(n, p, k, ph, temp, humidity, rainfall, crop='Rice', state='Assam', season='Kharif', fertilizer=0, pesticide=0):
    """
    Predict crop yield using the trained Random Forest model.
    """
    load_model()
    
    if model is None:
        # Fallback to formula if model fails to load
        soil_factor = (n + p + k) * ph / 10
        temp_factor = temp * 0.5
        humidity_factor = humidity * 0.3
        rainfall_factor = rainfall * 0.2
        return round(soil_factor + temp_factor + humidity_factor + rainfall_factor, 1)

    # Prepare input data as a 2D numpy array
    # Order must match: crop, season, state, fertilizer, pesticide, temp, rainfall, humidity, N, P, K, ph
    # Note: We need to ensure the order matches what was saved in feature_names.joblib
    
    try:
        # Get encoded values
        c_val = encoders['crop'].transform([crop])[0] if 'crop' in encoders else 0
        s_val = encoders['season'].transform([season])[0] if 'season' in encoders else 0
        st_val = encoders['state'].transform([state])[0] if 'state' in encoders else 0
        
        # Build features in correct order
        # features = ['crop', 'season', 'state', 'fertilizer', 'pesticide', 'avg_temp_c', 'total_rainfall_mm', 'avg_humidity_percent', 'N', 'P', 'K', 'pH']
        input_row = [
            c_val, s_val, st_val, 
            float(fertilizer), float(pesticide), 
            float(temp), float(rainfall), float(humidity),
            float(n), float(p), float(k), float(ph)
        ]
        
        input_array = np.array([input_row])
        
        prediction = model.predict(input_array)[0]
        return round(float(prediction), 2)
    except Exception as e:
        print(f"Error during prediction: {e}")
        return 0.0

if __name__ == "__main__":
    # Example usage
    result = predict_yield(
        n=42, p=18, k=210, ph=6.5,
        temp=24.5, humidity=68, rainfall=12,
        crop='Wheat', state='Punjab', season='Rabi'
    )
    print(f"Predicted Yield: {result} Tons/Ha")
