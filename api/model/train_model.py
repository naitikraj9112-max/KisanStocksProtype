"""
KisanStocks Neural Network Crop Yield Prediction Model Trainer

Generates synthetic agricultural data based on ICAR crop baselines,
trains a scikit-learn MLPRegressor (Multi-Layer Perceptron Neural Network),
and exports the trained weights as pure JSON for browser-side inference.

This approach works on any Python version and produces a zero-dependency
JavaScript inference engine (no TF.js needed).

Output:
  - public/model/nn_weights.json  (Neural network weights + architecture)
  - public/model/scaler_params.json (Normalization parameters)
"""

import numpy as np
import json
import os
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# ============================================================
# 1. CROP BASELINES (ICAR-informed ideal growing conditions)
# ============================================================
CROP_PROFILES = {
    0: {"name": "Wheat",      "key": "wheat",     "n": 120, "p": 60,  "k": 40,  "ph": 6.5, "temp": 20, "humidity": 60, "rainfall": 40,  "baseYield": 4.5},
    1: {"name": "Rice",       "key": "rice",      "n": 100, "p": 50,  "k": 50,  "ph": 6.0, "temp": 25, "humidity": 80, "rainfall": 200, "baseYield": 5.2},
    2: {"name": "Maize (Corn)", "key": "maize",   "n": 140, "p": 70,  "k": 60,  "ph": 6.5, "temp": 24, "humidity": 65, "rainfall": 80,  "baseYield": 6.0},
    3: {"name": "Cotton",     "key": "cotton",    "n": 100, "p": 40,  "k": 80,  "ph": 6.8, "temp": 28, "humidity": 55, "rainfall": 50,  "baseYield": 2.5},
    4: {"name": "Soybean",    "key": "soybean",   "n": 40,  "p": 60,  "k": 80,  "ph": 6.5, "temp": 25, "humidity": 70, "rainfall": 70,  "baseYield": 3.2},
    5: {"name": "Sugarcane",  "key": "sugarcane", "n": 200, "p": 80,  "k": 120, "ph": 7.0, "temp": 30, "humidity": 80, "rainfall": 150, "baseYield": 75.0},
}

NUM_CROPS = len(CROP_PROFILES)
SAMPLES_PER_CROP = 3000  # 18,000 total samples


# ============================================================
# 2. SYNTHETIC DATA GENERATION
# ============================================================
def generate_data():
    """Generate realistic synthetic training data with agricultural noise."""
    np.random.seed(42)
    X_list = []
    y_yield_list = []
    y_suit_list = []

    for crop_id, profile in CROP_PROFILES.items():
        for _ in range(SAMPLES_PER_CROP):
            # Generate soil/weather with controlled noise around ideal values
            n = max(0, np.random.normal(profile["n"], profile["n"] * 0.45))
            p = max(0, np.random.normal(profile["p"], profile["p"] * 0.45))
            k = max(0, np.random.normal(profile["k"], profile["k"] * 0.45))
            ph = np.clip(np.random.normal(profile["ph"], 1.2), 3.0, 10.0)
            temp = np.clip(np.random.normal(profile["temp"], 7.0), 2.0, 50.0)
            humidity = np.clip(np.random.normal(profile["humidity"], 18.0), 5.0, 100.0)
            rainfall = max(0, np.random.normal(profile["rainfall"], profile["rainfall"] * 0.55))

            # Calculate ground-truth suitability using a non-linear variance model
            def variance_penalty(actual, ideal, weight):
                if ideal == 0:
                    return 0
                dev = abs(actual - ideal) / ideal
                return min(dev, 1.0) * weight

            penalty = (
                variance_penalty(n, profile["n"], 15) +
                variance_penalty(p, profile["p"], 10) +
                variance_penalty(k, profile["k"], 10) +
                variance_penalty(ph, profile["ph"], 25) +
                variance_penalty(temp, profile["temp"], 15) +
                variance_penalty(humidity, profile["humidity"], 10) +
                variance_penalty(rainfall, profile["rainfall"], 15)
            )
            suitability = max(0.0, min(100.0, 100 - penalty))

            # Calculate yield with non-linear relationship
            yield_modifier = 0.12 + 0.88 * (suitability / 100) ** 1.4
            base_yield = profile["baseYield"] * yield_modifier
            # Add realistic noise (±6%)
            noise = 1.0 + np.random.uniform(-0.06, 0.06)
            final_yield = max(0, base_yield * noise)

            # One-hot encode crop
            crop_onehot = [0.0] * NUM_CROPS
            crop_onehot[crop_id] = 1.0

            features = [n, p, k, ph, temp, humidity, rainfall] + crop_onehot
            X_list.append(features)
            y_yield_list.append(final_yield)
            y_suit_list.append(suitability)

    return np.array(X_list), np.array(y_yield_list), np.array(y_suit_list)


