from flask import Flask, jsonify
from flask_cors import CORS  # Import CORS to handle cross-origin requests
from werkzeug.routing import BaseConverter
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Custom converter for float
class FloatConverter(BaseConverter):
    regex = r'\d+\.\d+|\d+'

app.url_map.converters['float'] = FloatConverter

@app.route('/')
def index():
    return "Welcome to the Solar System Simulation API! Use the /simulate/<steps>/<time_step> endpoint."

# 3D Vector to represent positions, velocities, and forces
class Vector3D:
    def __init__(self, x=0, y=0, z=0):
        self.x = x
        self.y = y
        self.z = z

    def __add__(self, other):
        return Vector3D(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other):
        return Vector3D(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, scalar):
        return Vector3D(self.x * scalar, self.y * scalar, self.z * scalar)

    def magnitude(self):
        return math.sqrt(self.x ** 2 + self.y ** 2 + self.z ** 2)

class Planet:
    def __init__(self, mass, position, velocity):
        self.mass = mass
        self.position = position
        self.velocity = velocity
        self.force = Vector3D()

# Constants
G = 6.67430e-11  # Gravitational constant

# Masses in kg
SUN_MASS = 1.989e30
MERCURY_MASS = 3.3011e23
VENUS_MASS = 4.8675e24

# Initial positions (in meters) and velocities (in meters per second)
sun = Planet(SUN_MASS, Vector3D(0, 0, 0), Vector3D(0, 0, 0))
mercury = Planet(MERCURY_MASS, Vector3D(57.9e9, 0, 0), Vector3D(0, 47.36e3, 0))
venus = Planet(VENUS_MASS, Vector3D(108.2e9, 0, 0), Vector3D(0, 35.02e3, 0))

def calculate_gravitational_force(a, b):
    direction = b.position - a.position
    distance = direction.magnitude()
    if distance == 0:  # Avoid division by zero
        return Vector3D(0, 0, 0)
    force_magnitude = (G * a.mass * b.mass) / (distance ** 2)
    return direction * (force_magnitude / distance)

def update_planet(planet, time_step):
    # Compute acceleration: F = m * a -> a = F / m
    acceleration = planet.force * (1.0 / planet.mass)
    # Update position using simple integration
    planet.position = planet.position + planet.velocity * time_step + acceleration * (0.5 * time_step ** 2)
    # Update velocity (simplified)
    planet.velocity = planet.velocity + acceleration * time_step

@app.route('/simulate/<int:steps>/<float:time_step>', methods=['GET'])
def simulate(steps, time_step):
    time_step = float(time_step)  # Ensure time_step is a float

    for step in range(steps):
        # Reset forces
        sun.force = Vector3D()
        mercury.force = Vector3D()
        venus.force = Vector3D()

        # Calculate forces between planets
        force_sun_mercury = calculate_gravitational_force(sun, mercury)
        force_sun_venus = calculate_gravitational_force(sun, venus)
        force_mercury_venus = calculate_gravitational_force(mercury, venus)

        # Apply the forces
        sun.force -= force_sun_mercury
        mercury.force += force_sun_mercury - force_mercury_venus
        venus.force += force_sun_venus + force_mercury_venus

        # Update the planets' positions and velocities
        update_planet(sun, time_step)
        update_planet(mercury, time_step)
        update_planet(venus, time_step)

    return jsonify({
        'mercury_position': {'x': mercury.position.x, 'y': mercury.position.y, 'z': mercury.position.z},
        'venus_position': {'x': venus.position.x, 'y': venus.position.y, 'z': venus.position.z},
        'sun_position': {'x': sun.position.x, 'y': sun.position.y, 'z': sun.position.z}
    })


if __name__ == '__main__':
    app.run(debug=True)
