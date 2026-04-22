import sys
import os

# Add api directory to path
sys.path.append(os.path.join(os.getcwd(), "agri-ai-app", "api"))

from model.crop_model import predict_yield

def test_predictions():
    test_cases = [
        {
            "n": 90, "p": 42, "k": 43, "ph": 6.5, "temp": 28, "humidity": 80, "rainfall": 1500,
            "crop": "Rice", "state": "West Bengal", "season": "Kharif"
        },
        {
            "n": 120, "p": 60, "k": 40, "ph": 7.0, "temp": 15, "humidity": 60, "rainfall": 500,
            "crop": "Wheat", "state": "Punjab", "season": "Rabi"
        },
        {
            "n": 100, "p": 50, "k": 50, "ph": 6.5, "temp": 30, "humidity": 70, "rainfall": 1000,
            "crop": "Maize", "state": "Karnataka", "season": "Kharif"
        }
    ]

    print("Testing ML Model Predictions:")
    print("-" * 50)
    for i, case in enumerate(test_cases):
        prediction = predict_yield(**case)
        print(f"Test {i+1}: {case['crop']} in {case['state']}")
        print(f"  Input: {case}")
        print(f"  Predicted Yield: {prediction} Tons/Ha")
        print("-" * 50)

if __name__ == "__main__":
    test_predictions()
