import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    const handleStartSimulation = () => {
        navigate('/simulation');
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to the Solar System Simulation</h1>
            <button onClick={handleStartSimulation} style={{ padding: '10px 20px', fontSize: '16px' }}>
                Start Simulation
            </button>
        </div>
    );
};

export default HomePage;