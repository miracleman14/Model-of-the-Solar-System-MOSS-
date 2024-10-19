// src/components/SimulationComponent.js
import React, { useState } from 'react';
import axios from 'axios'; // Import axios

const SimulationComponent = () => {
    const [results, setResults] = useState(null);
    const [steps, setSteps] = useState(10); // Default values
    const [timeStep, setTimeStep] = useState(1.0); // Default values

    const runSimulation = async () => {
        if (isNaN(steps) || isNaN(timeStep) || steps <= 0 || timeStep <= 0) {
            alert("Please enter valid positive numbers for steps and time step.");
            return;
        }

        try {
            const response = await axios.get(`http://127.0.0.1:5000/simulate/${steps}/${timeStep}`);
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching simulation data:', error);
            alert("Error fetching simulation data. Please check the server.");
        }
    };

    return (
        <div>
            <h2>Run Solar System Simulation</h2>
            <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                placeholder="Enter steps"
            />
            <input
                type="number"
                value={timeStep}
                onChange={(e) => setTimeStep(Number(e.target.value))}
                placeholder="Enter time step"
                step="0.1" // Allow decimal input
            />
            <button onClick={runSimulation}>Run Simulation</button>

            {results && (
                <div>
                    <h3>Simulation Results</h3>
                    <p>Mercury Position: {JSON.stringify(results.mercury_position)}</p>
                    <p>Venus Position: {JSON.stringify(results.venus_position)}</p>
                    <p>Sun Position: {JSON.stringify(results.sun_position)}</p>
                </div>
            )}
        </div>
    );
};

export default SimulationComponent;
