// Orbit.js (Revised)
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { MOON_SIZES } from '../utils/constants'; // Adjust the import path as needed

const Orbit = ({
                   orbitPath,
                   color = 0xffffff,
                   opacity = 0.5,
                   scene,
                   positionScale,
                   moonDistanceScale,
                   bodyName,
                   isOrbitComplete = false // Directly use isOrbitComplete prop
               }) => {


    const geometry = useMemo(() => {
        if (!orbitPath || orbitPath.length < 2) return null;

        const distanceScale = bodyName.includes('Moon') || bodyName in MOON_SIZES ? moonDistanceScale : positionScale;

        const scaledPoints = orbitPath.map(point =>
            new THREE.Vector3(
                point.x / distanceScale,
                point.y / distanceScale,
                point.z / distanceScale
            )
        );

        if (isOrbitComplete) {
            // Use CatmullRomCurve3 for a smooth, closed loop *only* when complete
            try {
                const curve = new THREE.CatmullRomCurve3(scaledPoints, true, 'centripetal'); // Closed loop
                const curvePoints = curve.getPoints(200); // Get a fixed number of points for consistency
                return new THREE.BufferGeometry().setFromPoints(curvePoints);
            } catch (error) {
                console.error(`Error creating closed orbit for ${bodyName}:`, error);
                return null; // Or a fallback geometry
            }
        } else {
            //  For the *building* orbit, just use the points directly (dashed line)
            return new THREE.BufferGeometry().setFromPoints(scaledPoints);
        }
    }, [orbitPath, positionScale, moonDistanceScale, bodyName, isOrbitComplete]);


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
        } else if (bodyName.includes('Moon')) {
            orbOpacity = 0.4;
        }

        return new THREE.LineBasicMaterial({
            color: orbColor,
            transparent: true,
            opacity: orbOpacity,
            dashSize: isOrbitComplete ? 0 : 3,  // No dashing if complete
            gapSize: isOrbitComplete ? 0 : 1,   // No gaps if complete
        });
    }, [color, opacity, bodyName, isOrbitComplete]);

    useEffect(() => {
        if (!geometry || !scene) return;

        const existingLine = scene.getObjectByName(`orbit-line-${bodyName}`);
        if (existingLine) {
            scene.remove(existingLine);
        }

        // Use LineLoop for closed orbits, Line for building orbits
        const orbitLine = isOrbitComplete ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
        orbitLine.name = `orbit-line-${bodyName}`;
        scene.add(orbitLine);

        return () => {
            if (scene) {
                const lineToRemove = scene.getObjectByName(`orbit-line-${bodyName}`);
                if (lineToRemove) scene.remove(lineToRemove);
            }
        };
    }, [geometry, material, scene, bodyName, isOrbitComplete]);

    return null;
};

export default Orbit;