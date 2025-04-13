import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MOON_SIZES } from '../utils/constants';

const Orbit = ({
                   orbitPath,
                   color = 0xffffff,
                   opacity = 0.5,
                   scene,
                   positionScale,
                   moonDistanceScale,
                   bodyName,
                   completedOrbits = {},
                   trailColor
               }) => {
    // Define maximum trail length for each body
    const getMaxTrailLength = useMemo(() => {
        const trailLengths = {
            "Mercury": 400,
            "Venus": 350,
            "Earth": 300,
            "Mars": 250,
            "Jupiter": 1000,
            "Saturn": 900,
            "Uranus": 800,
            "Neptune": 750,
            "Pluto": 200,
            "Sun": 0,
            "Halley": 3000,
            // Default lengths for moons
            "Moon": 150,
            "Io": 200,
            "Europa": 200,
            "Ganymede": 200,
            "Callisto": 200
        };

        // Scale the trail length relative to the body's radius (from your constants)
        const bodyRadius = {
            "Mercury": 0.383,
            "Venus": 0.949,
            "Earth": 1.0,
            "Mars": 0.532,
            "Jupiter": 11.21,
            "Saturn": 9.45,
            "Uranus": 4.01,
            "Neptune": 3.88,
            "Pluto": 0.186,
            "Sun": 109.0,
            "Halley": 0.0008
        };

        // For moons and other bodies not specifically defined, return a default value
        if (trailLengths[bodyName]) {
            return trailLengths[bodyName];
        } else if (bodyName.includes('Moon')) {
            return 150; // Default for unnamed moons
        } else {
            return 300; // Default for any other body
        }
    }, [bodyName]);

    // Generate orbit points using only a portion for the trail effect
    const generateTrailPoints = useMemo(() => {
        if (!orbitPath || orbitPath.length < 2) return [];

        // Determine the appropriate distance scale
        const distanceScale = bodyName.includes('Moon') || bodyName in MOON_SIZES ? moonDistanceScale : positionScale;

        // Get the maximum number of points for this body's trail
        const maxPoints = getMaxTrailLength;

        // For trails, we only want the most recent points
        let trailPoints = [];

        if (orbitPath.length > maxPoints) {
            // Take only the most recent points for the trail
            trailPoints = orbitPath.slice(-maxPoints);
        } else {
            // If we don't have enough points yet, use all available
            trailPoints = [...orbitPath];
        }

        // Convert points to THREE.Vector3 objects with correct scaling
        return trailPoints.map(point =>
            new THREE.Vector3(
                point.x / distanceScale,
                point.y / distanceScale,
                point.z / distanceScale
            )
        );
    }, [orbitPath, bodyName, positionScale, moonDistanceScale, getMaxTrailLength]);

    // Define material with fade out effect for trails
    const material = useMemo(() => {
        let orbColor = color;
        let orbOpacity = opacity;

        if (bodyName === 'Earth') {
            orbColor = 0x3498db;
            orbOpacity = 0.7;
        } else if (bodyName === 'Mars') {
            orbColor = 0xe74c3c;
            orbOpacity = 0.7;
        } else if (bodyName === 'Mercury') {
            orbColor = 0xa0a0a0;
            orbOpacity = 0.6;
        } else if (bodyName === 'Venus') {
            orbColor = 0xf39c12;
            orbOpacity = 0.7;
        } else if (bodyName === 'Jupiter') {
            orbColor = 0xf1c40f;
            orbOpacity = 0.7;
        } else if (bodyName === 'Saturn') {
            orbColor = 0xe67e22;
            orbOpacity = 0.7;
        } else if (bodyName === 'Uranus') {
            orbColor = 0x1abc9c;
            orbOpacity = 0.7;
        } else if (bodyName === 'Neptune') {
            orbColor = 0x3498db;
            orbOpacity = 0.7;
        } else if (bodyName === 'Pluto') {
            orbColor = 0x95a5a6;
            orbOpacity = 0.6;
        } else if (bodyName === 'Halley') {
            orbColor = 0x88aaff;
            orbOpacity = 0.8;
        } else if (bodyName.includes('Moon')) {
            orbColor = 0xecf0f1;
            orbOpacity = 0.5;
        }

        // Use custom trail color if provided
        if (trailColor) {
            orbColor = new THREE.Color(trailColor);
        }

        return new THREE.LineBasicMaterial({
            color: orbColor,
            transparent: true,
            opacity: orbOpacity,
            linewidth: bodyName === 'Halley' ? 3 : 2,
        });
    }, [color, opacity, bodyName, trailColor]); // Add trailColor to dependencies

    // Create and add the orbit trail
    useEffect(() => {
        if (!scene || !generateTrailPoints || generateTrailPoints.length < 2) return;

        // Clean up any existing orbit line
        const existingLine = scene.getObjectByName(`orbit-line-${bodyName}`);
        if (existingLine) {
            scene.remove(existingLine);
        }

        try {
            // Skip Sun trails
            if (bodyName === 'Sun') return;

            // Create geometry from points
            const geometry = new THREE.BufferGeometry().setFromPoints(generateTrailPoints);

            // For Halley's comet and other bodies, create the trail with gradient opacity
            if (generateTrailPoints.length > 0) {
                // Create colors array for gradient effect
                const colors = [];
                const pointCount = generateTrailPoints.length;

                for (let i = 0; i < pointCount; i++) {

                    // Create color with appropriate opacity
                    const color = new THREE.Color(material.color);

                    // Add to colors array (RGB format)
                    colors.push(color.r, color.g, color.b);
                }

                // Add colors to the buffer geometry
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                // Update material to use vertex colors
                const trailMaterial = new THREE.LineBasicMaterial({
                    vertexColors: true,
                    linewidth: material.linewidth,
                    transparent: true,
                    opacity: material.opacity
                });

                // Create orbit line
                const orbitLine = new THREE.Line(geometry, trailMaterial);

                // Set name and properties
                orbitLine.name = `orbit-line-${bodyName}`;
                orbitLine.frustumCulled = false; // Important: Prevent culling

                // Add to scene
                scene.add(orbitLine);
            }
        } catch (error) {
            console.error(`Error creating orbit trail for ${bodyName}:`, error);
        }

        // Cleanup
        return () => {
            if (scene) {
                const lineToRemove = scene.getObjectByName(`orbit-line-${bodyName}`);
                if (lineToRemove) scene.remove(lineToRemove);
            }
        };
    }, [generateTrailPoints, material, scene, bodyName]);

    return null;
};

export default Orbit;