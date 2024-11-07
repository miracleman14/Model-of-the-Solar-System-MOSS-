import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SimulationComponent = () => {
    const [positions, setPositions] = useState({ mercury: [0, 0], venus: [0, 0], sun: [0, 0] });
    const [orbitRadii, setOrbitRadii] = useState({ mercury: 0, venus: 0 });
    const [currentDate, setCurrentDate] = useState('');
    const [speedFactor, setSpeedFactor] = useState(1); // Default speed factor is 1x

    const fetchSimulationData = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/simulate?speed=${speedFactor}`);
            const data = response.data;

            setPositions({
                mercury: data.mercury_position,
                venus: data.venus_position,
                sun: data.sun_position
            });
            setOrbitRadii({
                mercury: data.mercury_orbit_radius,
                venus: data.venus_orbit_radius
            });
            setCurrentDate(data.current_date);
        } catch (error) {
            console.error("Error fetching simulation data:", error);
        }
    };

    useEffect(() => {
        // Adjust the fetch interval based on speed factor
        const interval = setInterval(fetchSimulationData, 1000 / Math.min(speedFactor, 10)); // Limit fetch rate to prevent overload
        return () => clearInterval(interval); // Clean up on component unmount
    }, [speedFactor]); // Re-run effect when speedFactor changes

    const scalingFactor = 0.5;  // Scale down the orbits to fit SVG viewBox

    return (
        <div style={{ textAlign: 'center' }}>
            <svg width="800" height="800" viewBox="-200 -200 400 400">
                {/* Sun */}
                <circle cx={positions.sun[0]} cy={positions.sun[1]} r="5" fill="yellow" />

                {/* Mercury Orbit and Position */}
                <circle cx={positions.sun[0]} cy={positions.sun[1]} r={orbitRadii.mercury * scalingFactor} fill="none" stroke="grey" strokeDasharray="5,5" />
                <circle cx={positions.mercury[0] * scalingFactor} cy={positions.mercury[1] * scalingFactor} r="3" fill="blue" />

                {/* Venus Orbit and Position */}
                <circle cx={positions.sun[0]} cy={positions.sun[1]} r={orbitRadii.venus * scalingFactor} fill="none" stroke="grey" strokeDasharray="5,5" />
                <circle cx={positions.venus[0] * scalingFactor} cy={positions.venus[1] * scalingFactor} r="4" fill="green" />
            </svg>

            {/* Speed Control Slider */}
            <div style={{ marginTop: '20px' }}>
                <label>Speed Control: </label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={speedFactor}
                    onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
                />
                <span> {speedFactor}x</span>
            </div>

            {/* Display the current date at the bottom */}
            <p>Current Date: {currentDate}</p>
        </div>
    );
};

export default SimulationComponent;
