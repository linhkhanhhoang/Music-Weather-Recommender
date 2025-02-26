from flask import Flask, request, jsonify
import requests
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import euclidean
import joblib
import functions

app = Flask(__name__)

# Load the model and song dataframe at startup
model = joblib.load('/ml_model/models/music_weather_model.pkl')
song_df = pd.read_csv('/ml_model/data/278k_labelled_uri.csv')  # Make sure to update this path
song_df.rename(columns={"labels": "mood"}, inplace = True)
song_df.drop(columns=['Unnamed: 0.1', 'Unnamed: 0'], inplace=True)

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    data = request.json
    location = data.get('location')
    api_key = data.get('api_key')

    if not location or not api_key:
        return jsonify({"error": "Missing location or API key"}), 400

    weather_data = functions.get_weather_data(location, api_key)
    if not weather_data:
        return jsonify({"error": "Failed to retrieve weather data"}), 500

    predicted_features = functions.predict_song_features(model, weather_data)
    top_songs = functions.recommend_songs(predicted_features, song_df)

    return top_songs

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)