from datetime import datetime

# Current time (used as the starting point for the simulation)
START_DATE = datetime.now()  # Current datetime

# Gravitational constant (m^3 kg^-1 s^-2)
G = 6.67430e-11

# Celestial body data: mass, semi-major axis, eccentricity, orbital period (in seconds)
CELESTIAL_BODIES = {
    "sun": {
        "mass": 1.989e30,  # in kg
        "radius": 6.9634e8,  # in meters
        "temperature": 5778,  # in Kelvin
    },
    "mercury": {
        "mass": 3.3011e23,  # in kg
        "a": 5.79e10,  # semi-major axis in meters
        "e": 0.2056,  # eccentricity
        "T": 88 * 86400,  # orbital period in seconds (88 Earth days)
        "radius": 2.4397e6,  # in meters
    },
    "venus": {
        "mass": 4.8675e24,  # in kg
        "a": 1.082e11,  # semi-major axis in meters
        "e": 0.0067,  # eccentricity
        "T": 225 * 86400,  # orbital period in seconds (225 Earth days)
        "radius": 6.0518e6,  # in meters
    },
    "earth": {
        "mass": 5.972e24,  # in kg
        "a": 1.496e11,  # semi-major axis in meters
        "e": 0.0167,  # eccentricity
        "T": 365.25 * 86400,  # orbital period in seconds (365.25 Earth days)
        "radius": 6.371e6,  # in meters
    },
    "mars": {
        "mass": 6.4171e23,  # in kg
        "a": 2.279e11,  # semi-major axis in meters
        "e": 0.0934,  # eccentricity
        "T": 687 * 86400,  # orbital period in seconds (687 Earth days)
        "radius": 3.3962e6,  # in meters
    },
    # Add other planets similarly (Jupiter, Saturn, etc.)
}
