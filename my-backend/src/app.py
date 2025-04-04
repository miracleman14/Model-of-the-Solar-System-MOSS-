import json
import os
import re
import math
import copy
from datetime import datetime, timedelta
from urllib import request
import time  # Import for benchmarking

import requests
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from skyfield.api import load, wgs84
import calculations  # Import the calculations module
from constants import orbital_params, planetary_masses, M_sun, G, moon_data

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])

# File to store custom planets
CUSTOM_PLANETS_FILE = 'custom_planets.json'

def load_custom_planets():
    """Load custom planets from the JSON file."""
    try:
        with open(CUSTOM_PLANETS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_custom_planets(planets):
    """Save custom planets to the JSON file."""
    with open(CUSTOM_PLANETS_FILE, 'w') as f:
        json.dump(planets, f)


# --- Load Ephemeris Files (Simplified) ---
eph = load('de440.bsp')  # Main solar system ephemeris

# --- Robust Jupiter Moon Ephemeris Loading (using jup365)---
try:
    jup = load('jup365.bsp')
except OSError as e:
    if "cannot download" in str(e) and "404" in str(e):
        print("Error: jup365.bsp not found. Trying alternative names...")
        jupiter_moon_ephemeris_alternatives = [
            'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/jup365.bsp'
        ]
        for alt_name in jupiter_moon_ephemeris_alternatives:
            try:
                jup = load(alt_name)
                print(f"Success! Loaded Jupiter moons ephemeris from: {alt_name}")
                break
            except OSError:
                print(f"  Failed to load: {alt_name}")
        else:
            raise FileNotFoundError("Could not load a Jupiter moon ephemeris file.") from None
    else:
        raise


# --- Skyfield Objects ---
sun = eph['sun']
planets_skyfield = {
    "mercury": eph['mercury barycenter'],
    "venus": eph['venus barycenter'],
    "earth": eph['earth barycenter'],
    "mars": eph['mars barycenter'],
    "jupiter": eph['jupiter barycenter'],
    "saturn": eph['saturn barycenter'],
    "uranus": eph['uranus barycenter'],
    "neptune": eph['neptune barycenter'],
    "pluto": eph['pluto barycenter'],
}

# --- Jupiter Moon ID Mapping ---
jupiter_moon_ids = {
    'Io': 501,
    'Europa': 502,
    'Ganymede': 503,
    'Callisto': 504,
}


def initialize_small_body(small_body_id, name):
    """Initializes a small body with caching."""

    cache_file = f'cache_{name}.json'
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            # Validate cached data
            if all(key in cached_data for key in ["x", "y", "z", "vx", "vy", "vz"]):
                print(f"Using cached data for {name}")
                return cached_data
        except (json.JSONDecodeError, FileNotFoundError):
            print(f"Invalid or missing cache file for {name}.  Fetching from JPL...")

    # If no cache, or cache is invalid, fetch data.
    small_body = _fetch_small_body_data(small_body_id, name)

    if small_body:
        # Cache the fetched data
        try:
            with open(cache_file, 'w') as f:
                json.dump(small_body, f)
        except IOError as e:
            print(f"Warning: Could not write cache file for {name}: {e}")
    return small_body

def _fetch_small_body_data(small_body_id, name):
    """Fetches small body data from JPL Horizons (internal helper)."""
    ts = load.timescale()
    t = ts.now()
    yesterday = t - 1
    start_time = yesterday.utc_strftime('%Y-%m-%d')
    end_time = (yesterday + 1).utc_strftime('%Y-%m-%d')

    list_url = (
        f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='{small_body_id}'"
        f"&OBJ_DATA='YES'&MAKE_EPHEM='NO'"
    )

    try:
        response = requests.get(list_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        result = data.get('result', '')
        match = re.search(r"^\s*(\d+)\s+", result, re.MULTILINE)
        if not match:
            print(f"Warning: Could not find record number for {name}.")
            return None

        record_number = match.group(1)

        ephemeris_url = (
            f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='{record_number}'"
            f"&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@0'"
            f"&REF_PLANE='ECLIPTIC'&REF_SYSTEM='J2000'&VEC_CORR='NONE'&VEC_DELTA_T='NO'"
            f"&CSV_FORMAT='YES'&VEC_LABELS='NO'&START_TIME='{start_time}'&STOP_TIME='{end_time}'"
            f"&STEP_SIZE='1d'"
        )

        response = requests.get(ephemeris_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        result = data.get('result', '')
        soe_index = result.find("$$SOE")
        eoe_index = result.find("$$EOE")
        if soe_index == -1 or eoe_index == -1:
            print(f"Warning: Ephemeris markers not found for {name}.")
            return None

        ephemeris_data = result[soe_index + len("$$SOE"):eoe_index].strip()
        lines = ephemeris_data.split('\n')

        if not lines:
            print(f"Warning: No ephemeris data for {name}.")
            return None

        components = lines[0].strip().split(',')
        if len(components) < 7:
            print(f"Warning: Insufficient components for {name}.")
            return None

        x = float(components[2].strip()) * 1e3
        y = float(components[3].strip()) * 1e3
        z = float(components[4].strip()) * 1e3
        vx = float(components[5].strip()) * 1e3
        vy = float(components[6].strip()) * 1e3
        vz = float(components[7].strip()) * 1e3


        small_body = {
            "name": name,
            "mass": 1e14,
            "radius": 5000,
            "x": x,
            "y": y,
            "z": z,
            "vx": vx,
            "vy": vy,
            "vz": vz,
            "ax": 0,
            "ay": 0,
            "az": 0,
        }
        return small_body

    except (requests.RequestException, ValueError, KeyError, IndexError) as e:
        print(f"Error fetching/parsing {name}'s data: {e}")
        return None



def fetch_real_positions_for_today():
    """Fetches and caches initial positions, then loads from cache."""

    cache_file = 'initial_positions_cache.json'

    # Try to load from cache
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            # Basic cache validation (check if all expected planets are there)
            required_keys = ["Sun", "Mercury", "Venus", "Earth", "Moon", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
            if all(any(body["name"] == key for body in cached_data) for key in required_keys):
                print("Using cached initial positions.")
                return cached_data
            else:
                print("Cached data is incomplete. Refetching...")
        except (json.JSONDecodeError, FileNotFoundError):
            print("Invalid or missing cache file.  Fetching from JPL...")



    # Fetch initial data (Skyfield for major bodies, JPL Horizons for small bodies)
    ts = load.timescale()
    current_time = ts.now()
    initial_data = []

    # --- Planets ---
    for planet_name, planet in planets_skyfield.items():
        planet_position = planet.at(current_time).observe(sun)
        position = planet_position.position.au
        x, y, z = position[0] * 1.496e11, position[1] * 1.496e11, position[2] * 1.496e11
        velocity_vector = planet.at(current_time).observe(sun).velocity.km_per_s
        vx, vy, vz = velocity_vector[0] * 1000, velocity_vector[1] * 1000, velocity_vector[2] * 1000

        initial_data.append({
            "name": planet_name.capitalize(),
            "mass": planetary_masses[planet_name],
            "radius": 6371000,
            "x": x,
            "y": y,
            "z": z,
            "vx": vx,
            "vy": vy,
            "vz": vz,
            "ax": 0,
            "ay": 0,
            "az": 0,
        })

    # --- Sun ---
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

    # --- Earth and Moon (for relative positioning) ---
    earth_data = next(p for p in initial_data if p['name'] == 'Earth')
    earth_x, earth_y, earth_z = earth_data['x'], earth_data['y'], earth_data['z']
    earth_vx, earth_vy, earth_vz = earth_data['vx'], earth_data['vy'], earth_data['vz']

    moon_position = eph['moon'].at(current_time).observe(eph['earth barycenter'])
    moon_pos_au = moon_position.position.au
    moon_rel_x, moon_rel_y, moon_rel_z = moon_pos_au[0] * 1.496e11, moon_pos_au[1] * 1.496e11, moon_pos_au[2] * 1.496e11
    moon_velocity = eph['moon'].at(current_time).observe(eph['earth barycenter']).velocity.km_per_s
    moon_rel_vx, moon_rel_vy, moon_rel_vz = moon_velocity[0] * 1000, moon_velocity[1] * 1000, moon_velocity[2] * 1000

    moon_x = earth_x + moon_rel_x
    moon_y = earth_y + moon_rel_y
    moon_z = earth_z + moon_rel_z
    moon_vx = earth_vx + moon_rel_vx
    moon_vy = earth_vy + moon_rel_vy
    moon_vz = earth_vz + moon_rel_vz

    initial_data.append({
        "name": "Moon",
        "mass": moon_data['Moon']['mass'],
        "radius": moon_data['Moon']['radius'],
        "x": moon_x,
        "y": moon_y,
        "z": moon_z,
        "vx": moon_vx,
        "vy": moon_vy,
        "vz": moon_vz,
        "ax": 0,
        "ay": 0,
        "az": 0,
    })

    # --- Other Moons ---
    for moon_name, moon in moon_data.items():
        if moon_name == 'Moon':
            continue

        parent_name = moon['parent']

        if parent_name == "Jupiter":
            moon_id = jupiter_moon_ids.get(moon_name)
            if moon_id is None:
                print(f"Error: No ID for Jupiter moon '{moon_name}'")
                continue

            try:
                moon_body = jup[moon_id]
                parent_barycenter = jup[599]
            except KeyError:
                print(f"Error: Could not find {moon_name} (ID {moon_id}) in Jupiter ephemeris.")
                continue

            relative_position = moon_body.at(current_time).observe(parent_barycenter)
            relative_velocity = moon_body.at(current_time).observe(parent_barycenter).velocity

            jupiter_data = next(p for p in initial_data if p['name'] == 'Jupiter')
            jupiter_x, jupiter_y, jupiter_z = jupiter_data['x'], jupiter_data['y'], jupiter_data['z']
            jupiter_vx, jupiter_vy, jupiter_vz = jupiter_data['vx'], jupiter_data['vy'], jupiter_data['vz']

            moon_rel_x, moon_rel_y, moon_rel_z = relative_position.position.au * 1.496e11
            moon_rel_vx, moon_rel_vy, moon_rel_vz = relative_velocity.km_per_s * 1000

            moon_x = jupiter_x + moon_rel_x
            moon_y = jupiter_y + moon_rel_y
            moon_z = jupiter_z + moon_rel_z
            moon_vx = jupiter_vx + moon_rel_vx
            moon_vy = jupiter_vy + moon_rel_vy
            moon_vz = jupiter_vz + moon_rel_vz

        elif parent_name == "Earth":
            continue

        else:
            parent_planet = next(p for p in initial_data if p['name'] == moon['parent'])
            angle = math.atan2(parent_planet['y'], parent_planet['x'])
            semi_major_axis = moon.get('semi_major_axis', moon.get('distance', 0))

            if semi_major_axis == 0:
                raise ValueError(f"Moon {moon_name} has no valid semi_major_axis or distance.")

            orbital_velocity = math.sqrt(G * parent_planet['mass'] / semi_major_axis)
            moon_vx = parent_planet['vx'] - orbital_velocity * math.sin(angle)
            moon_vy = parent_planet['vy'] + orbital_velocity * math.cos(angle)
            moon_vz = parent_planet['vz']

            moon_x = parent_planet['x'] + semi_major_axis * math.cos(angle)
            moon_y = parent_planet['y'] + semi_major_axis * math.sin(angle)
            moon_z = parent_planet['z']

        initial_data.append({
            "name": moon_name,
            "mass": moon['mass'],
            "radius": moon['radius'],
            "x": moon_x,
            "y": moon_y,
            "z": moon_z,
            "vx": moon_vx,
            "vy": moon_vy,
            "vz": moon_vz,
            "ax": 0,
            "ay": 0,
            "az": 0,
        })

    # --- Small Bodies (using cached initialization) ---
    halley = initialize_small_body("1P", "Halley")
    if halley:
        initial_data.append(halley)
    else:
        print("Warning: Halley's Comet data could not be initialized.")

    # --- Custom Planets ---
    custom_planets = load_custom_planets()
    initial_data.extend(custom_planets)

    # Cache the fetched data
    try:
        with open(cache_file, 'w') as f:
            json.dump(initial_data, f)
    except IOError as e:
        print(f"Warning: Could not write cache file: {e}")

    return initial_data

@socketio.on('adjust_speed')
def adjust_speed(data):
    global dt
    speed_factor = data.get('speed', 1)
    if speed_factor <= 0:
        speed_factor = 1

    # Define a slower logarithmic scale for time
    # The slowest should be about 1 day/second
    # The fastest should be about 0.5 years/second (182.625 days)
    time_scales = [
        (1, 1),              # 1 day/second (slowest)
        (7, 2),              # 1 week/second
        (30, 3),             # 1 month/second
        (90, 4),             # 3 months/second
        (182.625, 5),         # 0.5 years/second (fastest)
        (365.5, 6),         # 1 years/second (fastest)
        (731, 7),         # 1 years/second (fastest)
        (1462, 8)         # 1 years/second (fastest)
    ]

    # Find the appropriate time scale based on speed_factor
    for days_per_second, factor_limit in time_scales:
        if speed_factor <= factor_limit:
            break  # Found the right scale
    else:
        # If speed_factor is beyond our defined scales, use the largest one
        days_per_second = time_scales[-1][0]

    # Calculate dt in seconds based on the desired days/second.
    # This converts days to seconds (60*60*24 = 86400 seconds in a day)
    dt = days_per_second * ( 60 * 24)

    emit('time_interval_update', {'time_interval': f"{days_per_second:.2f} days/second"})


simulation_running = False
virtual_date = None  # Initialize virtual_date
dt = 1  # Initial dt value

# Initialize planets globally
planets = fetch_real_positions_for_today()

# Simulation state
simulation_running = False
virtual_date = None
dt = 1  # Initial time step

@socketio.on('start_simulation')
def start_simulation():
    global simulation_running, virtual_date, dt, planets, orbit_data # Add orbit_data to global if you need to access it elsewhere, OR manage it purely within the loop

    # Prevent multiple simulation loops from starting
    # A lock might be better for true concurrency safety, but this is a basic guard
    if simulation_running:
        print("Simulation loop already running.")
        # Optionally emit an error or just return
        # emit('error', {'message': 'Simulation is already running'})
        return

    print("Attempting to start simulation loop...") # Log start attempt

    # Initialize virtual_date if it's the first run or after reset
    if virtual_date is None:
        virtual_date = datetime.now()

    # --- Initialize orbit tracking data ---
    # This will hold the state for the duration of this specific loop instance
    local_orbit_data = {}
    for planet in planets: # Use the current state of global planets
        # Ensure planet has a 'name' key before adding
        if 'name' in planet:
            local_orbit_data[planet['name']] = {
                "orbit_count": 0,
                "last_angle": None,
                "orbit_times": []
            }
        else:
            print(f"Warning: Planet object missing 'name' key during orbit_data init: {planet}")


    # --- Set simulation_running flag AFTER setup ---
    simulation_running = True
    print("Simulation loop started.")

    # Expected periods (in Earth days) - can be defined outside if constant
    expected_orbital_periods = {
        p.capitalize(): orbital_params[p]["orbital_period"]
        for p in orbital_params if p in planets_skyfield # Check key exists
    }
    expected_orbital_periods.update({
        m: data['orbital_period']
        for m, data in moon_data.items() if 'orbital_period' in data
    })


    try:
        while simulation_running:
            # --- Thread Safety Consideration ---
            # Create a copy of the planets list for this iteration

            current_planets_iteration = list(planets) # Make a shallow copy

            # Ensure dt is valid
            safe_dt = max(dt, 0.01) # Use a small minimum dt if needed

            # Perform calculations on the copied list
            calculations.calculate_forces(current_planets_iteration)
            calculations.verlet_step(current_planets_iteration, safe_dt)


            # Create a dictionary from the updated iteration for quick lookup
            updated_planets_dict = {p['name']: p for p in current_planets_iteration if 'name' in p}

            # Update the global list - iterate through global and update from dict

            global_planet_names = {p.get('name') for p in planets}
            newly_added_this_cycle = []

            for i in range(len(planets)):
                p_name = planets[i].get('name')
                if p_name and p_name in updated_planets_dict:
                    planets[i] = updated_planets_dict[p_name] # Update existing

            # Add any genuinely new planets found during the calculation cycle

            for name, data in updated_planets_dict.items():
                if name not in global_planet_names:
                    planets.append(data)
                    newly_added_this_cycle.append(name) # Track names added here
                    print(f"Added {name} during simulation cycle update.")


            # Update virtual date
            virtual_date += timedelta(seconds=safe_dt)

            # --- Orbit Tracking ---
            # Iterate through the state of planets *after* the verlet step for this cycle
            for planet in current_planets_iteration: # Use the list from this iteration
                planet_name = planet.get('name')
                if not planet_name or planet_name == "Sun":
                    continue


                if planet_name not in local_orbit_data:
                    print(f"Dynamically initializing orbit tracking for: {planet_name}")
                    local_orbit_data[planet_name] = {
                        "orbit_count": 0,
                        "last_angle": None,
                        "orbit_times": []
                    }
                # Also initialize for planets added during the cycle update step
                elif planet_name in newly_added_this_cycle and planet_name not in local_orbit_data:
                    print(f"Dynamically initializing orbit tracking for cycle-added: {planet_name}")
                    local_orbit_data[planet_name] = { "orbit_count": 0, "last_angle": None, "orbit_times": [] }

                # Proceed with orbit calculation only if data exists
                if planet_name in local_orbit_data:
                    # Get current angle
                    current_angle = None
                    if planet_name in moon_data:
                        parent_name = moon_data[planet_name].get('parent')
                        if parent_name:
                            # Find parent in the *current iteration's* list
                            parent = next((p for p in current_planets_iteration if p.get('name') == parent_name), None)
                            if parent and 'x' in parent and 'y' in parent and 'x' in planet and 'y' in planet:
                                current_angle = math.atan2(planet['y'] - parent['y'], planet['x'] - parent['x'])
                            #else: print(f"Parent '{parent_name}' not found or missing coords for {planet_name}") # Debug
                    elif 'x' in planet and 'y' in planet: # Regular planet/comet
                        current_angle = math.atan2(planet['y'], planet['x'])

                    # If angle calculation failed, skip orbit check
                    if current_angle is None:
                        continue

                    orbit_info = local_orbit_data[planet_name] # Use local dict

                    if orbit_info['last_angle'] is None:
                        orbit_info['last_angle'] = current_angle
                    else:
                        # Detect orbit completion (angle cross from >0 to <0)
                        if orbit_info['last_angle'] > 0 and current_angle <= 0: # Use <= to catch crossing zero exactly
                            orbit_info['orbit_count'] += 1
                            orbit_info['orbit_times'].append(virtual_date)

                            # Calculate and print orbital period
                            # Calculate and print orbital period
                            if len(orbit_info['orbit_times']) > 1:
                                t1 = orbit_info['orbit_times'][-2]
                                t2 = orbit_info['orbit_times'][-1]
                                actual_period_days = (t2 - t1).total_seconds() / (60 * 60 * 24)
                                expected_period = expected_orbital_periods.get(planet_name) # Still get it if available

                                # --- MODIFIED PRINTING ---
                                print_str = f"{planet_name}: Orbit {orbit_info['orbit_count']} | Actual: {actual_period_days:.2f}d"
                                if expected_period is not None:
                                    # If expected period exists, add the comparison details
                                    print_str += f" | Expected: {expected_period:.2f}d | Diff: {abs(actual_period_days - expected_period):.2f}d"
                                else:
                                    # Otherwise, indicate no expected value was found
                                    print_str += " | Expected: N/A"
                                print(print_str)
                                # --- END MODIFICATION ---


                        # Update last angle for next iteration
                        orbit_info['last_angle'] = current_angle

            # Filter out the Sun before sending
            planet_data_for_frontend = [
                p for p in planets if p.get('name') != "Sun"
            ]
            socketio.emit('planet_data', {
                'planets': planet_data_for_frontend,
                'date': virtual_date.isoformat() if virtual_date else datetime.now().isoformat()
            })

            # Control loop speed
            socketio.sleep(1/60) # Target ~60 updates per second

    except Exception as e:
        # Log the full traceback for better debugging
        import traceback
        print(f"Error in simulation loop: {e}")
        traceback.print_exc()
    finally:
        # Ensure the flag is reset when the loop exits (normally or via exception)
        simulation_running = False
        print("Simulation loop stopped.")


@socketio.on('stop_simulation')
def stop_simulation():
    global simulation_running
    simulation_running = False

planets = fetch_real_positions_for_today()
initial_planets = planets.copy()

# Initialize the simulation state
simulation_state = {
    "planets": fetch_real_positions_for_today(),
    "virtual_date": datetime.now()
}

@app.route('/reset')
def reset_simulation():
    global simulation_state, virtual_date, planets
    planets = fetch_real_positions_for_today()
    simulation_state['planets'] = [copy.deepcopy(planet) for planet in planets]
    simulation_state['virtual_date'] = datetime.now()
    virtual_date = datetime.now()
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
                "date": datetime.now().isoformat()  # Include date
            })
    return jsonify({"planets": step_data})

@app.route('/api/orbit-paths')
def get_orbit_paths():
    """Calculates and caches orbit paths."""
    orbit_paths_cache_file = 'orbit_paths_cache.json'

    if os.path.exists(orbit_paths_cache_file):
        try:
            with open(orbit_paths_cache_file, 'r') as f:
                cached_paths = json.load(f)
                print("loaded orbit paths from cache")
                return jsonify(cached_paths)

        except (json.JSONDecodeError, FileNotFoundError):
            print("invalid orbit paths cache file")

    orbit_paths = {}
    ts = load.timescale()
    now = ts.now()

    # Calculate orbit paths for planets
    for planet_name, params in orbital_params.items():
        planet = planets_skyfield[planet_name.lower()]
        period_days = params['orbital_period']
        num_points = int(period_days)
        points = []

        for i in range(num_points):
            t = now + (i / num_points) * period_days
            position = planet.at(t).observe(sun).position.au
            x, y = position[0], position[1]
            points.append([x, y])
        orbit_paths[planet_name] = points

    # Calculate orbit path for Halley (using cached data if available)
    halley = initialize_small_body("1P", "Halley")
    if halley:
        halley_period = 76 * 365.25
        num_points = int(halley_period / 10)
        halley_points = []

        for i in range(num_points):
            t = now + (i / num_points) * halley_period
            time_since_perihelion = (t - ts.utc(1986, 2, 9)).days
            mean_anomaly = 2 * math.pi * (time_since_perihelion % halley_period) / halley_period
            r = 17.8 * 1.496e11
            x = r * math.cos(mean_anomaly) / 1.496e11
            y = r * math.sin(mean_anomaly) / 1.496e11
            halley_points.append([x, y])
        orbit_paths['halley'] = halley_points

    #store orbit paths in cache
    try:
        with open(orbit_paths_cache_file, 'w') as f:
            json.dump(orbit_paths, f)
            print("Stored orbit paths in cache")
    except IOError as e:
        print(f"Warning: Could not write orbit paths cache file: {e}")


    return jsonify(orbit_paths)



@app.route('/create_planet', methods=['POST'])
def create_planet():
    global planets, simulation_running, virtual_date

    # Stop the simulation
    simulation_running = False

    # Parse the new planet data from the request
    data = request.json
    new_planet = {
        "name": data['name'],
        "mass": data['mass'],
        "radius": data['size'],
        "x": data['distanceFromSun'] * 1.496e11,  # Convert AU to meters
        "y": 0,
        "z": 0,
        "vx": 0,
        "vy": math.sqrt(G * M_sun / (data['distanceFromSun'] * 1.496e11)),  # Orbital velocity
        "vz": 0,
        "ax": 0,
        "ay": 0,
        "az": 0,
        "color": data['planetColor'],
        "trailColor": data['trailColor']
    }

    # Load existing custom planets and add the new one
    custom_planets = load_custom_planets()
    custom_planets.append(new_planet)
    save_custom_planets(custom_planets)

    # Reset the simulation state to the initial state
    planets = fetch_real_positions_for_today()  # Reinitialize planets to their initial positions
    virtual_date = datetime.now()  # Reset the virtual date to the current time

    # Add the new planet to the planets list
    planets.append(new_planet)

    # Restart the simulation
    simulation_running = True
    start_simulation()  # Call the simulation start function

    return jsonify({"message": "Planet created", "planet": new_planet})




@socketio.on('create_planet')
def handle_create_planet(data):
    global planets # Ensure planets is accessible

    print(f"Received create_planet event for: {data.get('name')}") # Add logging

    try:
        # Create the new planet data structure
        new_planet = {
            "name": data['name'],
            "mass": float(data['mass']), # Ensure correct types
            "radius": float(data['radius']), # Ensure correct types (use radius passed from frontend)
            "x": float(data['x']), # Use x passed from frontend
            "y": float(data['y']), # Use y passed from frontend
            "z": float(data['z']), # Use z passed from frontend
            # Calculate initial velocity based on distance (assuming circular orbit initially)
            "vx": 0,
            "vy": math.sqrt(G * M_sun / math.sqrt(data['x']**2 + data['y']**2 + data['z']**2)) if (data['x']**2 + data['y']**2 + data['z']**2) > 0 else 0,
            "vz": 0,
            "ax": 0, # Initialize acceleration
            "ay": 0,
            "az": 0,
            "planetColor": data.get('planetColor', '#CCCCCC'), # Use provided color or default
            "trailColor": data.get('trailColor', '#888888') # Use provided trail color or default
        }

        # Add the new planet to the *global* planets list
        # This needs to be thread-safe if using multiple workers, but often okay with gevent/eventlet
        planets.append(new_planet)
        print(f"Added {new_planet['name']} to planets list. Total bodies: {len(planets)}")

        # --- NO NEED TO RESTART SIMULATION ---
        # simulation_running = True # REMOVE THIS
        # start_simulation() # REMOVE THIS

        # Save to custom planets file (Optional but good practice)
        custom_planets = load_custom_planets()
        # Avoid duplicates in save file if necessary
        if not any(p['name'] == new_planet['name'] for p in custom_planets):
            custom_planets.append(new_planet)
            save_custom_planets(custom_planets)


        # Emit confirmation (optional, but can be useful)
        # The main 'planet_data' emit in the simulation loop will show the new planet
        emit('planet_created_ack', {'name': new_planet['name'], 'status': 'added'}, broadcast=False) # Acknowledge to sender
        # Optional: emit the new planet immediately to all clients if needed,
        # but relying on the main loop's 'planet_data' is usually sufficient.
        # emit('new_planet_added', new_planet, broadcast=True)

    except Exception as e:
        print(f"Error processing create_planet event: {e}")
        # Optionally emit an error back to the client
        emit('planet_creation_error', {'message': str(e)}, broadcast=False)


if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)