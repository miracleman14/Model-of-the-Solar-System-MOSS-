// PlanetCreationForm.js
import React, { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect
import PlanetPreview from './PlanetPreview';

const PlanetCreationForm = ({ onCreatePlanet }) => {
    const [name, setName] = useState('');
    const [size, setSize] = useState(1);
    const [mass, setMass] = useState(1);
    const [distanceFromSun, setDistanceFromSun] = useState(1);
    const [planetColor, setPlanetColor] = useState('#ffffff');
    const [trailColor, setTrailColor] = useState('#ffffff');


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
            trailColor
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
        <div style={{ display: 'flex', gap: '20px' }}>
            <form onSubmit={handleSubmit} style={{flex: 1}}>
                <label>
                    Planet Name:
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Size:
                    <select value={size} onChange={(e) => setSize(parseFloat(e.target.value))}>
                        <option value={0.1}>Small</option>
                        <option value={0.5}>Medium</option>
                        <option value={1}>Large</option>
                    </select>
                </label>
                <label>
                    Mass:
                    <select value={mass} onChange={(e) => setMass(parseFloat(e.target.value))}>
                        <option value={0.1}>Light</option>
                        <option value={0.5}>Medium</option>
                        <option value={1}>Heavy</option>
                    </select>
                </label>
                <label>
                    Distance from Sun:
                    <select value={distanceFromSun} onChange={(e) => setDistanceFromSun(parseFloat(e.target.value))}>
                        <option value={1}>Close</option>
                        <option value={10}>Medium</option>
                        <option value={100}>Far</option>
                    </select>
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
            <PlanetPreview size={size} color={planetColor} style={{flex: 1}}/>
        </div>
    );
};

export default PlanetCreationForm;