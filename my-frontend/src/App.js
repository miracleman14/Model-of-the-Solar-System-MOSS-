import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import SolarSystem from './SolarSystem';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/simulation" element={<SolarSystem />} />
            </Routes>
        </Router>
    );
}

export default App;