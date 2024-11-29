from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
from skyfield.api import load

import calculations
import time
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])

# Gravitational constant
G = 6.67430e-11
dt = 60  # Default time step (60 seconds)
M_sun = 1.989e30  # Mass of the Sun

# Function to fetch initial planet data
import math

# Load the ephemeris data
eph = load('de421.bsp')  # You can also use 'de430t.bsp' for higher precision
sun = eph['sun']
planets_skyfield = {
    "mercury": eph['mercury'],
    "venus": eph['venus'],
}

# Predefined masses of planets in kilograms
planetary_masses = {
    "mercury": 3.3011e23,
    "venus": 4.8675e24,
    "earth": 5.97237e24,
    "mars": 6.4171e23,
    "jupiter": 1.8982e27,
    "saturn": 5.6834e26,
    "uranus": 8.6810e25,
    "neptune": 1.02413e26,
}

# Predefined orbital parameters for Mercury and Venus
orbital_params = {
    "mercury": {
        "semi_major_axis": 0.387,  # AU
        "eccentricity": 0.2056,
        "orbital_period": 88,  # days
    },
    "venus": {
        "semi_major_axis": 0.723,  # AU
        "eccentricity": 0.0067,
        "orbital_period": 225,  # days
    },
}

def fetch_real_positions_for_today():
    ts = load.timescale()
    current_time = ts.now()
    initial_data = []

    for planet_name, planet in planets_skyfield.items():
        # Get the position in AU
        planet_position = planet.at(current_time).observe(sun)
        position = planet_position.position.au  # Get position in AU
        x, y, z = position[0] * 1.496e11, position[1] * 1.496e11, position[2] * 1.496e11  # Convert AU to meters

        # Calculate the current distance to the Sun
        distance = math.sqrt(x**2 + y**2 + z**2)

        # Use planet-specific orbital parameters
        semi_major_axis = orbital_params[planet_name]["semi_major_axis"] * 1.496e11  # Convert AU to meters
        eccentricity = orbital_params[planet_name]["eccentricity"]

        # Compute the orbital velocity using the vis-viva equation
        velocity = math.sqrt(G * M_sun * (2 / distance - 1 / semi_major_axis))

        # Calculate angle of motion
        angle = math.atan2(y, x)

        initial_data.append({
            "name": planet_name.capitalize(),
            "mass": planetary_masses[planet_name],  # Use predefined mass
            "radius": 1000,  # Approximation; can be set more precisely
            "x": x,
            "y": y,
            "z": z,
            "vx": -velocity * math.sin(angle),
            "vy": velocity * math.cos(angle),
            "vz": 0,  # Assuming no initial z-velocity
            "ax": 0,
            "ay": 0,
            "az": 0,
        })

    # Add the Sun at the center
    initial_data.insert(0, {
        "name": "Sun",
        "mass": M_sun,
        "radius": 696.34e6,
        "x": 0,
        "y": 0,
        "z": 0,
        "vx": 0,
        "vy": 0,
        "vz": 0,
        "ax": 0,
        "ay": 0,
        "az": 0,
    })

    return initial_data






planets = fetch_real_positions_for_today()

# Function to handle speed adjustment from frontend
@socketio.on('adjust_speed')
def adjust_speed(data):
    global dt
    speed_factor = data.get('speed', 1)

    # Adjust time step based on speed factor
    dt = 60 * speed_factor  # Scale the timestep according to the speed factor
    emit('speed_updated', {'dt': dt}, broadcast=True)

# Add this to ensure only one simulation runs at a time
simulation_running = False

@socketio.on('start_simulation')
def start_simulation():
    global dt, simulation_running

    if simulation_running:
        emit('error', {'message': 'Simulation is already running'})
        return

    simulation_running = True
    virtual_date = datetime.now()

    try:
        while simulation_running:
            calculations.calculate_forces(planets)
            calculations.verlet_step(planets, dt)

            # Increment virtual date
            virtual_date += timedelta(seconds=dt)

            # Send updated data to the frontend
            planet_data = [
                planet for planet in planets if planet['name'] in ['Mercury', 'Venus']
            ]
            socketio.emit('planet_data', {'planets': planet_data, 'date': virtual_date.isoformat()})
            socketio.sleep(0.05 / dt)
    except Exception as e:
        print(f"Error in simulation: {e}")
    finally:
        simulation_running = False

@socketio.on('stop_simulation')
def stop_simulation():
    global simulation_running
    simulation_running = False




planets = fetch_real_positions_for_today()
initial_planets = planets.copy()


@app.route('/reset')
def reset_simulation():
    global planets
    planets = [dict(planet) for planet in initial_planets]
    return jsonify({"message": "Simulation reset", "planets": planets})


@app.route('/api/planet-data')
def get_planet_data():
    # Return current planet data
    step_data = [
        {**planet, "x": planet['x'], "y": planet['y']} for planet in planets if planet['name'] != "Sun"
    ]
    return jsonify({"planets": step_data})




if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
