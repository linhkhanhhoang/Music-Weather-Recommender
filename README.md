# Music-Weather Recommender

## Overview

The **Music-Weather Recommender** is a machine learning-powered application that suggests music based on the current weather conditions. The project uses Flask for the backend and scikit-learn for the recommendation model.

## Features

- Uses a trained machine learning model to suggest songs based on weather conditions.
- Fetches live weather data from an API.
- Provides a simple API to get song recommendations.

## Installation

### Prerequisites

Make sure you have the following installed:

- Python 3.10+
- `pip`
- `virtualenv` (optional but recommended)

### Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/linhkhanhhoang/Music-Weather-Recommender.git
   cd Music-Weather-Recommender
   ```

2. **Set up a virtual environment:**

   ```sh
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Upgrade pip and install dependencies:**

   ```sh
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```

4. **Run the app:**

   ```sh
   python3 ml_model/scripts/app.py
   ```

   ```sh
   node discord_bot/index.js
   ```

   The server will start at `http://127.0.0.1:5000`

## Usage

### API Endpoints

#### Get Song Recommendations

- **Endpoint:** `GET /recommend`
- **Query Parameters:**
  - `location`: City name or coordinates for weather lookup.
- **Example Request:**
  ```sh
  curl "http://127.0.0.1:5000/recommend?location=New%20York"
  ```
- **Response Example:**
  ```json
  {
    "location": "New York",
    "weather": "Rainy",
    "recommended_songs": [
      "Song 1",
      "Song 2",
      "Song 3"
    ]
  }
  ```

