# calculations.py
import math
from constants import G

def calculate_forces(planets):
    """Calculates gravitational forces between all planets."""
    epsilon = 1e5  # Softening parameter (in meters)

    # Reset accelerations
    for p in planets:
        p['ax'] = 0
        p['ay'] = 0
        p['az'] = 0

    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            p1 = planets[i]
            p2 = planets[j]

            dx = p2['x'] - p1['x']
            dy = p2['y'] - p1['y']
            dz = p2['z'] - p1['z']

            distance_squared = dx**2 + dy**2 + dz**2 + epsilon**2
            distance = math.sqrt(distance_squared)

            force_magnitude = (G * p1['mass'] * p2['mass']) / distance_squared
            fx = force_magnitude * (dx / distance)
            fy = force_magnitude * (dy / distance)
            fz = force_magnitude * (dz / distance)

            p1['ax'] += fx / p1['mass']
            p1['ay'] += fy / p1['mass']
            p1['az'] += fz / p1['mass']
            p2['ax'] -= fx / p2['mass']
            p2['ay'] -= fy / p2['mass']
            p2['az'] -= fz / p2['mass']

def verlet_step(planets, dt):
    """Performs a single Verlet integration step."""
    # 1. Store current accelerations as "previous" accelerations.
    for p in planets:
        p['prev_ax'] = p['ax']
        p['prev_ay'] = p['ay']
        p['prev_az'] = p['az']

    # 2. Update positions based on current velocities and accelerations.
    for p in planets:
        p['x'] += p['vx'] * dt + 0.5 * p['ax'] * dt**2
        p['y'] += p['vy'] * dt + 0.5 * p['ay'] * dt**2
        p['z'] += p['vz'] * dt + 0.5 * p['az'] * dt**2

    # 3. Recalculate accelerations based on the *new* positions.
    calculate_forces(planets)

    # 4. Update velocities using the average of the previous and new accelerations.
    for p in planets:
        p['vx'] += 0.5 * (p['prev_ax'] + p['ax']) * dt
        p['vy'] += 0.5 * (p['prev_ay'] + p['ay']) * dt
        p['vz'] += 0.5 * (p['prev_az'] + p['az']) * dt