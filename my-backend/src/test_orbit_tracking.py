from datetime import datetime, timedelta
import math
import time
from app import fetch_real_positions_for_today

def track_orbit_by_time_steps(planets, virtual_date, time_step):
    # Expected orbital periods in Earth days
    expected_orbital_periods = {
        "Mercury": 88,
        "Venus": 225,
        "Earth": 365.25,
        "Mars": 687,
        "Jupiter": 4333,
        "Saturn": 10759,
        "Uranus": 30687,
        "Neptune": 60190,
        "Pluto": 90560
    }

    # Initialize orbital data for each planet
    if not hasattr(track_orbit_by_time_steps, 'orbital_data'):
        track_orbit_by_time_steps.orbital_data = {
            planet['name']: {
                "orbit_count": 0,
                "last_orbit_time": None,  # Timestamp of the last orbit completion
                "last_angle": None,  # Last recorded angle of the planet
                "orbit_times": []  # List to store timestamps of each orbit completion
            }
            for planet in planets if planet['name'] != "Sun"
        }

    orbital_data = track_orbit_by_time_steps.orbital_data

    for planet in planets:
        if planet['name'] == "Sun":
            continue

        # Extract orbital data for the current planet
        planet_name = planet['name']
        current_time = virtual_date

        # Calculate the angle of the planet in its orbit (relative to the positive x-axis)
        current_angle = math.atan2(planet['y'], planet['x'])  # Angle in radians

        # Initialize last_angle if it's not set
        if orbital_data[planet_name]['last_angle'] is None:
            orbital_data[planet_name]['last_angle'] = current_angle
            continue

        # Debug: Print current angle and last angle
        print(f"{planet_name}: Current angle = {current_angle:.2f}, Last angle = {orbital_data[planet_name]['last_angle']:.2f}")

        # Check if the planet has crossed the positive x-axis (angle wraps around from -π to π)
        if orbital_data[planet_name]['last_angle'] > 0 and current_angle < 0:
            # Orbit completed
            orbital_data[planet_name]['orbit_count'] += 1
            orbital_data[planet_name]['orbit_times'].append(current_time)  # Record the orbit completion time

            # Calculate the time difference between the last two orbits (if applicable)
            if len(orbital_data[planet_name]['orbit_times']) > 1:
                last_orbit_time = orbital_data[planet_name]['orbit_times'][-2]
                current_orbit_time = orbital_data[planet_name]['orbit_times'][-1]

                # Calculate the actual time difference in days
                actual_orbital_period = (current_orbit_time - last_orbit_time).total_seconds() / (60 * 60 * 24)

                # Get the expected orbital period for the planet
                expected_period = expected_orbital_periods.get(planet_name, None)

                # Print the result in the desired format
                if expected_period:
                    print(f"{planet_name}:")
                    print(f"  Orbit {orbital_data[planet_name]['orbit_count']}:")
                    print(f"    Actual orbital period: {actual_orbital_period:.2f} days")
                    print(f"    Expected orbital period: {expected_period} days")
                    print(f"    Difference: {abs(actual_orbital_period - expected_period):.2f} days")
                else:
                    print(f"{planet_name}: No expected orbital period data available.")

            # Update the last orbit time
            orbital_data[planet_name]['last_orbit_time'] = current_time

        # Update the last angle for next comparison
        orbital_data[planet_name]['last_angle'] = current_angle

def run_orbit_simulation():
    # Fetch initial planet data
    planets = fetch_real_positions_for_today()
    # Initialize simulation parameters
    virtual_date = datetime.now()
    time_step = 3600  # 1 hour in seconds

    # Run the simulation loop
    while True:
        # Update the virtual date
        virtual_date += timedelta(seconds=time_step)

        # Simulate planet motion (update positions)
        for planet in planets:
            if planet['name'] == "Sun":
                continue

            # Update position based on velocity (simple Euler integration)
            planet['x'] += planet['vx'] * time_step
            planet['y'] += planet['vy'] * time_step
            planet['z'] += planet['vz'] * time_step

            # Calculate gravitational acceleration (simplified for demonstration)
            distance = math.sqrt(planet['x']**2 + planet['y']**2 + planet['z']**2)
            ax = -planet['x'] / distance**3  # Simplified gravity towards the Sun
            ay = -planet['y'] / distance**3
            az = -planet['z'] / distance**3

            # Update velocity based on acceleration
            planet['vx'] += ax * time_step
            planet['vy'] += ay * time_step
            planet['vz'] += az * time_step

        # Track orbits and update planet positions
        track_orbit_by_time_steps(planets, virtual_date, time_step)

        # Sleep to control the simulation speed
        time.sleep(1)

if __name__ == "__main__":
    run_orbit_simulation()