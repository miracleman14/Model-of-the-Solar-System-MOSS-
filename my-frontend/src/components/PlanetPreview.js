import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PlanetPreview = ({ size, color }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const sphereRef = useRef(null);
    const materialRef = useRef(null);
    const animationIdRef = useRef(null);

    // Initialize scene, camera, and renderer only once
    useEffect(() => {
        // Scene setup (only once)
        if (!sceneRef.current) {
            sceneRef.current = new THREE.Scene();
        }

        if (!cameraRef.current) {
            cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            cameraRef.current.position.z = 5;
        }

        // Initialize renderer only once
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: 'default', // Try to use default power preference to avoid performance issues
                preserveDrawingBuffer: false // Optimize performance
            });
            renderer.setSize(200, 200);
            renderer.setPixelRatio(window.devicePixelRatio);

            if (mountRef.current) {
                if (mountRef.current.firstChild) {
                    mountRef.current.removeChild(mountRef.current.firstChild);
                }
                mountRef.current.appendChild(renderer.domElement);
            }

            rendererRef.current = renderer;
        }

        return () => {
            // Only clean up when component unmounts completely
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }

            if (sceneRef.current) {
                // Dispose of all objects in the scene
                sceneRef.current.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
                sceneRef.current = null;
            }

            cameraRef.current = null;
        };
    }, []);

    // Handle updates to size and color
    useEffect(() => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        // Clean up previous sphere if it exists
        if (sphereRef.current) {
            if (sphereRef.current.geometry) sphereRef.current.geometry.dispose();
            if (materialRef.current) materialRef.current.dispose();
            sceneRef.current.remove(sphereRef.current);
        }

        // Create new geometry and material with updated properties
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color });
        materialRef.current = material;

        // Create and add new sphere
        const sphere = new THREE.Mesh(geometry, material);
        sceneRef.current.add(sphere);
        sphereRef.current = sphere;

        // Animation function
        const animate = () => {
            if (!sphereRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
                return; // Safety check
            }

            sphereRef.current.rotation.x += 0.01;
            sphereRef.current.rotation.y += 0.01;
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        // Stop previous animation if any
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }

        // Start new animation
        animate();

        return () => {
            // This cleanup runs when size or color changes
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [size, color]);

    return <div ref={mountRef} style={{ width: '200px', height: '200px' }} />;
};

export default PlanetPreview;