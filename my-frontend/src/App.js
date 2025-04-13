import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SolarSystem from './components/SolarSystem';
import About from './components/About';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/simulation" element={<SolarSystem />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </Router>
    );
}

export default App;