import React from 'react';
import '../styles/PlanetModal.css';


// Color name mapping
const COLOR_NAMES = {
    '#ffffff': 'White',
    '#ff0000': 'Red',
    '#00ff00': 'Green',
    '#0000ff': 'Blue',
    '#ffff00': 'Yellow',
    '#ff00ff': 'Magenta',
    '#00ffff': 'Cyan',
    '#ffa500': 'Orange',
    '#a52a2a': 'Brown',
    '#808080': 'Gray',
    // Add more color mappings as needed
};

// Function to find the closest named color
const getColorName = (hexColor) => {
    if (!hexColor) return 'Custom';

    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Find the closest named color
    let closestColor = 'Custom';
    let minDistance = Infinity;

    Object.entries(COLOR_NAMES).forEach(([hex, name]) => {
        const hexVal = hex.replace('#', '');
        const cr = parseInt(hexVal.substring(0, 2), 16);
        const cg = parseInt(hexVal.substring(2, 4), 16);
        const cb = parseInt(hexVal.substring(4, 6), 16);

        const distance = Math.sqrt(
            Math.pow(r - cr, 2) +
            Math.pow(g - cg, 2) +
            Math.pow(b - cb, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestColor = name;
        }
    });

    return closestColor;
};


// Expanded Planet data
const PLANET_DATA = {
    Sun: {
        type: "Star",
        description: "The G-type main-sequence star at the center of our Solar System.",
        gravity: "274 m/s²",
        diameter: "1,392,700 km",
        temp: "5,500°C (surface)",
        composition: "Hydrogen (~73%), Helium (~25%)",
        moons: "N/A" // Stars don't have moons in the planetary sense
    },
    Mercury: {
        type: "Planet",
        description: "The smallest and innermost planet, known for its extreme temperature swings.",
        gravity: "3.7 m/s²",
        diameter: "4,880 km",
        temp: "-173°C to 427°C",
        moons: 0,
        composition: "Rocky (silicates), large metallic core"
    },
    Venus: {
        type: "Planet",
        description: "Earth's 'sister planet', shrouded in a thick, toxic atmosphere causing a runaway greenhouse effect.",
        gravity: "8.87 m/s²",
        diameter: "12,104 km",
        temp: "462°C (average)",
        moons: 0,
        composition: "Rocky (silicates), dense CO₂ atmosphere"
    },
    Earth: {
        type: "Planet",
        description: "Our home world, the only known planet with abundant liquid water and life.",
        gravity: "9.81 m/s²",
        diameter: "12,742 km",
        temp: "-89°C to 57°C",
        moons: 1,
        composition: "Rocky (silicates), Nitrogen-Oxygen atmosphere, liquid water oceans"
    },
    Mars: {
        type: "Planet",
        description: "The 'Red Planet', featuring polar ice caps, the largest volcano (Olympus Mons), and vast canyons.",
        gravity: "3.71 m/s²",
        diameter: "6,779 km",
        temp: "-153°C to 20°C",
        moons: 2, // Phobos, Deimos
        composition: "Rocky (iron oxide surface), thin CO₂ atmosphere"
    },
    Jupiter: {
        type: "Planet",
        description: "The largest planet, a gas giant known for its Great Red Spot, powerful magnetic field, and numerous moons.",
        gravity: "24.79 m/s²",
        diameter: "139,820 km",
        temp: "-108°C (cloud tops)",
        moons: "95 (official as of 2023)", // Including Galilean moons
        composition: "Gas (Hydrogen, Helium)"
    },
    Saturn: {
        type: "Planet",
        description: "The gas giant famous for its spectacular and complex ring system.",
        gravity: "10.44 m/s²",
        diameter: "116,460 km",
        temp: "-139°C (cloud tops)",
        moons: "146 (official as of 2023)",
        composition: "Gas (Hydrogen, Helium), Water ice rings"
    },
    Uranus: {
        type: "Planet",
        description: "An ice giant tilted on its side, giving it extreme seasons.",
        gravity: "8.69 m/s²",
        diameter: "50,724 km",
        temp: "-197°C (cloud tops)",
        moons: 27,
        composition: "Ice (Water, Ammonia, Methane), Hydrogen, Helium"
    },
    Neptune: {
        type: "Planet",
        description: "The farthest ice giant, known for its deep blue color and supersonic winds.",
        gravity: "11.15 m/s²",
        diameter: "49,244 km",
        temp: "-201°C (cloud tops)",
        moons: 14,
        composition: "Ice (Water, Ammonia, Methane), Hydrogen, Helium"
    },
    Pluto: {
        type: "Dwarf Planet",
        description: "A dwarf planet in the Kuiper Belt, with a surprisingly complex surface including mountains and plains.",
        gravity: "0.62 m/s²",
        diameter: "2,377 km",
        temp: "-233°C to -223°C",
        moons: 5, // Charon, Styx, Nix, Kerberos, Hydra
        composition: "Ice (Nitrogen, Methane, Carbon Monoxide), Rock"
    },
    Moon: { // Earth's Moon
        type: "Moon",
        description: "Earth's only natural satellite, heavily cratered and tidally locked.",
        gravity: "1.62 m/s²",
        diameter: "3,474 km",
        temp: "-173°C to 127°C",
        composition: "Rock (Silicates)",
        orbits: "Earth",
        moons: "N/A"
    },
    Io: {
        type: "Moon",
        description: "The most volcanically active body in the Solar System, orbiting Jupiter.",
        gravity: "1.79 m/s²",
        diameter: "3,643 km",
        temp: "-143°C (average surface)",
        composition: "Rock (Silicates), Sulfur compounds",
        orbits: "Jupiter",
        moons: "N/A"
    },
    Europa: {
        type: "Moon",
        description: "A moon of Jupiter suspected to have a vast saltwater ocean beneath its icy crust.",
        gravity: "1.31 m/s²",
        diameter: "3,122 km",
        temp: "-160°C (surface)",
        composition: "Water Ice crust, Rock mantle, potential liquid Ocean",
        orbits: "Jupiter",
        moons: "N/A"
    },
    Ganymede: {
        type: "Moon",
        description: "The largest moon in the Solar System (larger than Mercury), orbiting Jupiter and having its own magnetic field.",
        gravity: "1.43 m/s²",
        diameter: "5,268 km",
        temp: "-163°C (surface)",
        composition: "Water Ice crust, Rock mantle, potential liquid Ocean",
        orbits: "Jupiter",
        moons: "N/A"
    },
    Callisto: {
        type: "Moon",
        description: "A heavily cratered moon of Jupiter, thought to be relatively geologically inactive.",
        gravity: "1.24 m/s²",
        diameter: "4,821 km",
        temp: "-140°C (surface)",
        composition: "Water Ice, Rock",
        orbits: "Jupiter",
        moons: "N/A"
    },
    Halley: { // Halley's Comet
        type: "Comet",
        description: "A famous short-period comet visible from Earth every 75–79 years.",
        diameter: "11 km (nucleus average)",
        composition: "Ice (Water, CO, CO₂), Dust, Rock",
        orbitalPeriod: "Approx. 76 years",
        gravity: "N/A", // Negligible for modal display
        temp: "Highly Variable",
        moons: "N/A"
    }
    // Placeholder for created planets will be handled by the default object below
};

// Default object for unknown bodies (including created planets)
const DEFAULT_DETAILS = {
    type: "Planet",
    description: "This is your custom planet!",
    gravity: "Unknown",
    diameter: "Unknown",
    temp: "Unknown",
    moons: "Unknown",
    composition: "Unknown",
    orbits: "Unknown",
    orbitalPeriod: "Unknown"
};

const PlanetModal = ({ planet, onClose }) => {
    if (!planet) return null;

    // Get details, fall back to default if not in PLANET_DATA
    const details = PLANET_DATA[planet.name] || {
        ...DEFAULT_DETAILS,
        description: planet.description || "This is your custom planet!",
    };

    // Calculate derived values for custom planets
    const radius = planet.size ? (planet.size * 6371).toFixed(0) : null;
    const diameter = radius ? (radius * 2).toFixed(0) : null;
    const mass = planet.mass ? (planet.mass * 5.972e24).toExponential(2) : null;
    const planetColorName = planet.planetColor ? getColorName(planet.planetColor) : null;

    // Helper to check if a value is meaningful to display
    const hasValue = (value) => value !== undefined && value !== null && value !== "N/A" && value !== "Unknown";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{planet.name}</h2>
                {hasValue(details.type) && <p className="body-type">({details.type})</p>}

                <div className="modal-body">
                    {hasValue(details.description) && <p className="description">{details.description}</p>}

                    <div className="planet-stats">
                        {/* Standard planet stats */}
                        {hasValue(details.gravity) && (
                            <div className="stat-item">
                                <span className="stat-label">Gravity:</span>
                                <span className="stat-value">{details.gravity}</span>
                            </div>
                        )}

                        {/* For custom planets, show both radius and diameter */}
                        {radius ? (
                            <>
                                <div className="stat-item">
                                    <span className="stat-label">Radius:</span>
                                    <span className="stat-value">{radius} km</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Diameter:</span>
                                    <span className="stat-value">{diameter} km</span>
                                </div>
                            </>
                        ) : hasValue(details.diameter) && (
                            <div className="stat-item">
                                <span className="stat-label">Diameter:</span>
                                <span className="stat-value">{details.diameter}</span>
                            </div>
                        )}

                        {hasValue(details.temp) && (
                            <div className="stat-item">
                                <span className="stat-label">Temperature:</span>
                                <span className="stat-value">{details.temp}</span>
                            </div>
                        )}

                        {hasValue(details.composition) && (
                            <div className="stat-item">
                                <span className="stat-label">Composition:</span>
                                <span className="stat-value">{details.composition}</span>
                            </div>
                        )}

                        {hasValue(details.moons) && (
                            <div className="stat-item">
                                <span className="stat-label">Known Moons:</span>
                                <span className="stat-value">{details.moons}</span>
                            </div>
                        )}

                        {hasValue(details.orbits) && (
                            <div className="stat-item">
                                <span className="stat-label">Orbits:</span>
                                <span className="stat-value">{details.orbits}</span>
                            </div>
                        )}

                        {hasValue(details.orbitalPeriod) && (
                            <div className="stat-item">
                                <span className="stat-label">Orbital Period:</span>
                                <span className="stat-value">{details.orbitalPeriod}</span>
                            </div>
                        )}

                        {/* Custom planet properties - only show mass, radius, and planet color */}
                        {mass && (
                            <div className="stat-item">
                                <span className="stat-label">Mass:</span>
                                <span className="stat-value">{mass} kg</span>
                            </div>
                        )}

                        {planet.size && (
                            <div className="stat-item">
                                <span className="stat-label">Size (Earth radii):</span>
                                <span className="stat-value">{planet.size.toFixed(2)}</span>
                            </div>
                        )}

                        {planet.planetColor && (
                            <div className="stat-item">
                                <span className="stat-label">Planet Color:</span>
                                <span className="stat-value">
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '15px',
                                            height: '15px',
                                            backgroundColor: planet.planetColor,
                                            marginRight: '8px',
                                            verticalAlign: 'middle',
                                            borderRadius: '50%',
                                            border: '1px solid #555'
                                        }}
                                    />
                                    {planetColorName} ({planet.planetColor})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="action-button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanetModal;