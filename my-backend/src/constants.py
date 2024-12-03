# Gravitational constant and related constants
G = 6.67430e-11  # Gravitational constant (m^3 kg^-1 s^-2)
M_sun = 1.989e30  # Mass of the Sun (kg)
dt = 60  # Default time step (60 seconds)

# Predefined masses of planets in kilograms
planetary_masses = {
    "mercury": 3.3011e23,
    "venus": 4.8675e24,
    "earth": 5.97237e24,
    "mars": 6.4171e23,
    "jupiter": 1.8982e27,
    "saturn": 5.6834e26,
    "uranus": 8.6810e25,
    "neptune": 1.02413e26,
}

# Predefined orbital parameters for Mercury and Venus
orbital_params = {
    "mercury": {
        "semi_major_axis": 0.387,  # AU
        "eccentricity": 0.2056,
        "orbital_period": 88,  # days
    },
    "venus": {
        "semi_major_axis": 0.723,  # AU
        "eccentricity": 0.0067,
        "orbital_period": 225,  # days
    },
}
