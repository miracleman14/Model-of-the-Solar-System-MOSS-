import React from 'react';
import './PlanetModal.css'; // Add styles for the modal

const PlanetModal = ({ planet, onClose }) => {
    if (!planet) return null;

    // Example planet details (you can fetch or hardcode this data)
    const planetDetails = {
        Mercury: { description: "The smallest planet in the Solar System.", gravity: "3.7 m/s²", moons: 0 },
        Venus: { description: "The hottest planet in the Solar System.", gravity: "8.87 m/s²", moons: 0 },
        Earth: { description: "Our home planet.", gravity: "9.81 m/s²", moons: 1 },
        Mars: { description: "The Red Planet.", gravity: "3.71 m/s²", moons: 2 },
        Jupiter: { description: "The largest planet in the Solar System.", gravity: "24.79 m/s²", moons: 79 },
        Saturn: { description: "Known for its stunning rings.", gravity: "10.44 m/s²", moons: 83 },
        Uranus: { description: "An ice giant with a unique sideways rotation.", gravity: "8.69 m/s²", moons: 27 },
        Neptune: { description: "The farthest planet from the Sun.", gravity: "11.15 m/s²", moons: 14 },
    };

    const details = planetDetails[planet.name] || { description: "No details available." };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{planet.name}</h2>
                <p>{details.description}</p>
                <p><strong>Gravity:</strong> {details.gravity}</p>
                <p><strong>Moons:</strong> {details.moons}</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default PlanetModal;