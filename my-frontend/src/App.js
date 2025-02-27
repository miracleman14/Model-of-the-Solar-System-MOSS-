import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SolarSystem from './components/SolarSystem';

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