// src/App.js
import React from 'react';
import SimulationComponent from './components/SimulationComponent';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Solar System Simulation</h1>
                <SimulationComponent /> {/* Render the SimulationComponent */}
            </header>
        </div>
    );
}

export default App;
