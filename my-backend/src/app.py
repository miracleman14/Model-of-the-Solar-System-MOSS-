from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
from skyfield.api import load

import calculations
from constants import orbital_params, planetary_masses, M_sun, G, dt
import time
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])



# Function to fetch initial planet data
import math

# Load the ephemeris data
eph = load('de440.bsp')   # You can also use 'de430t.bsp' for higher precision
sun = eph['sun']
planets_skyfield = {
    "mercury": eph['mercury'],
    "venus": eph['venus'],
    "earth": eph['earth'],
    "mars": eph['mars barycenter'],
    "jupiter": eph['jupiter barycenter'],
    "saturn": eph['saturn barycenter'],
    "uranus": eph['uranus barycenter'],
    "neptune": eph['neptune barycenter'],
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

        # Use the Vis-Viva equation, modified for elliptical orbits
        velocity = math.sqrt(G * M_sun * (2 / distance - 1 / semi_major_axis))

        # Adjust angle and speed for elliptical orbits
        angle = math.atan2(y, x)
        initial_data.append({
            "name": planet_name.capitalize(),
            "mass": planetary_masses[planet_name],
            "radius": 1000,  # Approximation
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


def track_orbit_by_time_steps(planets, virtual_date, time_step):
    orbital_data = {
        planet['name']: {
            "orbit_count": 0,
            "last_orbit_time": virtual_date,
            "initial_position": (planet['x'], planet['y'], planet['z']),
            "tolerance": 1e-6  # Small tolerance for floating-point precision
        }
        for planet in planets if planet['name'] != "Sun"
    }

    for planet in planets:
        if planet['name'] == "Sun":
            continue

        current_time = virtual_date
        last_orbit_time = orbital_data[planet['name']]["last_orbit_time"]
        initial_position = orbital_data[planet['name']]["initial_position"]
        tolerance = orbital_data[planet['name']]["tolerance"]

        # Calculate the distance from the initial position
        current_position = (planet['x'], planet['y'], planet['z'])
        distance = math.sqrt(
            (current_position[0] - initial_position[0])**2 +
            (current_position[1] - initial_position[1])**2 +
            (current_position[2] - initial_position[2])**2
        )

        # If the distance is within the tolerance, consider the orbit completed
        if distance < tolerance:
            orbital_data[planet['name']]['orbit_count'] += 1
            print(f"{planet['name']} completed {orbital_data[planet['name']]['orbit_count']} orbits")
            orbital_data[planet['name']]['last_orbit_time'] = current_time  # Update the last orbit time
            orbital_data[planet['name']]['initial_position'] = current_position  # Update initial position to current position

    return orbital_data










planets = fetch_real_positions_for_today()

# Function to handle speed adjustment from frontend
@socketio.on('adjust_speed')
def adjust_speed(data):
    global dt
    speed_factor = data.get('speed', 1)

    # Validate speed_factor to avoid division by zero or invalid speeds
    if speed_factor <= 0:
        speed_factor = 0.1  # Minimum allowable speed to avoid issues

    # Adjust time step based on the validated speed factor
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

    # Initialize tracking for orbits
    orbit_data = {
        planet['name']: {
            "initial_angle": math.atan2(planet['y'], planet['x']),
            "orbits_completed": 0,
            "start_date": None,
            "end_date": None,
            "last_angle": math.atan2(planet['y'], planet['x'])  # Track last angle to detect crossing
        }
        for planet in planets if planet['name'] != "Sun"
    }

    try:
        while simulation_running:
            # Ensure dt is valid (avoid division by zero in sleep)
            safe_dt = max(dt, 0.1)  # Minimum allowable timestep

            # Update forces and positions
            calculations.calculate_forces(planets)
            calculations.verlet_step(planets, safe_dt)

            # Increment virtual date
            virtual_date += timedelta(seconds=safe_dt)



            # Check for orbit completion
            for planet in planets:
                if planet['name'] != "Sun":
                    current_angle = math.atan2(planet['y'], planet['x'])
                    initial_angle = orbit_data[planet['name']]['initial_angle']
                    last_angle = orbit_data[planet['name']]['last_angle']

                    # Detect orbit completion by checking if the angle has crossed the initial angle
                    if last_angle <= initial_angle < current_angle:
                        orbit_data[planet['name']]['orbits_completed'] += 1
                        orbit_data[planet['name']]['end_date'] = virtual_date

                        # Log the details of the orbit only when the planet completes an orbit
                        start_date = orbit_data[planet['name']]['start_date']
                        end_date = orbit_data[planet['name']]['end_date']
                        print(f"{planet['name']} completed orbit {orbit_data[planet['name']]['orbits_completed']}")
                        print(f"Orbit started on: {start_date}")
                        print(f"Orbit ended on: {end_date}")

                        # Reset start_date for the next orbit
                        orbit_data[planet['name']]['start_date'] = virtual_date

                    # Update last angle to the current angle for the next iteration
                    orbit_data[planet['name']]['last_angle'] = current_angle

                    # Set start_date if it's the first detection
                    if orbit_data[planet['name']]['start_date'] is None:
                        orbit_data[planet['name']]['start_date'] = virtual_date

            # Send updated data to the frontend
            planet_data = [
                planet for planet in planets if planet['name'] in ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
            ]
            socketio.emit('planet_data', {'planets': planet_data, 'date': virtual_date.isoformat()})

            # Sleep to control simulation speed
            socketio.sleep(0.05 / safe_dt)
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


simulation_state = {
    "planets": fetch_real_positions_for_today(),
    "virtual_date": datetime.now()
}

@app.route('/reset')
def reset_simulation():
    global simulation_state
    simulation_state['planets'] = [dict(planet) for planet in initial_planets]
    simulation_state['virtual_date'] = datetime.now()  # Reset the virtual date
    return jsonify({"message": "Simulation reset", "planets": simulation_state['planets']})

@app.route('/api/get-simulation-state')
def get_simulation_state():
    return jsonify({
        "planets": simulation_state['planets'],
        "date": simulation_state['virtual_date'].isoformat()
    })



@app.route('/api/planet-data')
def get_planet_data():
    step_data = []
    for planet in planets:
        if planet['name'] != "Sun":
            step_data.append({
                "name": planet["name"],
                "x": planet["x"],
                "y": planet["y"],
                "vx": planet["vx"],
                "vy": planet["vy"],
                "radius": planet["radius"],
                "date": datetime.now().isoformat()  # Convert to ISO string
            })
    return jsonify({"planets": step_data})


@app.route('/api/orbit-paths')
def get_orbit_paths():
    # Generate orbital paths based on predefined orbital parameters and current positions
    orbit_paths = {}
    for planet_name, params in orbital_params.items():
        semi_major_axis = params["semi_major_axis"]
        eccentricity = params["eccentricity"]

        # Generate orbit path (a simple ellipse equation for demonstration)
        points = []
        for angle in range(0, 360, 5):  # Sample points around the orbit
            angle_rad = math.radians(angle)
            r = semi_major_axis * (1 - eccentricity**2) / (1 + eccentricity * math.cos(angle_rad))
            x = r * math.cos(angle_rad)
            y = r * math.sin(angle_rad)
            points.append([x, y])

        orbit_paths[planet_name] = points

    return jsonify(orbit_paths)





if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
