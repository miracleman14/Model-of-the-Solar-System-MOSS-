// src/components/Labels.js

import React, { useEffect } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

const Labels = ({ scene, planetData, font }) => {
    useEffect(() => {
        if (!font) return;

        // Remove existing labels before adding new ones
        scene.children = scene.children.filter((child) => !child.isLabel);

        planetData.forEach((planet) => {
            const planetMesh = scene.getObjectByName(planet.name);
            if (planetMesh) {
                createLabel(planet, planetMesh, scene, font);
            }
        });
    }, [planetData, font, scene]);

    const createLabel = (planet, planetMesh, scene, font) => {
        const nameLabel = new TextGeometry(planet.name, {
            font: font,
            size: 1.5, // Adjust label size for better visibility
            depth: 0.1,
        });

        const nameLabelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const labelMesh = new THREE.Mesh(nameLabel, nameLabelMaterial);

        // Dynamic offset based on the planet's size
        const labelOffset = Math.max(
            planetMesh.geometry.parameters.radius * 1.5, // Use planet radius for label position
            2 // Ensure a minimum offset
        );

        labelMesh.position.set(
            planetMesh.position.x,
            planetMesh.position.y + labelOffset, // Position label above the planet
            planetMesh.position.z
        );

        labelMesh.isLabel = true; // Mark this mesh as a label for filtering purposes
        scene.add(labelMesh);
    };

    return null;
};

export default Labels;