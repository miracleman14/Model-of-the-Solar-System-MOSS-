import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import io from 'socket.io-client';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const SolarSystem = () => {
    const [planetData, setPlanetData] = useState([]);
    const [date, setDate] = useState('');
    const [speed, setSpeed] = useState(1);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const isSceneInitializedRef = useRef(false);
    const socketRef = useRef(null);
    const timeRef = useRef(0);
    const orbitDurationsRef = useRef({}); // Store orbit data
    const controlsRef = useRef(null);
    const fontRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/reset');
                const data = await response.json();
                setPlanetData(data.planets);

                const socket = io('http://localhost:5000');
                socketRef.current = socket;

                socket.emit('start_simulation');
                socket.on('planet_data', (data) => {

                    // Truncate the microseconds from the date string (remove everything after the 3rd decimal)
                    const truncatedDateString = data.date.substring(0, 23); // Keep up to milliseconds

                    const parsedDate = new Date(truncatedDateString);
                    if (!isNaN(parsedDate)) {
                        const ukDate = parsedDate.toLocaleString('en-GB');
                        setDate(ukDate);
                    } else {
                        console.error('Invalid date format received:', data.date);
                        setDate('Invalid Date');
                    }
                    setPlanetData(data.planets);
                });



            } catch (error) {
                console.error('Error fetching planet data:', error);
            }
        };

        fetchData();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
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

            const light = new THREE.PointLight(0xffffff, 1, 1000);
            light.position.set(0, 0, 0);
            scene.add(light);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.2;
            controls.screenSpacePanning = true;
            controlsRef.current = controls;

            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
                timeRef.current += speed;
            };
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            isSceneInitializedRef.current = true;
        }
    }, [speed]);

    // Load font asynchronously
    useEffect(() => {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            fontRef.current = font;
        });
    }, []);

    useEffect(() => {
        if (planetData.length > 0 && fontRef.current) {
            const scene = sceneRef.current;
            scene.clear(); // Clear all objects in the scene

            const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sun = new THREE.Mesh(sunGeometry, sunMaterial);
            sun.position.set(0, 0, 0);
            scene.add(sun);

            planetData.forEach((planet) => {
                const planetMesh = createPlanetMesh(planet);
                scene.add(planetMesh);
                createLabel(planet, planetMesh);

                if (!orbitDurationsRef.current[planet.name]) {
                    orbitDurationsRef.current[planet.name] = {
                        startTime: timeRef.current,
                        lastCompletion: 0,
                        lastAngle: 0, // Store the last angle
                    };
                }
            });
        }
    }, [planetData]);

    useEffect(() => {
        if (planetData.length > 0) {
            planetData.forEach((planet) => {
                if (planet.name === "Sun") return; // Skip the Sun

                const planetMesh = sceneRef.current.getObjectByName(planet.name);
                if (planetMesh) {
                    const orbitData = orbitDurationsRef.current[planet.name];

                    // Calculate the angle of the planet in its orbit
                    const angle = Math.atan2(planetMesh.position.y, planetMesh.position.x); // Use atan2 to get the angle

                    // Check if the planet has completed an orbit
                    if (Math.abs(angle - orbitData.lastAngle) > Math.PI) {
                        const currentDate = new Date(date); // Current simulation date
                        const lastOrbitDate = new Date(orbitData.lastCompletion || date); // Last orbit completion date (default to current date if undefined)

                        // Log to inspect the date values
                        console.log('Current Date:', currentDate);
                        console.log('Last Orbit Date:', lastOrbitDate);

                        // Ensure the dates are valid before calculating the difference
                        if (!isNaN(currentDate) && !isNaN(lastOrbitDate)) {
                            const daysElapsed = (currentDate - lastOrbitDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days

                            // Log the orbit completion
                            console.log(`${planet.name} completed an orbit in ${daysElapsed.toFixed(3)} days.`);

                            // Update the last completion date
                            orbitData.lastCompletion = date;
                        } else {
                            console.error('Invalid Date Detected!');
                        }
                    }

                    // Update the last angle for next comparison
                    orbitData.lastAngle = angle;
                }
            });
        }
    }, [planetData, date]);




    const createLabel = (planet, planetMesh) => {
        if (!fontRef.current) return;

        const nameLabel = new TextGeometry(planet.name, {
            font: fontRef.current,
            size: 1,
            depth: 0.1, // Replace height with depth
        });
        const nameLabelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const labelMesh = new THREE.Mesh(nameLabel, nameLabelMaterial);
        labelMesh.position.set(planetMesh.position.x, planetMesh.position.y + 2, planetMesh.position.z);
        sceneRef.current.add(labelMesh);
    };

    const createPlanetMesh = (planet) => {
        const sizeScale = 1e3;
        const positionScale = 1e9;

        const geometry = new THREE.SphereGeometry(Math.max(planet.radius / sizeScale, 0.5), 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: planet.name === 'Mercury' ? 0x888888 : 0xffa500 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = planet.name;

        mesh.position.set(planet.x / positionScale, planet.y / positionScale, planet.z / positionScale);
        return mesh;
    };

    const handleSpeedChange = (event) => {
        const newSpeed = Number(event.target.value);
        setSpeed(newSpeed);
        socketRef.current.emit('adjust_speed', { speed: newSpeed });
    };

    return (
        <div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white' }}>
                <h1>Solar System Simulation</h1>
                <p>Date: {date}</p>
                <div>
                    <label>Speed:</label>
                    <input type="range" min="0" max="10" value={speed} onChange={handleSpeedChange} />
                </div>
            </div>
        </div>
    );
};

export default SolarSystem;
