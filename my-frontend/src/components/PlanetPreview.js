import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PlanetPreview = ({ size, color }) => {
    const mountRef = useRef(null);
    const rendererRef = useRef(null); // Ref for the renderer
    const animationIdRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 5;

        // Initialize renderer only once
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(200, 200); // Set a fixed size.
            mountRef.current.appendChild(renderer.domElement);
            rendererRef.current = renderer; // Store the renderer
        }

        // Geometry and Material
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Animation Loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.01;
            rendererRef.current.render(scene, camera); // Use the stored renderer
        };

        animate();


        return () => {
            cancelAnimationFrame(animationIdRef.current);

            // Cleanup: Dispose of resources
            sphere.geometry.dispose();
            sphere.material.dispose();
            scene.remove(sphere);

            if (rendererRef.current && mountRef.current) {
                // Check if the renderer's domElement is still a child of mountRef
                if (mountRef.current.contains(rendererRef.current.domElement)) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose(); // Dispose Three.js renderer
                rendererRef.current = null;   // Clear the reference.

            }


        };
    }, [size, color]);

    return <div ref={mountRef} />;
};

export default PlanetPreview;