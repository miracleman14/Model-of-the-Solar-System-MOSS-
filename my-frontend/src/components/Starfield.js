import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Starfield = ({ scene }) => {
    const starFieldRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!scene || starFieldRef.current) return;

        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        // Distribute stars in a spherical pattern
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2; // Random longitude
            const phi = Math.acos(2 * Math.random() - 1); // Random latitude
            const radius = 10000 + Math.random() * 5000; // Vary radius for depth

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions.set([x, y, z], i * 3);

            // Slightly bluish-white colors for realism
            colors.set([
                Math.random() * 0.2 + 0.8,  // R (mostly white)
                Math.random() * 0.2 + 0.8,  // G
                Math.random() * 0.5 + 0.5   // B (cooler hues)
            ], i * 3);
        }

        // Create the geometry
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        // Load a soft glow texture for stars
        const textureLoader = new THREE.TextureLoader();
        const starTexture = textureLoader.load("/textures/star-glow.png"); // Add a small soft glow texture

        // Star material with blending for realism
        const starMaterial = new THREE.PointsMaterial({
            size: 10,
            map: starTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });

        // Create the starfield
        const starField = new THREE.Points(starGeometry, starMaterial);
        scene.add(starField);
        starFieldRef.current = starField;

        // Animate for subtle parallax effect
        const animateStars = () => {
            starField.rotation.y += 0.0002; // Slow rotation for movement
            animationRef.current = requestAnimationFrame(animateStars);
        };

        animateStars();

        return () => {
            scene.remove(starField);
            cancelAnimationFrame(animationRef.current);
        };
    }, [scene]);

    return null;
};

export default Starfield;
