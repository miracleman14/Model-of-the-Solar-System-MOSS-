import React, { useState } from 'react';

const PlanetCreationForm = ({ onCreatePlanet }) => {
    const [name, setName] = useState('');
    const [size, setSize] = useState(1);
    const [mass, setMass] = useState(1);
    const [distanceFromSun, setDistanceFromSun] = useState(1);
    const [planetColor, setPlanetColor] = useState('#ffffff');
    const [trailColor, setTrailColor] = useState('#ffffff');

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPlanet = {
            name,
            size,
            mass,
            distanceFromSun,
            planetColor,
            trailColor
        };
        onCreatePlanet(newPlanet);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Planet Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
                Size:
                <input type="number" value={size} onChange={(e) => setSize(parseFloat(e.target.value))} required />
            </label>
            <label>
                Mass:
                <input type="number" value={mass} onChange={(e) => setMass(parseFloat(e.target.value))} required />
            </label>
            <label>
                Distance from Sun:
                <input type="number" value={distanceFromSun} onChange={(e) => setDistanceFromSun(parseFloat(e.target.value))} required />
            </label>
            <label>
                Planet Color:
                <input type="color" value={planetColor} onChange={(e) => setPlanetColor(e.target.value)} required />
            </label>
            <label>
                Trail Color:
                <input type="color" value={trailColor} onChange={(e) => setTrailColor(e.target.value)} required />
            </label>
            <button type="submit">Create Planet</button>
        </form>
    );
};

export default PlanetCreationForm;