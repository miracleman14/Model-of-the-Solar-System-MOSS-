# constants.py (CORRECTED orbital periods for moons)
# Gravitational constant and related constants
G = 6.67430e-11
M_sun = 1.989e30
dt = 60

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
    "halley": 2.2e14,  # kg (estimated)
}

orbital_params = {
    "mercury": {
        "semi_major_axis": 0.387,
        "eccentricity": 0.2056,
        "orbital_period": 88,  # Earth days
    },
    "venus": {
        "semi_major_axis": 0.723,
        "eccentricity": 0.0067,
        "orbital_period": 225,  # Earth days
    },
    "earth": {
        "semi_major_axis": 1.00000011,
        "eccentricity": 0.017,
        "orbital_period": 365.25,  # Earth days
    },
    "mars": {
        "semi_major_axis": 1.524,
        "eccentricity": 0.094,
        "orbital_period": 687.0,  # Earth days
    },
    "jupiter": {
        "semi_major_axis": 5.204,
        "eccentricity": 0.049,
        "orbital_period": 4333,  # Earth days (approximate)
    },
    "saturn": {
        "semi_major_axis": 9.573,
        "eccentricity": 0.052,
        "orbital_period": 10759,  # Earth days (approximate)
    },
    "uranus": {
        "semi_major_axis": 19.165,
        "eccentricity": 0.047,
        "orbital_period": 30687,  # Earth days (approximate)
    },
    "neptune": {
        "semi_major_axis": 30.178,
        "eccentricity": 0.010,
        "orbital_period": 60190,  # Earth days (approximate)
    },
    "pluto": {
        "semi_major_axis": 39.482,
        "eccentricity": 0.2488,
        "orbital_period": 90560,  # Earth days (approximate)
    },
    "halley": {
        "semi_major_axis": 17.8341,  # AU
        "eccentricity": 0.967,
        "inclination": 162.3,  # degrees
        "orbital_period": 75.32 * 365.25,  # Earth days
    },
}

moon_data = {
    "Moon": {
        "parent": "Earth",
        "mass": 7.342e22,
        "radius": 1.737e6,
        "semi_major_axis": 3.844e8,
        "eccentricity": 0.0549,
        "inclination": 0.0898,
        "mean_anomaly": 0,
        "orbital_period": 27.321,  # Corrected: Earth days
    },
    "Io": {
        "parent": "Jupiter",
        "mass": 8.9319e22,
        "radius": 1.8216e6,
        "semi_major_axis": 4.217e8,
        "eccentricity": 0.0041,
        "inclination": 0.036,
        "mean_anomaly": 0,
        "orbital_period": 1.769,  # Corrected: Earth days
    },
    "Europa": {
        "parent": "Jupiter",
        "mass": 4.7998e22,
        "radius": 1.5608e6,
        "semi_major_axis": 6.709e8,
        "eccentricity": 0.009,
        "inclination": 0.047,
        "mean_anomaly": 0,
        "orbital_period": 3.551,  # Corrected: Earth days
    },
    "Ganymede": {
        "parent": "Jupiter",
        "mass": 1.4819e23,
        "radius": 2.6312e6,
        "semi_major_axis": 1.0704e9,
        "eccentricity": 0.0013,
        "inclination": 0.020,
        "mean_anomaly": 0,
        "orbital_period": 7.155,  # Corrected: Earth days
    },
    "Callisto": {
        "parent": "Jupiter",
        "mass": 1.0759e23,
        "radius": 2.4103e6,
        "semi_major_axis": 1.8827e9,
        "eccentricity": 0.0074,
        "inclination": 0.192,
        "mean_anomaly": 0,
        "orbital_period": 16.689,  # Corrected: Earth days
    },
}

# --- Halley's Comet Data (from JPL Small-Body Database) ---
halleys_comet_data = {
    "name": "1P/Halley",  # Official designation
    "mass": 2.2e14,  # kg (estimated) - This is a rough estimate
    "radius": 5.5e3,  # Effective radius (meters) - Treat as a sphere for simplicity
    "orbital_period": 75.32 * 365.25,  # Orbital period (days)
    "jpl_id": "1000012",  # JPL Small Body Database ID
    "parent": "Sun",
    "semi_major_axis": 17.8341 * 1.496e11,  # 17.8341 AU in meters
    "eccentricity": 0.967,
    "inclination": 162.3,  # degrees
    "mean_anomaly": 0,
}