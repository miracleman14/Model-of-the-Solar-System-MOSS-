from skyfield.api import load
import datetime

# Load planetary ephemeris
ephemeris = load('de421.bsp')

def get_real_position(planet_name, current_date):
    planet_name = planet_name.lower()
    planet_targets = {
        "mercury": 199,
        "venus": 299,
        "earth": 399,
        "mars": 499,
        "jupiter": 5,
        "saturn": 6,
        "uranus": 7,
        "neptune": 8,
        "pluto": 9,
        "sun": 10
    }

    if planet_name in planet_targets:
        # Convert current_date (datetime object) to Skyfield Time object
        ts = load.timescale()
        t = ts.utc(current_date.year, current_date.month, current_date.day, current_date.hour, current_date.minute, current_date.second)

        planet = ephemeris[planet_targets[planet_name]]  # Use the correct target
        astrometric = planet.at(t)  # Pass the Time object to at()
        position = astrometric.position.km  # Get the position in km

        # Convert numpy ndarray to a list for JSON serialization
        return position.tolist()  # This converts the ndarray to a list

    else:
        raise ValueError(f"Unsupported or invalid planet: {planet_name}")



def get_all_planet_positions(current_date):
    """
    Get the positions of all the planets from the ephemeris.
    :param current_date: Current datetime object.
    :return: Dictionary with planet names as keys and position vectors as values.
    """
    planets = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"]
    positions = {}

    for planet in planets:
        positions[planet] = get_real_position(planet, current_date)

    return positions
