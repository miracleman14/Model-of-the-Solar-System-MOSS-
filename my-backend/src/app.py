from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
import calculations
import time
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])

# Gravitational constant
G = 6.67430e-11
dt = 60  # Default time step (60 seconds)

# Function to fetch initial planet data
import math

def fetch_initial_planet_data():
    api_url = "https://api.le-systeme-solaire.net/rest/bodies/"
    planets = ["sun", "mercury", "venus"]
    initial_data = []

    for planet_name in planets:
        response = requests.get(f"{api_url}{planet_name}")
        if response.status_code == 200:
            data = response.json()
            if "semimajorAxis" in data and "mass" in data and "equaRadius" in data:
                # Ensure distance is non-zero and valid
                distance = float(data["semimajorAxis"]) * 1000  # Convert to meters
                if distance == 0:
                    print(f"Warning: Invalid distance for {planet_name}. Skipping.")
                    continue  # Skip this planet if the distance is zero

                mass = float(data["mass"]["massValue"]) * 10 ** int(data["mass"]["massExponent"])
                velocity = math.sqrt(G * 1.989e30 / distance)  # Tangential velocity

                planet = {
                    "name": data["englishName"],
                    "mass": mass,
                    "radius": float(data["equaRadius"]),
                    "x": distance,  # Assume starting x-position based on semimajorAxis
                    "y": 0,  # Start on the x-axis
                    "vx": 0,  # Update for correct velocity
                    "vy": velocity,  # Correct tangential velocity
                }
                initial_data.append(planet)
            else:
                print(f"Warning: Missing data for {planet_name}. Skipping.")
        else:
            print(f"Failed to fetch data for {planet_name}")

    # Add Sun manually
    initial_data.insert(0, {
        "name": "Sun",
        "mass": 1.989e30,
        "radius": 696.34e6,
        "x": 0,
        "y": 0,
        "vx": 0,
        "vy": 0
    })
    return initial_data



planets = fetch_initial_planet_data()

# Function to handle speed adjustment from frontend
@socketio.on('adjust_speed')
def adjust_speed(data):
    global dt
    speed_factor = data.get('speed', 1)

    # Adjust time step based on speed factor
    dt = 60 * speed_factor  # Scale the timestep according to the speed factor
    emit('speed_updated', {'dt': dt}, broadcast=True)

# Function to start the simulation
@socketio.on('start_simulation')
def start_simulation():
    global dt
    virtual_date = datetime.now()

    while True:
        # Perform calculations
        calculations.calculate_forces(planets)
        calculations.verlet_step(planets, dt)

        # Update virtual date based on dt
        virtual_date += timedelta(seconds=dt)

        # Prepare data to send to frontend
        planet_data = [
            {**planet, "x": planet['x'], "y": planet['y']} for planet in planets if planet['name'] != "Sun"
        ]

        # Emit planet data and current date
        socketio.emit('planet_data', {'planets': planet_data, 'date': virtual_date.isoformat()})
        socketio.sleep(0.05)  # Use socketio's event loop sleep

@app.route('/api/planet-data')
def get_planet_data():
    step_data = [
        {**planet, "x": planet['x'], "y": planet['y']} for planet in planets if planet['name'] != "Sun"
    ]
    return jsonify([step_data])

if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
