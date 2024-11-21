import math

# Gravitational constant
G = 6.67430e-11

# Small constant to prevent division by zero or near-zero distance
epsilon = 1e-5


def calculate_forces(planets):
    """
    Calculates the gravitational forces acting on each planet and updates their accelerations.
    """
    for p1 in planets:
        fx, fy = 0, 0
        for p2 in planets:
            if p1 != p2:
                dx = p2['x'] - p1['x']
                dy = p2['y'] - p1['y']
                distance = math.sqrt(dx**2 + dy**2)
                distance = max(distance, epsilon)

                # Calculate gravitational force
                force = G * p1['mass'] * p2['mass'] / distance**2

                # Decompose force into x and y components
                fx += force * dx / distance
                fy += force * dy / distance

        # Update acceleration for p1
        p1['ax'] = fx / p1['mass']
        p1['ay'] = fy / p1['mass']

def verlet_step(planets, dt):
    """
    Performs a Verlet integration step to update positions and velocities of planets.
    """
    # Update positions based on current velocities and accelerations
    for p in planets:
        p['x'] += p['vx'] * dt + 0.5 * p['ax'] * dt**2
        p['y'] += p['vy'] * dt + 0.5 * p['ay'] * dt**2

    # Store previous accelerations
    for p in planets:
        p['prev_ax'], p['prev_ay'] = p['ax'], p['ay']

    # Recalculate forces based on updated positions
    calculate_forces(planets)

    # Update velocities based on current and previous accelerations
    for p in planets:
        p['vx'] += 0.5 * (p['prev_ax'] + p['ax']) * dt
        p['vy'] += 0.5 * (p['prev_ay'] + p['ay']) * dt



def calculate_energy(planets):
    """
    Calculates the total energy (kinetic + potential) of the system for debugging purposes.
    """
    kinetic_energy = sum(0.5 * p['mass'] * (p['vx']**2 + p['vy']**2) for p in planets)
    potential_energy = 0
    for i, p1 in enumerate(planets):
        for j, p2 in enumerate(planets):
            if i < j:
                dx = p2['x'] - p1['x']
                dy = p2['y'] - p1['y']
                distance = math.sqrt(dx**2 + dy**2)
                distance = max(distance, epsilon)  # Prevent division by small distances
                potential_energy -= G * p1['mass'] * p2['mass'] / distance
    return kinetic_energy + potential_energy