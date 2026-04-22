import pandas as pd
import os

# Paths
base_path = r"c:\Users\Naitik Raj\OneDrive\Desktop\PROJECTS\SOCIAL HACKATHON\agri-ai-app\Datasets"
yield_path = os.path.join(base_path, "crop_yield.csv")
weather_path = os.path.join(base_path, "state_weather_data_1997_2020.csv")
soil_path = os.path.join(base_path, "state_soil_data.csv")

# Load
yield_df = pd.read_csv(yield_path)
weather_df = pd.read_csv(weather_path)
soil_df = pd.read_csv(soil_path)

# Clean
yield_df['state'] = yield_df['state'].str.strip()
weather_df['state'] = weather_df['state'].str.strip()
soil_df['state'] = soil_df['state'].str.strip()

# Merge
merged_df = pd.merge(yield_df, weather_df, on=['state', 'year'], how='inner')
merged_df = pd.merge(merged_df, soil_df, on='state', how='inner')

print(f"Yield DF shape: {yield_df.shape}")
print(f"Weather DF shape: {weather_df.shape}")
print(f"Soil DF shape: {soil_df.shape}")
print(f"Merged DF shape: {merged_df.shape}")
print("\nFirst 5 rows of merged data:")
print(merged_df.head())
print("\nCrop counts in merged data:")
print(merged_df['crop'].value_counts())
