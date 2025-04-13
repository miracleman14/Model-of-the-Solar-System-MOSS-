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

    // Initialize scene, camera, and renderer
    useEffect(() => {
        // Scene setup
        if (!sceneRef.current) {
            sceneRef.current = new THREE.Scene();
            // Add subtle ambient light
            sceneRef.current.add(new THREE.AmbientLight(0x404040));
            // Add a directional light for better shading
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5).normalize();
            sceneRef.current.add(directionalLight);
        }

        if (!cameraRef.current) {
            // Initialize camera
            cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            cameraRef.current.position.z = 5; // Initial position
        }

        // Initialize renderer
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: 'default',
                preserveDrawingBuffer: false
            });
            renderer.setSize(200, 200);
            renderer.setPixelRatio(window.devicePixelRatio);

            if (mountRef.current) {
                // Clear any previous canvas before appending
                while (mountRef.current.firstChild) {
                    mountRef.current.removeChild(mountRef.current.firstChild);
                }
                mountRef.current.appendChild(renderer.domElement);
            }

            rendererRef.current = renderer;
        }

        return () => {
            // Component unmount cleanup
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (rendererRef.current) {
                // Ensure DOM element is removed if component unmounts unexpectedly
                if (mountRef.current && rendererRef.current.domElement.parentNode === mountRef.current) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else if (object.material.dispose) { // Check if dispose exists
                            object.material.dispose();
                        }
                    }
                });
                // Dispose of lights etc if added
                while(sceneRef.current.children.length > 0){
                    sceneRef.current.remove(sceneRef.current.children[0]);
                }
                sceneRef.current = null;
            }
            cameraRef.current = null;
            sphereRef.current = null; // Ensure refs are cleared
            materialRef.current = null;
        };
    }, []); // Empty dependency array: runs only once on mount

    // Handle updates to size and color
    useEffect(() => {
        // Guard clauses for safety during updates/unmounts
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current || !mountRef.current) {
            console.warn("PlanetPreview: Refs not ready for update.");
            return;
        }

        // --- Cleanup previous sphere ---
        if (sphereRef.current) {
            // Ensure geometry/material are disposed before removing
            if (sphereRef.current.geometry) sphereRef.current.geometry.dispose();
            // Material disposal handled below if it exists
            sceneRef.current.remove(sphereRef.current);
            sphereRef.current = null; // Clear ref
        }
        // Dispose previous material specifically
        if (materialRef.current) {
            if (materialRef.current.map) materialRef.current.map.dispose(); // Dispose texture maps if any
            materialRef.current.dispose();
            materialRef.current = null; // Clear ref
        }

        // --- Create new sphere ---
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color });
        materialRef.current = material; // Store ref to new material

        const sphere = new THREE.Mesh(geometry, material);
        sceneRef.current.add(sphere);
        sphereRef.current = sphere; // Store ref to new sphere

        // --- Adjust Camera ---
        const fovInRadians = cameraRef.current.fov * (Math.PI / 180);
        const objectSize = size * 2; // Diameter
        // Calculate distance to fit the object based on FOV
        const distanceToFit = objectSize / (2 * Math.tan(fovInRadians / 2));
        // Padding to ensure a minimum distance
        const desiredDistance = Math.max(distanceToFit * 1.2, size + 2); // Ensure camera is at least 2 units away from surface

        cameraRef.current.position.z = desiredDistance;
        cameraRef.current.lookAt(0, 0, 0); // Ensure camera looks at the center

        // --- Animation ---
        // Stop previous animation if any
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }

        const animate = () => {
            // Added checks inside animate loop too for robustness
            if (!sphereRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
                console.warn("PlanetPreview: Refs not available during animation frame.");
                animationIdRef.current = null; // Stop requesting frames
                return;
            }

            sphereRef.current.rotation.y += 0.005; // Slow down rotation a bit

            try {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            } catch (error) {
                console.error("Error during rendering:", error);
                if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); // Stop on error
                animationIdRef.current = null;
                return;
            }

            animationIdRef.current = requestAnimationFrame(animate);
        };

        // Start new animation
        animate();

        // Cleanup function for this effect (when size/color change)
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
        };
        // Re-run this effect if size or color changes
    }, [size, color]); // Include size and color in dependencies

    // Ensure mountRef is always present for the initial render
    return <div ref={mountRef} style={{ width: '200px', height: '200px', border: '1px solid grey' }} />;
};

export default PlanetPreview;