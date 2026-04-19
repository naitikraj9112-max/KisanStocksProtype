"""
Crop Yield Prediction Model

Currently uses a formula-based approach.
Can be extended to use ML models (scikit-learn, TensorFlow, etc.)
"""


def predict_yield(n, p, k, ph, temp, humidity, rainfall):
    """
    Predict crop yield based on soil parameters and weather conditions.

    Formula:
        yield = ((N + P + K) * pH / 10) + (temp * 0.5) + (humidity * 0.3) + (rainfall * 0.2)

    Args:
        n (float): Nitrogen level
        p (float): Phosphorus level
        k (float): Potassium level
        ph (float): Soil pH level
        temp (float): Temperature in °C
        humidity (float): Relative humidity (%)
        rainfall (float): Rainfall in mm

    Returns:
        float: Predicted yield value
    """
    soil_factor = (n + p + k) * ph / 10
    temp_factor = temp * 0.5
    humidity_factor = humidity * 0.3
    rainfall_factor = rainfall * 0.2

    yield_value = soil_factor + temp_factor + humidity_factor + rainfall_factor

    return round(yield_value, 1)


if __name__ == "__main__":
    # Example usage
    result = predict_yield(
        n=42, p=18, k=210, ph=6.5,
        temp=24.5, humidity=68, rainfall=12
    )
    print(f"Predicted Yield: {result} Tons/Ha")
