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
    "pluto": 1.303e22,
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
    "earth": {
        "semi_major_axis": 1.00000011  ,  # AU
        "eccentricity": 0.017,
        "orbital_period": 365.2,  # days
    },
    "mars": {
        "semi_major_axis": 1.524,  # AU
        "eccentricity": 0.094,
        "orbital_period": 687.0,  # days
    },
    "jupiter": {
        "semi_major_axis": 5.204,  # AU
        "eccentricity": 0.049,
        "orbital_period": 4331,  # days
    },
    "saturn": {
        "semi_major_axis": 9.573,  # AU
        "eccentricity": 0.052,
        "orbital_period": 10747,  # days
    },
    "uranus": {
        "semi_major_axis": 19.165,  # AU
        "eccentricity": 0.047,
        "orbital_period": 30589, # days
    },
    "neptune": {
        "semi_major_axis": 30.178,  # AU
        "eccentricity": 0.010,
        "orbital_period": 59800,  # days
    },
    "pluto": {
        "semi_major_axis": 39.482,  # AU
        "eccentricity": 0.2488,
        "orbital_period": 90560,  # days
    },
}
