import joblib
import requests
import json
import pandas as pd
import numpy as np
from scipy.spatial.distance import euclidean
from sklearn.preprocessing import StandardScaler

# song_df = pd.read_csv('/Users/linhkhanhhoang/Music-Weather-Recommender/ml_model/data/278k_labelled_uri.csv')
# song_df.rename(columns={"labels": "mood"}, inplace = True)
# song_df.drop(columns=['Unnamed: 0.1', 'Unnamed: 0'], inplace=True)

def get_lat_lon(location, api_key):
    url = f'http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={api_key}'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            posts = response.json()
            lat = posts[0]['lat']
            lon = posts[0]['lon']
            return lat, lon
        else:
            print('Error:', response.status_code)
            return None
    except requests.exceptions.RequestException as e:
        print('Error:', e)
        return None
    
def get_weather(api_key, lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            posts = response.json()
            temp_min = posts['main']['temp_min']
            temp_max = posts['main']['temp_max']
            wind_speed = posts['wind']['speed']
            weather = posts['weather'][0]['main']
            return temp_min, temp_max, wind_speed, weather
        else:
            print('Error:', response.status_code)
            return None
    except requests.exceptions.RequestException as e:
        print('Error:', e)
        return None

def get_weather_data(location, api_key):
    lat_lon = get_lat_lon(location, api_key)
    if lat_lon:
        lat, lon = lat_lon
        weather_data = get_weather(api_key, lat, lon)
        if weather_data:
            temp_min, temp_max, wind_speed, weather = weather_data
            return {
                "temp_min": temp_min,
                "temp_max": temp_max,
                "wind_speed": wind_speed,
                "weather": weather
            }
        else:
            print("Failed to retrieve weather data.")
            return None
    else:
        print("Failed to retrieve location coordinates.")
        return None

def predict_song_features(model, weather_input):
    # model = joblib.load('/Users/linhkhanhhoang/Music-Weather-Recommender/ml_model/models/music_weather_model.pkl')
    input_df = pd.DataFrame([weather_input])
    predicted_features = model.predict(input_df)

    feature_names = np.array(['danceability', 'energy', 'loudness', 'speechiness',
            'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'])
    predicted_dict = {name: value for name, value in zip(feature_names, predicted_features[0])}

    return predicted_dict
  
def recommend_songs(predicted_features, song_df, top_n=10):
    if not isinstance(predicted_features, dict):
        raise ValueError("predicted_features should be a dictionary")
    feature_names = list(predicted_features.keys())

    scaler = StandardScaler()
    song_features_normalized = scaler.fit_transform(song_df[feature_names])

    predicted_features_array = np.array(list(predicted_features.values())).reshape(1, -1)
    predicted_features_normalized = scaler.transform(predicted_features_array)

    predicted_features_flat = predicted_features_normalized.flatten()

    distances = [euclidean(predicted_features_flat, song_features.flatten())
                 for song_features in song_features_normalized]

    top_indices = np.argsort(distances)[:top_n]

    top_songs = song_df.iloc[top_indices]['uri'].tolist()

    return top_songs
