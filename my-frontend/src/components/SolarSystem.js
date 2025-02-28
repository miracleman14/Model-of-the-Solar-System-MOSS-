import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/SolarSystem.css';
import PlanetModal from './PlanetModal';
import Labels from './Labels';
import Starfield from './Starfield';
import Planet from './Planet';
import Orbit from './Orbit';
import useFetchPlanets from '../hooks/useFetchPlanets';
import useSocket from '../hooks/useSocket';
import { createCelestialBodyMesh, createStarfield, updateCometTrail } from '../utils/helpers';
import { moon_data } from '../utils/constants'; // Make sure this is imported!
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import PlanetCreationForm from './PlanetCreationForm';



const SolarSystem = () => {
    const { planetData, date, isPaused, handleSimulationToggle } = useFetchPlanets();
    const { socket, emitEvent, onEvent, timeInterval } = useSocket('http://localhost:5000');
    const [speed, setSpeed] = useState(1);
    const [selectedPlanet, setSelectedPlanet] = useState(null);
    const [orbitPaths, setOrbitPaths] = useState({});
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const isSceneInitializedRef = useRef(false);
    const timeRef = useRef(0);
    const controlsRef = useRef(null);
    const fontRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const positionScale = 1e9;
    const moonDistanceScale = 1e7;  // Base scale
    const jupiterMoonScale = 5e8;   // Jupiter-specific scale
    const earthMoonDistanceScale = 5e7; // Earth-specific scale
    const cometDistanceScale = 1e9; // Scale for comet positions
    const [completedOrbits, setCompletedOrbits] = useState({});
    const [orbitAngles, setOrbitAngles] = useState({}); // Track angular progress around orbit
    const [showOrbitLines, setShowOrbitLines] = useState(true); // State to toggle orbit lines
    // Reference for Halley's comet velocity
    const cometVelocityRef = useRef(new THREE.Vector3());
    // Reference for last comet position to calculate velocity
    const lastCometPositionRef = useRef(null);

    // Add a ref to store initial planet positions
    const initialPlanetPositionsRef = useRef({});


    // Function to calculate the distance between two 3D points
    const calculateDistance = (pos1, pos2) => {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    };

    const handleCreatePlanet = (newPlanet) => {
        // Emit the new planet data to the backend
        emitEvent('create_planet', newPlanet);
    };

    useEffect(() => {
        if (!isSceneInitializedRef.current) {
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            createStarfield(scene);

            const camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                1,
                1e12
            );
            camera.position.z = 2500;
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1;
            renderer.outputColorSpace = THREE.SRGBColorSpace;

            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            const container = document.getElementById('solar-system-container');
            if (container) container.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            const composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5,
                10,
                0.85
            );
            composer.addPass(bloomPass);

            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            scene.add(ambientLight);

            const sunLight = new THREE.PointLight(0xffffff, 5, 0, 2);
            sunLight.position.set(0, 0, 0);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.bias = -0.001;
            scene.add(sunLight);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.screenSpacePanning = true;
            controls.minDistance = 10;
            controls.maxDistance = 50000;
            controlsRef.current = controls;

            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();

                const cometMesh = scene.getObjectByName("Halley");
                if (cometMesh && cometVelocityRef.current) {
                    updateCometTrail(cometMesh, cometVelocityRef.current);
                }

                composer.render();
                timeRef.current += speed;
            };
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                composer.setSize(window.innerWidth, window.innerHeight);
            });
            isSceneInitializedRef.current = true;
        }
    }, [speed]);



    useEffect(() => {
        if (planetData.length > 0 && sceneRef.current) {
            const scene = sceneRef.current;

            // Store initial positions when planetData first loads
            if (Object.keys(initialPlanetPositionsRef.current).length === 0) {
                planetData.forEach(body => {
                    initialPlanetPositionsRef.current[body.name] = {
                        x: body.x,
                        y: body.y,
                        z: body.z
                    };
                });
            }

            // Check if Sun exists, if not create. If exists, skip
            let sunMesh = scene.getObjectByName("Sun");
            if (!sunMesh) {
                const sunData = { name: "Sun", x: 0, y: 0, z: 0 };
                sunMesh = createCelestialBodyMesh(sunData, positionScale, moonDistanceScale);
                scene.add(sunMesh);
            }

            planetData.forEach((body) => {
                //Skip Sun
                if (body.name === "Sun") return;

                let bodyMesh = scene.getObjectByName(body.name);

                // Special case for Halley's comet
                const isComet = body.name === "Halley";
                const scale = isComet ? cometDistanceScale : positionScale;

                if (!bodyMesh) {
                    bodyMesh = createCelestialBodyMesh(body, scale, moonDistanceScale);
                    bodyMesh.name = body.name;
                    scene.add(bodyMesh);

                    // Initialize last position for comet velocity calculation
                    if (isComet) {
                        lastCometPositionRef.current = new THREE.Vector3(
                            body.x / scale,
                            body.y / scale,
                            body.z / scale
                        );
                    }
                } else {
                    // --- CORRECTED MOON CHECK ---
                    if (moon_data[body.name]) {  // Use moon_data to identify moons!
                        const parent = planetData.find(p => moon_data[body.name]?.parent === p.name);
                        if (parent) {
                            const parentMesh = scene.getObjectByName(parent.name);
                            if (parentMesh) {
                                const parentRadius = parentMesh.userData.scaledRadius;
                                const parentX = parent.x / positionScale;
                                const parentY = parent.y / positionScale;
                                const parentZ = parent.z / positionScale;
                                const moonRadius = bodyMesh.userData.scaledRadius;

                                // Use separate scales
                                let scale = moonDistanceScale; // Default scale
                                if (parent.name === "Jupiter") {
                                    scale = jupiterMoonScale;
                                } else if (parent.name === "Earth") {
                                    scale = earthMoonDistanceScale; // Use Earth-specific scale
                                }

                                let relativeX = (body.x - parent.x) / scale;
                                let relativeY = (body.y - parent.y) / scale;
                                let relativeZ = (body.z - parent.z) / scale;

                                let distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY + relativeZ * relativeZ);
                                let desiredDistance = parentRadius + moonRadius;
                                desiredDistance *= 5.0;
                                // --- ADJUSTMENTS (after basic desiredDistance) ---

                                if (distance > 0) {
                                    relativeX /= distance;
                                    relativeY /= distance;
                                    relativeZ /= distance;
                                }

                                relativeX *= desiredDistance;
                                relativeY *= desiredDistance;
                                relativeZ *= desiredDistance;

                                bodyMesh.position.set(
                                    parentX + relativeX,
                                    parentY + relativeY,
                                    parentZ + relativeZ
                                );
                            } else {
                                console.warn(`Parent planet mesh not found for moon: ${body.name}`);
                            }
                        } else {
                            console.warn(`Parent planet not found for moon: ${body.name}`);
                        }
                    } else if (isComet) {
                        // Special handling for comet
                        const newPosition = new THREE.Vector3(
                            body.x / scale,
                            body.y / scale,
                            body.z / scale
                        );

                        // Calculate velocity for the comet trail orientation
                        if (lastCometPositionRef.current) {
                            cometVelocityRef.current.subVectors(newPosition, lastCometPositionRef.current);
                        }

                        bodyMesh.position.copy(newPosition);
                        lastCometPositionRef.current = newPosition.clone();
                    } else {
                        // Regular planet. Scale by positionScale.
                        bodyMesh.position.set(
                            body.x / positionScale,
                            body.y / positionScale,
                            body.z / positionScale
                        );
                    }
                }

                const bodyName = body.name;
                const position = new THREE.Vector3(body.x, body.y, body.z);

                // Remove object that are not present.
                for (let i = scene.children.length - 1; i >= 0; i--) {
                    const object = scene.children[i];

                    // Skip non-meshes and the Sun
                    if (object.type !== 'Mesh' || object.name === "Sun") {
                        continue;
                    }

                    // Check for removal of missing bodies (as before)
                    if (!planetData.some(body => body.name === object.name)) {
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                        scene.remove(object);
                        continue; // Important: Skip to the next object
                    }

                    // Duplicate detection and removal
                    if (object.name === bodyName && object !== bodyMesh) {
                        // We have a potential duplicate.  Compare distances to initial position.
                        const currentObjectPosition = { x: object.position.x * positionScale, y: object.position.y * positionScale, z: object.position.z * positionScale };
                        const currentBodyPosition = {x: body.x, y: body.y, z: body.z};


                        const initialPosition = initialPlanetPositionsRef.current[bodyName];
                        if (!initialPosition) {
                            console.warn(`Initial position not found for ${bodyName}`);
                            continue
                        }

                        const distObject = calculateDistance(currentObjectPosition, initialPosition);
                        const distBody = calculateDistance(currentBodyPosition, initialPosition);


                        // If the existing object in the scene is *further* from the initial
                        // position than the current `body` data, then the existing object
                        // is the duplicate and should be removed.
                        if (distObject > distBody) {
                            if (object.geometry) object.geometry.dispose();
                            if (object.material) {
                                if (Array.isArray(object.material)) {
                                    object.material.forEach(material => material.dispose());
                                } else {
                                    object.material.dispose();
                                }
                            }
                            scene.remove(object);
                        }
                    }
                }

                setOrbitPaths((prevOrbitPaths) => {
                    const newOrbitPaths = { ...prevOrbitPaths };

                    // Initialize the path if it doesn't exist
                    if (!newOrbitPaths[bodyName]) {
                        newOrbitPaths[bodyName] = [];
                    }

                    // For Halley's comet, use a different approach to trail length
                    if (bodyName === "Halley") {
                        // Keep fewer points for Halley's orbit but retain its trail
                        const maxCometPoints = 8000; // Fewer points for comet orbit
                        const updatedPath = [...newOrbitPaths[bodyName], position];

                        if (updatedPath.length > maxCometPoints) {
                            // Keep the most recent points for the comet's trail
                            newOrbitPaths[bodyName] = updatedPath.slice(-maxCometPoints);
                        } else {
                            newOrbitPaths[bodyName] = updatedPath;
                        }

                        return newOrbitPaths;
                    }

                    // Check if this orbit is already marked as complete
                    const isOrbitComplete = completedOrbits[bodyName] === true;

                    // If orbit is complete, don't add more points
                    if (isOrbitComplete) {
                        if (newOrbitPaths[bodyName].length < 2) {
                            newOrbitPaths[bodyName] = [position];
                        }
                        return newOrbitPaths;
                    }

                    // For incomplete orbits, add the new position
                    const updatedPath = [...newOrbitPaths[bodyName], position];

                    // Limit path length to prevent memory issues
                    const maxPoints = bodyName.includes('Moon') ? 500 : 1500;
                    if (updatedPath.length > maxPoints) {
                        const newPath = [];
                        const keepFactor = Math.ceil(updatedPath.length / (maxPoints * 0.75));

                        for (let i = 0; i < updatedPath.length; i++) {
                            if (i >= updatedPath.length * 0.8 || i % keepFactor === 0) {
                                newPath.push(updatedPath[i]);
                            }
                        }

                        newOrbitPaths[bodyName] = newPath;
                    } else {
                        newOrbitPaths[bodyName] = updatedPath;
                    }

                    // Calculate orbit completion metrics
                    if (updatedPath.length > 100 && !isOrbitComplete) {
                        const startPoint = updatedPath[0];
                        const endPoint = updatedPath[updatedPath.length - 1];
                        const distToStart = startPoint.distanceTo(endPoint);

                        // Calculate the average radius of the orbit
                        const center = new THREE.Vector3();
                        updatedPath.forEach(point => center.add(point));
                        center.divideScalar(updatedPath.length);
                        const avgRadius = updatedPath.reduce((sum, point) => sum + point.distanceTo(center), 0) / updatedPath.length;

                        // Calculate the total angle traversed
                        const newTotalAngle = updatedPath.reduce((totalAngle, point, index) => {
                            if (index > 0) {
                                const prevPoint = updatedPath[index - 1];
                                const angle = prevPoint.angleTo(point);
                                return totalAngle + angle;
                            }
                            return totalAngle;
                        }, 0);

                        // Check if the orbit is complete
                        if (newTotalAngle > 2 * Math.PI && distToStart < avgRadius * 0.00005) {
                            // Use 5% of radius instead of 15%
                            console.log(`${bodyName} completed orbit! Angle: ${newTotalAngle}, distToStart: ${distToStart}, avgRadius: ${avgRadius}`);
                            setCompletedOrbits(prev => ({...prev, [bodyName]: true}));
                            // Simplify the path to a reasonable number of points for the final orbit
                            const idealPointCount = bodyName.includes('Moon') ? 100 : 200;
                            if (updatedPath.length > idealPointCount) {
                                const keepFactor = Math.ceil(updatedPath.length / idealPointCount);
                                const finalPath = [];
                                for (let i = 0; i < updatedPath.length; i += keepFactor) {
                                    finalPath.push(updatedPath[i]);
                                }
                                newOrbitPaths[bodyName] = finalPath;
                            }
                        }
                    }

                    return newOrbitPaths;
                });
            });
        }
    }, [planetData, positionScale, moonDistanceScale, jupiterMoonScale, earthMoonDistanceScale, cometDistanceScale, completedOrbits, orbitAngles]);

    // Function to reset orbits and start fresh, in case you need to clear everything
    const resetOrbits = () => {
        setOrbitPaths({});
        setCompletedOrbits({});
        setOrbitAngles({});
    };

    const closeModal = () => {
        setSelectedPlanet(null);
    };

    const centreCameraOnPlanet = (planetName) => {
        const planetMesh = sceneRef.current.getObjectByName(planetName);
        if (!planetMesh) return;

        const targetPosition = planetMesh.position.clone();
        const camera = cameraRef.current;

        // Calculate the camera distance based on the planet's size
        const planetSize = planetMesh.geometry.boundingSphere.radius;
        const cameraDistance = planetSize * 10; // Adjust the multiplier as needed

        // Add an offset to the camera position for better framing
        const cameraOffset = new THREE.Vector3(0, 0, cameraDistance);
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

    const handleSpeedChange = (event) => {
        const newSpeed = Number(event.target.value);
        setSpeed(newSpeed);
        emitEvent('adjust_speed', { speed: newSpeed }); // Emit speed change to the server
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
        // Include Halley in the list of selectable bodies
        const planets = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Moon", "Io", "Europa", "Ganymede", "Callisto", "Halley"];
        return (
            <div>
                Planets
                {planets.map((planet) => (
                    <div
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
                    </div>
                ))}
            </div>
        );
    };

    const toggleOrbitLines = () => {
        setShowOrbitLines(prevShowOrbitLines => !prevShowOrbitLines);
    };

    return (
        <>
            <div>MOSS</div>
            <div>
                Date: {date} ({timeInterval})
                <br />
                Speed:
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={speed}
                    onChange={handleSpeedChange}
                />
                <button onClick={handleSimulationToggle}>
                    {isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                </button>
                <button onClick={toggleOrbitLines}>
                    {showOrbitLines ? 'Hide Orbit Lines' : 'Show Orbit Lines'}
                </button>
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? 'Close' : 'Planets'}
            </button>
            {renderSidebar()}
            <div id="solar-system-container"></div>
            {selectedPlanet && <PlanetModal planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />}
            <Labels scene={sceneRef.current} planetData={planetData} font={fontRef.current} />
            <Starfield scene={sceneRef.current} />
            {showOrbitLines && Object.entries(orbitPaths).map(([bodyName, path]) => {
                if (moon_data[bodyName]) {
                    return null;
                }
                const color = bodyName === "Halley" ? 0x88aaff : 0xffffff;
                const opacity = bodyName === "Halley" ? 0.7 : 0.5;

                // Find the planet data to get the trailColor
                const planet = planetData.find(p => p.name === bodyName);
                const trailColor = planet?.trailColor;

                return (
                    <Orbit
                        key={bodyName}
                        orbitPath={path}
                        color={color}
                        opacity={opacity}
                        scene={sceneRef.current}
                        positionScale={bodyName === "Halley" ? cometDistanceScale : positionScale}
                        moonDistanceScale={moonDistanceScale}
                        bodyName={bodyName}
                        completedOrbits={completedOrbits}
                        trailColor={trailColor} // Pass the trailColor prop
                    />
                );
            })}
            <PlanetCreationForm onCreatePlanet={handleCreatePlanet} />
        </>
    );
};

export default SolarSystem;