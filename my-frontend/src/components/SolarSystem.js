import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/SolarSystem.css';
import PlanetModal from './PlanetModal';
import Labels from './Labels';
import Starfield from './Starfield';
import Orbit from './Orbit';
import useFetchPlanets from '../hooks/useFetchPlanets';
import useSocket from '../hooks/useSocket';
import { createCelestialBodyMesh, updateCometTrail,} from '../utils/helpers';
import { moon_data } from '../utils/constants'; // Make sure this is imported!
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import PlanetCreationModal from './PlanetCreationModal';


const SolarSystem = () => {
    const { planetData, date, isPaused, handleSimulationToggle, setPlanetData } = useFetchPlanets();
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
    const [createdPlanets, setCreatedPlanets] = useState([]);
    // Add a ref to store initial planet positions
    const initialPlanetPositionsRef = useRef({});
    const [isPlanetCreationModalOpen, setIsPlanetCreationModalOpen] = useState(false);
    const needsUpdateRef = useRef(false); // Ref to track if an update is needed


    // Function to calculate the distance between two 3D points
    const calculateDistance = (pos1, pos2) => {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    };

    const handleCreatePlanet = (newPlanet) => {
        const scaledPlanet = {
            ...newPlanet,
            radius: newPlanet.size * 6371000,
            x: newPlanet.distanceFromSun * 1.496e+11,
            y: 0,
            z: 0
        };

        console.log("Creating new planet:", scaledPlanet);
        emitEvent('create_planet', scaledPlanet);
        setCreatedPlanets(prevPlanets => [...prevPlanets, newPlanet.name]);
        setIsPlanetCreationModalOpen(false);

        socket.once('planet_created', () => {
            console.log("Simulation restarted with the new planet.");
            fetchPlanetData();
        });
    };

    const fetchPlanetData = async () => {
        try {
            const response = await fetch('/api/get-simulation-state');
            const data = await response.json();
            setPlanetData(data.planets); // Use setPlanetData here
            needsUpdateRef.current = true; // Set the update flag
        } catch (error) {
            console.error("Error fetching updated planet data:", error);
        }
    };

    //Effect to handle automatic pausing and resuming.
    useEffect(() => {
        if (needsUpdateRef.current) {
            const initialPauseState = isPaused;
            if (!initialPauseState) {
                handleSimulationToggle();
            }

            const timeout1 = setTimeout(() => {
                if (!initialPauseState)
                    handleSimulationToggle();

                needsUpdateRef.current = false;

            }, 100)

            return () => {
                clearTimeout(timeout1);
            };
        }
    }, [needsUpdateRef.current])


    useEffect(() => {
        if (planetData.length > 0 && sceneRef.current) {
            const scene = sceneRef.current;
            console.log("Planet data loaded:", planetData);

            planetData.forEach((body) => {
                if (body.name === "Sun") return;

                let bodyMesh = scene.getObjectByName(body.name);
                console.log(`Processing planet: ${body.name}`, body);

                if (!bodyMesh) {
                    console.log(`Creating mesh for planet: ${body.name}`);
                    bodyMesh = createCelestialBodyMesh(body, positionScale, moonDistanceScale);
                    bodyMesh.name = body.name;
                    scene.add(bodyMesh);
                    console.log(`Mesh created and added to scene: ${body.name}`, bodyMesh);
                } else {
                    console.log(`Mesh already exists for planet: ${body.name}`, bodyMesh);
                }
            });
        }
    }, [planetData, positionScale, moonDistanceScale]);

    useEffect(() => {
        if (!isSceneInitializedRef.current) {
            const scene = new THREE.Scene();
            sceneRef.current = scene;


            const camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                1,
                1e12
            );
            camera.position.z = 500;
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ antialias: true,
                alpha: true
            });
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

            const ambientLight = new THREE.AmbientLight(0x404040, 10.5);
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



    const centreCameraOnPlanet = (planetName) => {
        const planetMesh = sceneRef.current.getObjectByName(planetName);
        if (!planetMesh) {
            console.warn(`Planet ${planetName} not found in scene`);
            return;
        }

        const targetPosition = planetMesh.position.clone();
        const camera = cameraRef.current;

        // Calculate the camera distance based on the planet's size
        const planetSize = planetMesh.geometry.boundingSphere.radius;
        // Set a minimum camera distance to prevent being too close
        const cameraDistance = Math.max(planetSize * 10, 50);

        console.log(`Centering on ${planetName}, position: ${JSON.stringify(targetPosition)}, size: ${planetSize}`);

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



    const toggleOrbitLines = () => {
        setShowOrbitLines(prevShowOrbitLines => !prevShowOrbitLines);
    };



    return (
        <>
            {/* Main container for the 3D scene */}
            <div id="solar-system-container"></div>

            {/* Controls container */}
            <div className="controls-container">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                </button>
                <div>
                    Date: {date} ({timeInterval})
                    <br/>
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
                    <button onClick={() => setIsPlanetCreationModalOpen(true)}>
                        Create Planet
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <h3>Solar System Bodies</h3>

                {/* Sun */}
                <div className="sidebar-section">
                    <div
                        className="sidebar-item"
                        onClick={() => {
                            handlePlanetClick("Sun");
                            setIsSidebarOpen(false);
                        }}
                        style={{
                            fontWeight: selectedPlanet === "Sun" ? 'bold' : 'normal',
                        }}
                    >
                        Sun
                    </div>
                </div>

                {/* Planets */}
                <div className="sidebar-section">
                    <h4>Planets</h4>
                    {["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].map((planet) => (
                        <div
                            key={planet}
                            className="sidebar-item"
                            onClick={() => {
                                handlePlanetClick(planet);
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                fontWeight: selectedPlanet === planet ? 'bold' : 'normal',
                            }}
                        >
                            {planet}
                        </div>
                    ))}
                </div>

                {/* Earth's Moon */}
                <div className="sidebar-section">
                    <h4>Earth's Moon</h4>
                    <div
                        className="sidebar-item"
                        onClick={() => {
                            handlePlanetClick("Moon");
                            setIsSidebarOpen(false);
                        }}
                        style={{
                            fontWeight: selectedPlanet === "Moon" ? 'bold' : 'normal',
                        }}
                    >
                        Moon
                    </div>
                </div>

                {/* Jupiter's Moons */}
                <div className="sidebar-section">
                    <h4>Jupiter's Moons</h4>
                    {["Io", "Europa", "Ganymede", "Callisto"].map((moon) => (
                        <div
                            key={moon}
                            className="sidebar-item moon-item"
                            onClick={() => {
                                handlePlanetClick(moon);
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                fontWeight: selectedPlanet === moon ? 'bold' : 'normal',
                            }}
                        >
                            {moon}
                        </div>
                    ))}
                </div>

                {/* Comets */}
                <div className="sidebar-section">
                    <h4>Comets</h4>
                    <div
                        className="sidebar-item"
                        onClick={() => {
                            handlePlanetClick("Halley");
                            setIsSidebarOpen(false);
                        }}
                        style={{
                            fontWeight: selectedPlanet === "Halley" ? 'bold' : 'normal',
                        }}
                    >
                        Halley's Comet
                    </div>
                </div>

                {/* User-created Planets */}
                {createdPlanets.length > 0 && (
                    <div className="sidebar-section">
                        <h4>Custom Planets</h4>
                        {createdPlanets.map((planet) => (
                            <div
                                key={planet}
                                className="sidebar-item"
                                onClick={() => {
                                    handlePlanetClick(planet);
                                    setIsSidebarOpen(false);
                                }}
                                style={{
                                    fontWeight: selectedPlanet === planet ? 'bold' : 'normal',
                                }}
                            >
                                {planet}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Planet Creation Modal */}
            <PlanetCreationModal
                isOpen={isPlanetCreationModalOpen}
                onClose={() => setIsPlanetCreationModalOpen(false)}
                onCreatePlanet={handleCreatePlanet}
            />

            {/* Planet Modal - Use the imported component */}
            <PlanetModal
                planet={selectedPlanet} // Pass the selected planet object (must have a .name)
                onClose={() => setSelectedPlanet(null)} // Pass the function to close the modal
            />

            {/* Labels and Starfield */}
            <Labels scene={sceneRef.current} planetData={planetData} font={fontRef.current} />
            <Starfield scene={sceneRef.current} />

            {/* Orbit Lines */}
            {showOrbitLines &&
                Object.entries(orbitPaths).map(([bodyName, path]) => {
                    if (moon_data[bodyName]) {
                        return null;
                    }
                    const color = bodyName === "Halley" ? 0x88aaff : 0xffffff;
                    const opacity = bodyName === "Halley" ? 0.7 : 0.5;

                    // Find the planet data to get the trailColor
                    const planet = planetData.find((p) => p.name === bodyName);
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
                            trailColor={trailColor}
                        />
                    );
                })}
        </>
    );
};

export default SolarSystem;