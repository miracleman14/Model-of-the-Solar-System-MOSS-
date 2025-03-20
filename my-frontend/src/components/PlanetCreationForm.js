import React, { useState } from 'react';
import PlanetPreview from './PlanetPreview';

const PlanetCreationForm = ({ onCreatePlanet }) => {
    const [name, setName] = useState('');
    const [size, setSize] = useState(1);
    const [mass, setMass] = useState(1);
    const [distanceFromSun, setDistanceFromSun] = useState(1);
    const [planetColor, setPlanetColor] = useState('#ffffff');
    const [trailColor, setTrailColor] = useState('#ffffff');

    // Predefined options for distance from the sun
    const distanceOptions = [
        { label: 'Close (Near Venus)', value: 0.7 }, // ~0.7 AU
        { label: 'Medium (Near Jupiter)', value: 5 }, // ~5 AU
        { label: 'Far (Beyond Neptune)', value: 30 }, // ~30 AU
    ];

    // Predefined options for size and mass
    const sizeOptions = [
        { label: 'Small (Moon-sized)', value: 0.1 },
        { label: 'Medium (Earth-sized)', value: 1 },
        { label: 'Large (Jupiter-sized)', value: 10 },
    ];

    const massOptions = [
        { label: 'Light (Moon-mass)', value: 0.01 },
        { label: 'Medium (Earth-mass)', value: 1 },
        { label: 'Heavy (Jupiter-mass)', value: 318 },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!name || !size || !mass || !distanceFromSun || !planetColor || !trailColor) {
            alert("Please fill out all fields.");
            return;
        }

        const newPlanet = {
            name,
            size: parseFloat(size),
            mass: parseFloat(mass),
            distanceFromSun: parseFloat(distanceFromSun),
            planetColor,
            trailColor,
        };

        onCreatePlanet(newPlanet);
        // Reset the form after submission
        setName('');
        setSize(1);
        setMass(1);
        setDistanceFromSun(1);
        setPlanetColor('#ffffff');
        setTrailColor('#ffffff');
    };

    return (
        <div className="planet-creation-form-container">
            <form onSubmit={handleSubmit} className="planet-creation-form">
                <label>
                    Planet Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter planet name"
                    />
                </label>

                <label>
                    Size:
                    <select
                        value={size}
                        onChange={(e) => setSize(parseFloat(e.target.value))}
                        required
                    >
                        {sizeOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label} ({option.value} Earth radii)
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Mass:
                    <select
                        value={mass}
                        onChange={(e) => setMass(parseFloat(e.target.value))}
                        required
                    >
                        {massOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label} ({option.value} Earth masses)
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Distance from Sun:
                    <select
                        value={distanceFromSun}
                        onChange={(e) => setDistanceFromSun(parseFloat(e.target.value))}
                        required
                    >
                        {distanceOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label} ({option.value} AU)
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Planet Color:
                    <input
                        type="color"
                        value={planetColor}
                        onChange={(e) => setPlanetColor(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Trail Color:
                    <input
                        type="color"
                        value={trailColor}
                        onChange={(e) => setTrailColor(e.target.value)}
                        required
                    />
                </label>

                <button type="submit" className="submit-button">
                    Create Planet
                </button>
            </form>

            <div className="planet-preview-container">
                <PlanetPreview size={size} color={planetColor} />
                <div className="preview-details">
                    <p><strong>Size:</strong> {size} Earth radii</p>
                    <p><strong>Mass:</strong> {mass} Earth masses</p>
                    <p><strong>Distance from Sun:</strong> {distanceFromSun} AU</p>
                </div>
            </div>
        </div>
    );
};

export default PlanetCreationForm;