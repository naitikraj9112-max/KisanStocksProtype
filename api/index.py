"""
Prediction API Endpoint

A Flask-based REST API for crop yield prediction.
This can be deployed as a standalone microservice or serverless function.

Usage:
    pip install flask flask-cors
    python predict.py

Endpoint:
    POST /api/predict
    Body: { "n": 42, "p": 18, "k": 210, "ph": 6.5, "temp": 24.5, "humidity": 68, "rainfall": 12 }
    Response: { "prediction": 196.5, "status": "success" }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add current directory to path for model import
sys.path.insert(0, os.path.dirname(__file__))
from model.crop_model import predict_yield

app = Flask(__name__)
CORS(app)


@app.route('/api/predict', methods=['POST'])
def predict():
    """Handle prediction requests."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['n', 'p', 'k', 'ph', 'temp', 'humidity', 'rainfall']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400

        # Run prediction
        result = predict_yield(
            n=float(data['n']),
            p=float(data['p']),
            k=float(data['k']),
            ph=float(data['ph']),
            temp=float(data['temp']),
            humidity=float(data['humidity']),
            rainfall=float(data['rainfall']),
        )

        return jsonify({
            'status': 'success',
            'prediction': result,
            'unit': 'Tons/Ha',
        })

    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': f'Invalid numeric value: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'agri-ai-prediction'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
