import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimulationComponent = () => {
    const [mercuryPosition, setMercuryPosition] = useState([0, 0]);
    const [venusPosition, setVenusPosition] = useState([0, 0]);
    const [mercuryOrbitRadius, setMercuryOrbitRadius] = useState(0);
    const [venusOrbitRadius, setVenusOrbitRadius] = useState(0);

    const runSimulation = async (date) => {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/simulate?date=${date}`);
            const { mercury_position, venus_position, mercury_orbit_radius, venus_orbit_radius } = response.data;
            setMercuryPosition(mercury_position);
            setVenusPosition(venus_position);
            setMercuryOrbitRadius(mercury_orbit_radius);
            setVenusOrbitRadius(venus_orbit_radius);
        } catch (error) {
            console.error('Error fetching simulation data:', error);
        }
    };

    useEffect(() => {
        runSimulation('2024-01-01');
    }, []);

    return (
        <div>
            <h2>Solar System Simulation</h2>
            <svg width="800" height="800" viewBox="-400 -400 800 800">
                {/* Orbit Circles */}
                <circle cx="0" cy="0" r={mercuryOrbitRadius} stroke="gray" strokeWidth="1" fill="none" />
                <circle cx="0" cy="0" r={venusOrbitRadius} stroke="gray" strokeWidth="1" fill="none" />

                {/* Planets */}
                <circle cx={mercuryPosition[0]} cy={mercuryPosition[1]} r="3" fill="gray" />
                <circle cx={venusPosition[0]} cy={venusPosition[1]} r="4" fill="orange" />

                {/* Sun */}
                <circle cx="0" cy="0" r="10" fill="yellow" />
            </svg>

            <input
                type="date"
                onChange={(e) => runSimulation(e.target.value)}
                defaultValue="2024-01-01"
            />
        </div>
    );
};

export default SimulationComponent;