# ============================================================
# 3. EXPORT WEIGHTS AS JSON
# ============================================================
def export_mlp_to_json(model, filename):
    """Export scikit-learn MLPRegressor weights to a JSON file for JS inference."""
    layers = []
    for i, (W, b) in enumerate(zip(model.coefs_, model.intercepts_)):
        layers.append({
            "weights": W.tolist(),
            "biases": b.tolist(),
        })

    architecture = {
        "activation": model.activation,
        "output_activation": "identity",  # regression
        "n_layers": len(layers),
        "layers": layers,
    }

    with open(filename, "w") as f:
        json.dump(architecture, f)

    size_kb = os.path.getsize(filename) / 1024
    print(f"  ✓ NN weights saved: {filename} ({size_kb:.1f} KB)")


# ============================================================
# 4. TRAINING PIPELINE
# ============================================================
def train():
    print("=" * 60)
    print("  KisanStocks Neural Network Trainer")
    print("  (scikit-learn MLPRegressor → JSON export)")
    print("=" * 60)

    # --- Generate Data ---
    print(f"\n[1/6] Generating {SAMPLES_PER_CROP * NUM_CROPS:,} synthetic training samples...")
    X, y_yield, y_suit = generate_data()
    print(f"  Features shape: {X.shape}")
    print(f"  Yield range: {y_yield.min():.2f} – {y_yield.max():.2f} Tons/Ha")
    print(f"  Suitability range: {y_suit.min():.1f} – {y_suit.max():.1f}")

    # --- Normalize ---
    print("\n[2/6] Normalizing features with StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # --- Split ---
    X_train, X_test, y_yield_train, y_yield_test, y_suit_train, y_suit_test = train_test_split(
        X_scaled, y_yield, y_suit, test_size=0.15, random_state=42
    )
    print(f"  Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples")

    # --- Train Yield Model ---
    print("\n[3/6] Training YIELD prediction neural network...")
    yield_model = MLPRegressor(
        hidden_layer_sizes=(128, 64, 32, 16),
        activation="relu",
        solver="adam",
        max_iter=300,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=15,
        learning_rate_init=0.001,
        batch_size=64,
        random_state=42,
        verbose=True,
    )
    yield_model.fit(X_train, y_yield_train)

    y_yield_pred = yield_model.predict(X_test)
    yield_mae = mean_absolute_error(y_yield_test, y_yield_pred)
    yield_r2 = r2_score(y_yield_test, y_yield_pred)
    print(f"\n  Yield Model → MAE: {yield_mae:.3f} Tons/Ha | R²: {yield_r2:.4f}")

    # --- Train Suitability Model ---
    print("\n[4/6] Training SUITABILITY prediction neural network...")
    suit_model = MLPRegressor(
        hidden_layer_sizes=(128, 64, 32, 16),
        activation="relu",
        solver="adam",
        max_iter=300,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=15,
        learning_rate_init=0.001,
        batch_size=64,
        random_state=42,
        verbose=True,
    )
    suit_model.fit(X_train, y_suit_train)

    y_suit_pred = suit_model.predict(X_test)
    suit_mae = mean_absolute_error(y_suit_test, y_suit_pred)
    suit_r2 = r2_score(y_suit_test, y_suit_pred)
    print(f"\n  Suitability Model → MAE: {suit_mae:.2f} points | R²: {suit_r2:.4f}")

    # --- Export ---
    print("\n[5/6] Exporting models...")
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "model")
    os.makedirs(output_dir, exist_ok=True)

    export_mlp_to_json(yield_model, os.path.join(output_dir, "yield_nn.json"))
    export_mlp_to_json(suit_model, os.path.join(output_dir, "suit_nn.json"))

    # Save scaler parameters
    scaler_params = {
        "featureMean": scaler.mean_.tolist(),
        "featureStd": scaler.scale_.tolist(),
        "cropNames": [CROP_PROFILES[i]["name"] for i in range(NUM_CROPS)],
        "cropKeys": [CROP_PROFILES[i]["key"] for i in range(NUM_CROPS)],
        "numFeatures": int(X.shape[1]),
        "numCrops": NUM_CROPS,
    }
    scaler_path = os.path.join(output_dir, "scaler_params.json")
    with open(scaler_path, "w") as f:
        json.dump(scaler_params, f, indent=2)
    print(f"  ✓ Scaler params saved: {scaler_path}")

    # --- Summary ---
    print(f"\n{'='*60}")
    print(f"  ✅ Training Complete!")
    print(f"")
    print(f"  YIELD MODEL:")
    print(f"    Architecture:  Input(13) → 128 → 64 → 32 → 16 → Output(1)")
    print(f"    MAE:           {yield_mae:.3f} Tons/Ha")
    print(f"    R² Score:      {yield_r2:.4f}")
    print(f"    Iterations:    {yield_model.n_iter_}")
    print(f"")
    print(f"  SUITABILITY MODEL:")
    print(f"    Architecture:  Input(13) → 128 → 64 → 32 → 16 → Output(1)")
    print(f"    MAE:           {suit_mae:.2f} / 100 points")
    print(f"    R² Score:      {suit_r2:.4f}")
    print(f"    Iterations:    {suit_model.n_iter_}")
    print(f"")
    print(f"  Output files in: {output_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    train()
