import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import io from 'socket.io-client';

const SolarSystem = () => {
    const [orbitPaths, setOrbitPaths] = useState({});
    const [planetData, setPlanetData] = useState([]); // Store planet data
    const [date, setDate] = useState(''); // Store current date
    const [speed, setSpeed] = useState(1); // Simulation speed (1x normal speed)
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const isSceneInitializedRef = useRef(false); // Ensure scene is only initialized once
    const socketRef = useRef(null); // Reference for the socket connection
    const timeRef = useRef(0); // Track time for console log animation
    const controlsRef = useRef(null); // OrbitControls reference

    useEffect(() => {
        // Fetch initial planet data and set up socket connection
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/reset');
                const data = await response.json();
                setPlanetData(data.planets); // Set the initial planet data

                // Set up socket connection
                const socket = io('http://localhost:5000');
                socketRef.current = socket;

                // Request the simulation to start
                socket.emit('start_simulation');

                // Listen for live updates
                socket.on('planet_data', (data) => {
                    const ukDate = new Date(data.date).toLocaleString('en-GB');
                    setPlanetData(data.planets);
                    setDate(ukDate);
                });
            } catch (error) {
                console.error('Error fetching planet data:', error);
            }
        };

        fetchData();

        return () => {
            // Clean up socket connection on component unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        // Initialize Three.js scene
        if (!isSceneInitializedRef.current) {
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.z = 50;
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Add lighting
            const light = new THREE.PointLight(0xffffff, 1, 1000);
            light.position.set(0, 0, 0);
            scene.add(light);

            // Add OrbitControls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.2;
            controls.screenSpacePanning = true;
            controlsRef.current = controls;

            // Render loop
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);

                // Animate console log based on simulation speed
                timeRef.current += speed;
                if (timeRef.current % 100 === 0) { // Log every 100 iterations
                    console.log(`Simulation running at speed: ${speed}x, Time: ${timeRef.current}`);
                }
            };
            animate();

            // Handle window resizing
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            isSceneInitializedRef.current = true;
        }
    }, [speed]); // Re-run the animation loop when speed changes

    useEffect(() => {
        if (planetData.length > 0) {
            // Remove existing planet meshes (to avoid duplication)
            const scene = sceneRef.current;
            scene.children = scene.children.filter(child => child.type !== 'Mesh');

            // Add the Sun at the origin
            const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sun = new THREE.Mesh(sunGeometry, sunMaterial);
            sun.position.set(0, 0, 0);
            scene.add(sun);

            // Dynamically add planets from data
            planetData.forEach((planet) => {
                const planetMesh = createPlanetMesh(planet);
                scene.add(planetMesh);
            });
        }
    }, [planetData]);

    const createPlanetMesh = (planet) => {
        // Adjust scale for better visibility
        const sizeScale = 1e3; // Larger to make planets more visible
        const positionScale = 1e9; // Adjust to space planets realistically

        const geometry = new THREE.SphereGeometry(Math.max(planet.radius / sizeScale, 0.5), 32, 32); // Minimum size for visibility
        const material = new THREE.MeshBasicMaterial({
            color: planet.name === 'Mercury' ? 0x888888 : 0xffa500,
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            planet.x / positionScale,
            planet.y / positionScale,
            planet.z / positionScale
        );

        return mesh;
    };


    const handleSpeedChange = (event) => {
        const newSpeed = Number(event.target.value);
        setSpeed(newSpeed);
        socketRef.current.emit('adjust_speed', { speed: newSpeed });
    };

    const setTopDownView = () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        // Position the camera directly above the origin along the positive Z-axis
        camera.position.set(0, 0, 100); // Move to +Z for top-down

        // Look directly at the origin (Sun)
        camera.lookAt(0, 0, 0);

        // Adjust camera's "up" vector to ensure proper orientation
        camera.up.set(0, 1, 0); // Set the Y-axis as the up direction

        // Update OrbitControls to match the new camera settings
        if (controls) {
            controls.target.set(0, 0, 0); // Focus controls on the origin
            controls.update();
        }
    };

    useEffect(() => {
        const fetchOrbitPaths = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/orbit-paths');
                const data = await response.json();
                setOrbitPaths(data);
            } catch (error) {
                console.error('Error fetching orbit paths:', error);
            }
        };
        fetchOrbitPaths();
    }, []);




    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Solar System 3D Simulation</h1>
            <p>Virtual Date: {date}</p>
            <div>
                <label>
                    Simulation Speed:
                    <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={speed}
                        onChange={handleSpeedChange}
                    />
                    {speed}x
                </label>
            </div>
            <button onClick={setTopDownView}>Top-Down View</button>
        </div>
    );
};

export default SolarSystem;
