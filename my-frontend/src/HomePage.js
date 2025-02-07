import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { FaPlay, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import bgVideo from './bgvid.mp4'; // Ensure this file exists in the same directory

const HomePage = () => {
    const navigate = useNavigate();

    const handleStartSimulation = () => {
        navigate('/simulation');
    };

    return (
        <div className="home-container">
            {/* Video Background */}
            <div className="video-container">
                <video autoPlay loop muted playsInline className="background-video">
                    <source src={bgVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="logo">MOSS</div>
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                </ul>
            </nav>

            {/* Hero Section */}
            <div className="hero-section">
                <h1>Explore the Universe Like Never Before</h1>
                <p>Embark on a journey through the solar system with our interactive simulation.</p>
                <button className="play-button" onClick={handleStartSimulation}>
                    <FaPlay size={40} />
                </button>
            </div>

            {/* Information Section */}
            <section className="info-section">
                <div className="info-box">
                    <h2>Realistic Simulation</h2>
                    <p>Experience accurate planetary movements and celestial physics.</p>
                </div>
                <div className="info-box">
                    <h2>Interactive Controls</h2>
                    <p>Navigate through space, zoom in on planets, and explore at your own pace.</p>
                </div>
                <div className="info-box">
                    <h2>Educational Experience</h2>
                    <p>Learn about each planet, their properties, and their orbits.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2025 SolarSim. All rights reserved.</p>
                <div className="social-icons">
                    <FaFacebook size={20} />
                    <FaTwitter size={20} />
                    <FaInstagram size={20} />
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
