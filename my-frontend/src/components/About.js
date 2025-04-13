import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import {FaFacebook, FaInstagram, FaPlay, FaTwitter} from 'react-icons/fa';
import bgVideo from '../bgvid.mp4';

const AboutPage = () => {
    const navigate = useNavigate();

    const handleStartSimulation = () => {
        navigate('/simulation');
    };

    return (
        <div className="home-container">
            {/* Video Background - stays fixed */}
            <div className="video-container">
                <video autoPlay loop muted playsInline className="background-video">
                    <source src={bgVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Navigation Bar */}
            <nav className="homepage-navbar">
                <div className="navbar-content">
                    <div className="logo">
                        <a href="/">MOSS</a>
                    </div>
                    <ul className="nav-links">
                        <li><a href="/about">About Us</a></li>
                    </ul>
                </div>
            </nav>

            {/* Scrollable Content Area */}
            <main className="scroll-container">
                <section className="about-section">
                    <div className="about-content">
                        <h1>About MOSS</h1>
                        <p>
                            MOSS (Model of Solar System) is an interactive web-based simulation designed to bring the wonders of our
                            solar system to your fingertips. Our mission is to make astronomy accessible and engaging
                            for everyone.
                        </p>

                        <h2>Our Vision</h2>
                        <p>
                            We believe that understanding our universe should be an immersive experience where everyone can partake in it.
                            By combining accurate astronomical calculations with creative visualisation, the aim is to
                            inspire the next generation of space explorers.
                        </p>

                        <h2>Features</h2>
                        <ul className="features-list">
                            <li>Accurate planetary orbits and scales</li>
                            <li>Detailed information about celestial bodies</li>
                            <li>Interactive controls for exploration</li>
                            <li>Educational content for all ages</li>
                        </ul>

                        <div className="cta-container">
                            <button className="play-button" onClick={handleStartSimulation}>
                                <FaPlay size={40} /> Start Exploring
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <p>© 2025 MOSS. All rights reserved.</p>
                    <div className="social-icons">
                        <FaFacebook size={20} />
                        <FaTwitter size={20} />
                        <FaInstagram size={20} />
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AboutPage;