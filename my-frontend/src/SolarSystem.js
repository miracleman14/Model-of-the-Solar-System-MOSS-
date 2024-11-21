import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SolarSystem = () => {
    const [planetData, setPlanetData] = useState([]);
    const [date, setDate] = useState('');
    const [speedFactor, setSpeedFactor] = useState(1); // Default to normal time
    const [error, setError] = useState(null);

    useEffect(() => {
        const socket = io('http://localhost:5000'); // Connect to the backend

        // Start the simulation
        socket.emit('start_simulation');

        // Listen for updates
        socket.on('planet_data', (data) => {
            setPlanetData(data.planets);
            setDate(new Date(data.date).toLocaleString()); // Format date for better readability
        });

        socket.on('connect_error', (err) => {
            setError('Connection failed: ' + err.message);
        });

        // Emit speed adjustment to the server whenever the slider changes
        socket.emit('adjust_speed', { speed: speedFactor });

        return () => socket.disconnect(); // Cleanup on component unmount
    }, [speedFactor]); // Run effect when speedFactor changes

    const calculatePosition = (x, y) => {
        const scale = 100 / 1e11; // Adjust for realistic distances
        return {
            x: x * scale + 300,  // Center the system
            y: y * scale + 300,  // Center the system
        };
    };

    // Map planet names to their respective colours
    const planetColours = {
        Mercury: 'grey',
        Venus: 'yellow',
        Earth: 'blue',
        Mars: 'red',
        Jupiter: 'orange',
        Saturn: 'goldenrod',
        Uranus: 'cyan',
        Neptune: 'darkblue',
        Sun: 'yellow',
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Solar System Simulation</h1>
            <p>Virtual Date: {date}</p>

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
                    style={{ width: '200px' }}
                />
                <span> {speedFactor}x</span>
            </div>

            <div
                style={{
                    position: 'relative',
                    width: '600px',
                    height: '600px',
                    border: '1px solid black',
                    marginTop: '20px',
                    margin: '0 auto',
                }}
            >
                {/* Render the Sun at the center */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '50px',
                        height: '50px',
                        backgroundColor: planetColours.Sun,
                        borderRadius: '50%',
                        marginTop: '-25px',
                        marginLeft: '-25px',
                    }}
                />
                {planetData.map((planet) => {
                    const { x, y } = calculatePosition(planet.x, planet.y);
                    return (
                        <div
                            key={planet.name}
                            style={{
                                position: 'absolute',
                                top: `${y}px`,
                                left: `${x}px`,
                                width: '10px',
                                height: '10px',
                                backgroundColor: planetColours[planet.name] || 'gray',
                                borderRadius: '50%',
                                marginTop: '-5px',
                                marginLeft: '-5px',
                            }}
                        />
                    );
                })}
            </div>

            {/* Display error message if connection failed */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default SolarSystem;
