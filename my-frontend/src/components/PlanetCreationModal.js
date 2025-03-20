import React from 'react';
import PlanetCreationForm from './PlanetCreationForm';

const PlanetCreationModal = ({ isOpen, onClose, onCreatePlanet }) => {
    if (!isOpen) return null;

    return (
        <div className="planet-creation-modal-overlay">
            <div className="planet-creation-modal-content">
                <h2>Create a New Planet</h2>
                <PlanetCreationForm onCreatePlanet={onCreatePlanet} />
                <button onClick={onClose} className="close-button">
                    Close
                </button>
            </div>
        </div>
    );
};

export default PlanetCreationModal;