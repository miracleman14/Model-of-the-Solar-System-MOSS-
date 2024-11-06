import datetime
import math
from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Constants
G = 6.67430e-11  # Gravitational constant
SUN_MASS = 1.989e30  # Sun's mass (kg)
MERCURY_MASS = 3.3011e23
VENUS_MASS = 4.8675e24
MERCURY_ORBIT_RADIUS = 57.9e9  # Mercury orbit radius (m)
VENUS_ORBIT_RADIUS = 108.2e9  # Venus orbit radius (m)

class Vector3D:
    def __init__(self, x=0, y=0, z=0):
        self.x = x
        self.y = y
        self.z = z

    def __add__(self, other):
        return Vector3D(self.x + other.x, self.y + other.y, self.z + other.z)

class Planet:
    def __init__(self, mass, orbit_radius, orbital_speed):
        self.mass = mass
        self.orbit_radius = orbit_radius  # In meters
        self.orbital_speed = orbital_speed  # Speed in m/s
        self.angle = 0  # Starting angle (radians)

    def update_position(self, time_step):
        self.angle += self.orbital_speed * time_step / self.orbit_radius  # Update angular position
        # Ensure the angle wraps around correctly (0 to 2π)
        self.angle = self.angle % (2 * math.pi)

        # Calculate x, y positions based on the current angle and orbit radius
        x = self.orbit_radius * math.cos(self.angle)
        y = self.orbit_radius * math.sin(self.angle)

        return x, y

# Define planets
mercury = Planet(MERCURY_MASS, MERCURY_ORBIT_RADIUS, 47.36e3)  # Speed in m/s for Mercury
venus = Planet(VENUS_MASS, VENUS_ORBIT_RADIUS, 35.02e3)  # Speed in m/s for Venus

@app.route('/simulate', methods=['GET'])
def simulate():
    # Get date input
    date_input = request.args.get('date', default='2024-01-01')  # Default to 2024-01-01 if not provided
    target_date = datetime.datetime.strptime(date_input, '%Y-%m-%d')

    # Starting date for the simulation (e.g., when the simulation begins, "epoch")
    epoch_date = datetime.datetime(2020, 1, 1)

    # Calculate elapsed time in seconds
    elapsed_time = (target_date - epoch_date).total_seconds()

    # Time step (1 hour for a smoother simulation)
    time_step = 3600  # 1 hour in seconds

    mercury_positions = []
    venus_positions = []

    # Update positions based on elapsed time
    mercury_x, mercury_y = mercury.update_position(elapsed_time)
    venus_x, venus_y = venus.update_position(elapsed_time)

    # Scale positions for visualization (to kilometers for better scaling)
    mercury_position = (mercury_x / 1e9, mercury_y / 1e9)  # Scale to km for visibility
    venus_position = (venus_x / 1e9, venus_y / 1e9)

    # Return positions of the planets and their orbits
    return jsonify({
        'mercury_position': mercury_position,
        'venus_position': venus_position,
        'sun_position': (0, 0),  # Sun always at the center
        'mercury_orbit_radius': mercury.orbit_radius / 1e9,  # Scale orbit radius to km
        'venus_orbit_radius': venus.orbit_radius / 1e9,  # Scale orbit radius to km
    })


if __name__ == '__main__':
    app.run(debug=True)
