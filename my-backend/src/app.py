import datetime
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants
G = 6.67430e-11  # Gravitational constant
SUN_MASS = 1.989e30  # Sun's mass (kg)
MERCURY_MASS = 3.3011e23
VENUS_MASS = 4.8675e24
MERCURY_ORBIT_RADIUS = 57.9e9  # Mercury orbit radius (m)
VENUS_ORBIT_RADIUS = 108.2e9  # Venus orbit radius (m)

# Orbit speeds (in radians per second)
MERCURY_ORBITAL_SPEED = 2 * math.pi / (87.97 * 24 * 3600)  # Complete orbit in 87.97 days
VENUS_ORBITAL_SPEED = 2 * math.pi / (224.7 * 24 * 3600)    # Complete orbit in 224.7 days

# Initialize starting date
epoch_date = datetime.datetime(2020, 1, 1)  # Epoch date for simulation

# Starting angles for each planet
mercury_angle = 0
venus_angle = 0

@app.route('/simulate', methods=['GET'])
def simulate():
    global mercury_angle, venus_angle, epoch_date

    # Retrieve the speed factor from query parameters (defaults to 1 if not provided)
    speed_factor = float(request.args.get('speed', 1))

    # Advance time in the simulation according to the speed factor
    time_step = 3600 * speed_factor  # Time step scaled by the speed factor (1 hour * speed factor in seconds)
    current_date = epoch_date + datetime.timedelta(seconds=time_step)
    epoch_date = current_date  # Update epoch date for the next call

    # Update angles for each planet
    mercury_angle += MERCURY_ORBITAL_SPEED * time_step
    venus_angle += VENUS_ORBITAL_SPEED * time_step

    # Wrap angles around 0 to 2π
    mercury_angle %= 2 * math.pi
    venus_angle %= 2 * math.pi

    # Calculate positions
    mercury_x = MERCURY_ORBIT_RADIUS * math.cos(mercury_angle) / 1e9  # Scale down for visibility
    mercury_y = MERCURY_ORBIT_RADIUS * math.sin(mercury_angle) / 1e9
    venus_x = VENUS_ORBIT_RADIUS * math.cos(venus_angle) / 1e9
    venus_y = VENUS_ORBIT_RADIUS * math.sin(venus_angle) / 1e9

    return jsonify({
        'mercury_position': (mercury_x, mercury_y),
        'venus_position': (venus_x, venus_y),
        'sun_position': (0, 0),
        'mercury_orbit_radius': MERCURY_ORBIT_RADIUS / 1e9,
        'venus_orbit_radius': VENUS_ORBIT_RADIUS / 1e9,
        'current_date': current_date.strftime('%Y-%m-%d %H:%M:%S')
    })

if __name__ == '__main__':
    app.run(debug=True)
