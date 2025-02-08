import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import io from 'socket.io-client';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import './SolarSystem.css';
import PlanetModal from './PlanetModal'; // Import the modal

const SolarSystem = () => {
    const [planetData, setPlanetData] = useState([]);
    const [date, setDate] = useState('');
    const [speed, setSpeed] = useState(1);
    const [selectedPlanet, setSelectedPlanet] = useState(null); // Track selected planet
    const [orbitPaths, setOrbitPaths] = useState({}); // Initialize orbit paths state
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const isSceneInitializedRef = useRef(false);
    const socketRef = useRef(null);
    const timeRef = useRef(0);
    const orbitDurationsRef = useRef({}); // Store orbit data
    const controlsRef = useRef(null);
    const fontRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const raycasterRef = useRef(new THREE.Raycaster());  // Raycaster to detect clicks
    const mouseRef = useRef(new THREE.Vector2());  // Store mouse position
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state
    const starFieldRef = useRef(null); // Reference to store the starfield


    const createStarfield = (scene) => {
        if (starFieldRef.current) return; // If the starfield already exists, do nothing

        const starCount = 5000; // Number of stars
        const positions = new Float32Array(starCount * 3); // Each star has x, y, z coordinates
        const colors = new Float32Array(starCount * 3); // Each star has r, g, b color values

        // Randomly distribute stars in a cube and assign random colors
        for (let i = 0; i < starCount; i++) {
            // Random positions
            positions[i * 3] = (Math.random() - 0.5) * 20000; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20000; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20000; // z

            // Random colors
            const r = Math.random() * 0.5 + 0.5; // Bias toward brighter colors
            const g = Math.random() * 0.5 + 0.5;
            const b = Math.random() * 0.5 + 0.5;
            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;


        }

        // Create a geometry and set the positions
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Add color attribute

        const sizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            sizes[i] = Math.random() * 0.2 + 0.1; // Random size between 0.1 and 0.3
        }
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create a material for the stars with vertex colors enabled
        const starMaterial = new THREE.PointsMaterial({
            size: 0.1, // Size of each star
            transparent: true,
            vertexColors: true, // Enable vertex colors
        });

        // Create the starfield mesh
        const starField = new THREE.Points(starGeometry, starMaterial);
        scene.add(starField);

        // Store the starfield in the reference
        starFieldRef.current = starField;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/reset');
                const data = await response.json();
                setPlanetData(data.planets);  // Set planet data to the initial state
                const socket = io('http://localhost:5000');
                socketRef.current = socket;
                socket.emit('start_simulation');  // Start the simulation after reset
                socket.on('planet_data', (data) => {
                    const truncatedDateString = data.date.substring(0, 23);
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
                socketRef.current.disconnect();  // Clean up socket connection on unmount
            }
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/get-simulation-state');
                const data = await response.json();
                setPlanetData(data.planets);
                setDate(data.date); // Use the fetched date
            } catch (error) {
                console.error('Error fetching planet data:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!isSceneInitializedRef.current) {
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                100000
            );
            camera.position.z = 1000; // Set the camera further away from the Sun
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            const container = document.getElementById('solar-system-container');
            if (container) container.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            const light = new THREE.PointLight(0xffffff, 1, 1000);
            light.position.set(0, 0, 0);
            scene.add(light);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.2;
            controls.screenSpacePanning = true;
            controls.minDistance = 100;
            controls.maxDistance = 50000;
            controlsRef.current = controls;

            // Add the starfield background
            createStarfield(scene);

            const animate = () => {
                requestAnimationFrame(animate);

                // Rotate the starfield for a parallax effect
                if (starFieldRef.current) {
                    starFieldRef.current.rotation.x += 0.0001;
                    starFieldRef.current.rotation.y += 0.0001;
                }

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

    useEffect(() => {
        if (planetData.length > 0 && sceneRef.current) {
            const updatedPaths = { ...orbitPaths };

            planetData.forEach((planet) => {
                if (planet.name === "Sun") return; // Skip the Sun

                const planetMesh = sceneRef.current.getObjectByName(planet.name);
                if (planetMesh) {
                    const currentPosition = planetMesh.position.clone();

                    // Add the current position to the orbit path
                    if (!updatedPaths[planet.name]) {
                        updatedPaths[planet.name] = [];
                    }
                    updatedPaths[planet.name].push(currentPosition);

                    // Dynamically calculate the maximum trail length
                    const maxTrailLength = Math.max(1000, planet.orbitalPeriod * 10); // Example logic
                    if (updatedPaths[planet.name].length > maxTrailLength) {
                        updatedPaths[planet.name].shift(); // Remove the oldest point
                    }
                }
            });

            setOrbitPaths(updatedPaths);
        }
    }, [planetData]);

    useEffect(() => {
        if (sceneRef.current) {
            // Clear existing orbit lines
            sceneRef.current.children = sceneRef.current.children.filter(
                (child) => !child.isLine
            );

            // Render new orbit lines
            Object.keys(orbitPaths).forEach((planetName) => {
                const points = orbitPaths[planetName];

                if (points.length > 1) {
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
                    const orbitLine = new THREE.Line(geometry, material);
                    orbitLine.name = `${planetName}-orbit`;
                    sceneRef.current.add(orbitLine);
                }
            });
        }
    }, [orbitPaths]);


    const closeModal = () => {
        setSelectedPlanet(null);
    };

    const centreCameraOnPlanet = (planetName) => {
        const planetMesh = sceneRef.current.getObjectByName(planetName);
        if (!planetMesh) return;

        const targetPosition = planetMesh.position.clone();
        const camera = cameraRef.current;

        // Add an offset to the camera position for better framing
        const cameraOffset = new THREE.Vector3(0, 0, 300); // Adjust the Z-offset as needed
        const finalPosition = targetPosition.clone().add(cameraOffset);

        // Smoothly animate the camera to the planet position
        const duration = 1.5; // Animation duration in seconds
        const easing = (t) => t * t * (3 - 2 * t); // Cubic easing function for smooth transitions
        const startPos = camera.position.clone();
        const startTime = performance.now();

        const animateCamera = () => {
            const elapsedTime = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsedTime / duration, 1);
            const easedT = easing(t); // Apply easing

            // Interpolate camera position
            camera.position.lerpVectors(startPos, finalPosition, easedT);

            // Adjust the controls target to follow the camera
            controlsRef.current.target.lerp(targetPosition, easedT);

            controlsRef.current.update();

            if (t < 1) {
                requestAnimationFrame(animateCamera);
            }
        };

        animateCamera();
    };

    const focusOnPluto = () => {
        const plutoMesh = sceneRef.current.getObjectByName("Pluto");
        if (plutoMesh) {
            centreCameraOnPlanet(plutoMesh);
        }
    };

    useEffect(() => {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            fontRef.current = font;
        });
    }, []);

    useEffect(() => {
        if (planetData.length > 0 && fontRef.current) {
            const scene = sceneRef.current;
            // Remove all objects except the starfield
            scene.children = scene.children.filter((child) => child === starFieldRef.current);

            const sunGeometry = new THREE.SphereGeometry(109 / 5, 64, 64); // Adjust Sun size for better prominence
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
                        lastAngle: 0,
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

        sceneRef.current.add(labelMesh);
    };

    const createPlanetMesh = (planet) => {
        const sizeScale = 200; // Increased size scaling for better visibility
        const positionScale = 5e8; // Adjust position scaling for clearer spacing between planets

        // Define colours for each planet
        const planetColors = {
            "Mercury": 0x888888,
            "Venus": 0xffd700,
            "Earth": 0x0000ff,
            "Mars": 0xff4500,
            "Jupiter": 0xd2691e,
            "Saturn": 0xd2b48c,
            "Uranus": 0x40e0d0,
            "Neptune": 0x00008b, // Neptune color
            "Pluto": 0xa9a9a9, // Pluto color (greyish)
            "Sun": 0xffff00, // Sun's colour
        };

        // Define sizes for each planet
        const planetSizes = {
            "Mercury": 0.38,
            "Venus": 0.95,
            "Earth": 1.0,
            "Mars": 0.53,
            "Jupiter": 11.21,
            "Saturn": 9.45,
            "Uranus": 4.01,
            "Neptune": 3.88, // Neptune size
            "Pluto": 0.18, // Pluto is much smaller than other planets
            "Sun": 109.0, // Scaled size of the Sun
        };

        const geometry = new THREE.SphereGeometry(
            Math.max(planet.radius / sizeScale * planetSizes[planet.name], 1), // Increased size scaling
            64,  // Increased detail for a clearer sphere
            64   // Increased detail for a clearer sphere
        );

        let material;

        // Special case for Sun to make it bigger and glow
        if (planet.name === "Sun") {
            material = new THREE.MeshBasicMaterial({
                color: planetColors[planet.name],
                emissive: 0xffff00, // Sun's glowing yellow light
                emissiveIntensity: 1.5, // Increase the glow intensity
            });
        } else {
            material = new THREE.MeshBasicMaterial({
                color: planetColors[planet.name],
                emissive: planet.name === "Neptune" ? 0x0000ff : 0x000000, // Make Neptune brighter
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = planet.name;

        // Position planets based on their actual distance, scaled down
        mesh.position.set(
            planet.x / positionScale,
            planet.y / positionScale,
            planet.z / positionScale
        );

        // Make Neptune slightly bigger for better visibility
        if (planet.name === "Neptune") {
            mesh.scale.set(1.2, 1.2, 1.2); // Increase Neptune's size a bit more
        }

        return mesh;
    };

    const handleSpeedChange = (event) => {
        const newSpeed = Number(event.target.value);
        setSpeed(newSpeed);
        socketRef.current.emit('adjust_speed', { speed: newSpeed });
    };

    const handleSimulationToggle = () => {
        const socket = socketRef.current;
        if (isPaused) {
            socket.emit('start_simulation'); // Resume simulation
        } else {
            socket.emit('stop_simulation'); // Pause simulation
        }
        setIsPaused(!isPaused); // Toggle pause state
    };

    const handlePlanetClick = (planetName) => {
        // Find the full planet object from planetData
        const selectedPlanetObject = planetData.find((planet) => planet.name === planetName);
        setSelectedPlanet(selectedPlanetObject); // Set the full planet object
        centreCameraOnPlanet(planetName);
        setIsSidebarOpen(false); // Close sidebar after selecting a planet
    };

    const renderSidebar = () => {
        if (!isSidebarOpen) return null; // Only render if sidebar is open
        const planets = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
        return (
            <div className="sidebar open">
                <h3>Planets</h3>
                <ul>
                    {planets.map((planet) => (
                        <li
                            key={planet}
                            onClick={() => {
                                handlePlanetClick(planet);
                                setIsSidebarOpen(false); // Close sidebar on selection
                            }}
                            style={{
                                fontWeight: selectedPlanet === planet ? 'bold' : 'normal',
                                cursor: 'pointer',
                            }}
                        >
                            {planet}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };



    return (
        <div className="app-container">
            {/* Title */}
            <h1>MOSS</h1>

            {/* Controls Container (Moved to the Right) */}
            <div className="controls-container">
                <p>Date: {date}</p>
                <div className="speed-control">
                    <label>Speed:</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={speed}
                        onChange={handleSpeedChange}
                    />
                </div>
                <button
                    className="simulation-controls"
                    onClick={handleSimulationToggle}
                >
                    {isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                </button>
            </div>

            {/* Sidebar Toggle Button */}
            <button
                className="sidebar-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? 'Close' : 'Planets'}
            </button>

            {/* Render the Sidebar */}
            {renderSidebar()}

            {/* Solar System Container */}
            <div id="solar-system-container"></div>

            {/* Render the modal if a planet is selected */}
            {selectedPlanet && (
                <PlanetModal
                    planet={selectedPlanet}
                    onClose={() => setSelectedPlanet(null)}
                />
            )}
        </div>
    );
};

export default SolarSystem;