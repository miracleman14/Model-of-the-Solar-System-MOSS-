// Define planet sizes (relative scaling factors)
export const PLANET_SIZES = {
    "Mercury": 0.383,   // Mercury's radius is ~38.3% of Earth's
    "Venus": 0.949,     // Venus's radius is ~94.9% of Earth's
    "Earth": 1.0,       // Earth is the baseline (1.0)
    "Mars": 0.532,      // Mars's radius is ~53.2% of Earth's
    "Jupiter": 11.21,   // Jupiter's radius is ~11.21 times Earth's
    "Saturn": 9.45,     // Saturn's radius is ~9.45 times Earth's
    "Uranus": 4.01,     // Uranus's radius is ~4.01 times Earth's
    "Neptune": 3.88,    // Neptune's radius is ~3.88 times Earth's
    "Pluto": 0.186,     // Pluto's radius is ~18.6% of Earth's
    "Sun": 109.0,       // Sun's radius is ~109 times Earth's
    "Halley": 0.0008,   // Halley's radius is ~0.08% of Earth's (5.5km)
};

// Define planet colors (hexadecimal color codes)
export const PLANET_COLORS = {
    "Mercury": 0x888888,
    "Venus": 0xffd700,
    "Earth": 0x0000ff,
    "Mars": 0xff4500,
    "Jupiter": 0xd2691e,
    "Saturn": 0xd2b48c,
    "Uranus": 0x40e0d0,
    "Neptune": 0x00008b, // Neptune color
    "Pluto": 0xa9a9a9, // Pluto color (greyish)
    "Sun": 0xffff00, // Sun's colour
    "Halley": 0xf0f0f0, // Halley's Comet color (whitish with blue tint)
};

// Define moon sizes (relative scaling factors)
export const MOON_SIZES = {
    "Moon": 0.27,       // Moon's radius is ~27% of Earth's
    "Io": 0.28,         // Io's radius is ~28% of Earth's
    "Europa": 0.25,     // Europa's radius is ~25% of Earth's
    "Ganymede": 0.41,   // Ganymede's radius is ~41% of Earth's
    "Callisto": 0.37,   // Callisto's radius is ~37% of Earth's
};

// Define moon colors (hexadecimal color codes)
export const MOON_COLORS = {
    "Moon": 0xaaaaaa,   // Moon's color
    "Io": 0xffcc99,     // Io's color
    "Europa": 0x99ccff, // Europa's color
    "Ganymede": 0xcc9966, // Ganymede's color
    "Callisto": 0x666699, // Callisto's color
};

export const moon_data = { // Make this lowercase to be consistent with JS conventions
    "Moon": {
        "parent": "Earth",
        "mass": 7.342e22,
        "radius": 1.737e6,
        "semi_major_axis": 3.844e8,
        "eccentricity": 0.0549,
        "inclination": 0.0898,
        "mean_anomaly": 0,
        "orbital_period": 27.321661 * 24 * 3600,
    },
    "Io": {
        "parent": "Jupiter",
        "mass": 8.9319e22,
        "radius": 1.8216e6,
        "semi_major_axis": 4.217e8,
        "eccentricity": 0.0041,
        "inclination": 0.036,
        "mean_anomaly": 0,
        "orbital_period": 1.769 * 24 * 3600,
    },
    "Europa": {
        "parent": "Jupiter",
        "mass": 4.7998e22,
        "radius": 1.5608e6,
        "semi_major_axis": 6.709e8,
        "eccentricity": 0.009,
        "inclination": 0.047,
        "mean_anomaly": 0,
        "orbital_period": 3.551 * 24 * 3600,
    },
    "Ganymede": {
        "parent": "Jupiter",
        "mass": 1.4819e23,
        "radius": 2.6312e6,
        "semi_major_axis": 1.0704e9,
        "eccentricity": 0.0013,
        "inclination": 0.020,
        "mean_anomaly": 0,
        "orbital_period": 7.155 * 24 * 3600,
    },
    "Callisto": {
        "parent": "Jupiter",
        "mass": 1.0759e23,
        "radius": 2.4103e6,
        "semi_major_axis": 1.8827e9,
        "eccentricity": 0.0074,
        "inclination": 0.192,
        "mean_anomaly": 0,
        "orbital_period": 16.689 * 24 * 3600,
    },
};

// Define comet data
export const comet_data = {
    "Halley": {
        "parent": "Sun",
        "mass": 2.2e14,
        "radius": 5.5e3, // meters
        "semi_major_axis": 17.8341 * 1.496e11, // 17.8 AU in meters
        "eccentricity": 0.967,
        "inclination": 162.3 * (Math.PI / 180), // Converting degrees to radians
        "mean_anomaly": 0,
        "orbital_period": 75.32 * 365.25 * 24 * 3600, // 75.32 years in seconds
    }
};

// Define starfield configuration
export const STARFIELD_CONFIG = {
    starCount: 5000, // Number of stars
    maxStarSize: 0.3, // Maximum size of a star
    minStarSize: 0.1, // Minimum size of a star
    positionScale: 20000, // Scale for star positions
};

// Define orbit configuration
export const ORBIT_CONFIG = {
    trailLengthFactor: 10, // Multiplier for dynamic orbit trail length
    opacity: 0.5, // Opacity of orbit lines
    color: 0xffffff, // Default orbit line color
    cometTrailColor: 0x88aaff, // Blue-white color for comet trails
    cometTrailLength: 50, // Longer trail for comets
};

export const SIMULATION_URLS = {
    reset: 'http://localhost:5000/reset',
    getSimulationState: 'http://localhost:5000/api/get-simulation-state',
};

export const CAMERA_CONFIG = {
    initialPositionZ: 1000,
    minDistance: 100,
    maxDistance: 50000,
};