import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# Paths
base_path = r"c:\Users\Naitik Raj\OneDrive\Desktop\PROJECTS\SOCIAL HACKATHON\agri-ai-app\Datasets"
yield_path = os.path.join(base_path, "crop_yield.csv")
weather_path = os.path.join(base_path, "state_weather_data_1997_2020.csv")
soil_path = os.path.join(base_path, "state_soil_data.csv")
output_dir = r"c:\Users\Naitik Raj\OneDrive\Desktop\PROJECTS\SOCIAL HACKATHON\agri-ai-app\api\model\trained"

os.makedirs(output_dir, exist_ok=True)

# 1. Load and Merge
print("Loading data...")
yield_df = pd.read_csv(yield_path)
weather_df = pd.read_csv(weather_path)
soil_df = pd.read_csv(soil_path)

yield_df['state'] = yield_df['state'].str.strip()
weather_df['state'] = weather_df['state'].str.strip()
soil_df['state'] = soil_df['state'].str.strip()
yield_df['crop'] = yield_df['crop'].str.strip()
yield_df['season'] = yield_df['season'].str.strip()

merged_df = pd.merge(yield_df, weather_df, on=['state', 'year'], how='inner')
merged_df = pd.merge(merged_df, soil_df, on='state', how='inner')

# 2. Preprocessing
# Exclude area, production, year as they are not environmental/input factors for future prediction
features = ['crop', 'season', 'state', 'fertilizer', 'pesticide', 'avg_temp_c', 'total_rainfall_mm', 'avg_humidity_percent', 'N', 'P', 'K', 'pH']
target = 'yield'

X = merged_df[features].copy()
y = merged_df[target]

# Handle categorical variables
encoders = {}
for col in ['crop', 'season', 'state']:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = le
    print(f"Encoded {col}: {len(le.classes_)} classes")

# 3. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train Model
print("Training Random Forest Regressor (with size constraints)...")
model = RandomForestRegressor(
    n_estimators=50, 
    max_depth=15, 
    min_samples_leaf=5, 
    random_state=42, 
    n_jobs=-1
)
model.fit(X_train, y_train)

# 5. Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"\nModel Performance:")
print(f"MAE: {mae:.4f}")
print(f"R2 Score: {r2:.4f}")

# 6. Save Model and Encoders
joblib.dump(model, os.path.join(output_dir, "crop_yield_model.joblib"))
joblib.dump(encoders, os.path.join(output_dir, "encoders.joblib"))
joblib.dump(features, os.path.join(output_dir, "feature_names.joblib"))

print(f"\nModel and encoders saved to {output_dir}")
