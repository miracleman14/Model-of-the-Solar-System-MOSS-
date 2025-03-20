// utils/helpers.js
import * as THREE from 'three';

// Define planet sizes (relative scaling factors)
const PLANET_SIZES = {
    "Mercury": 0.383,   // Mercury's radius is ~38.3% of Earth's
    "Venus": 0.949,     // Venus's radius is ~94.9% of Earth's
    "Earth": 1.0,       // Earth is the baseline (1.0)
    "Mars": 0.532,      // Mars's radius is ~53.2% of Earth's
    "Jupiter": 11.21,   // Jupiter's radius is ~11.21 times Earth's
    "Saturn": 9.45,     // Saturn's radius is ~9.45 times Earth's
    "Uranus": 4.01,     // Uranus's radius is ~4.01 times Earth's
    "Neptune": 3.88,    // Neptune's radius is ~3.88 times Earth's
    "Pluto": 0.186,     // Pluto's radius is ~18.6% of Earth's
    "Sun": 109.0,       // Sun's radius is ~109 times Earth's
    "Halley": 0.0008,   // Halley's radius is ~0.08% of Earth's (5.5km)
};

// Define moon sizes (relative scaling factors)
const MOON_SIZES = {
    "Moon": 0.27,       // Moon's radius is ~27% of Earth's
    "Io": 0.28,         // Io's radius is ~28% of Jupiter's
    "Europa": 0.25,     // Europa's radius is ~25% of Jupiter's
    "Ganymede": 0.41,   // Ganymede's radius is ~41% of Jupiter's
    "Callisto": 0.37,   // Callisto's radius is ~37% of Jupiter's
};

// Combine planet and moon sizes
const sizes = { ...PLANET_SIZES, ...MOON_SIZES };

// Define starfield configuration
const STARFIELD_CONFIG = {
    starCount: 5000, // Number of stars
    maxStarSize: 0.3, // Maximum size of a star
    minStarSize: 0.1, // Minimum size of a star
    positionScale: 20000, // Scale for star positions
};

// Define orbit configuration
const ORBIT_CONFIG = {
    trailLengthFactor: 10, // Factor to calculate maximum trail length based on orbital period
    cometTrailFactor: 50, // Longer trail factor for comets
};

// Define global position scales
const positionScale = 1e10; // Scale factor for positioning planets and other celestial bodies

// --- Texture Loading (Corrected Paths) ---
const textureLoader = new THREE.TextureLoader();
const TEXTURES = {
    "Mercury": textureLoader.load('/textures/mercury.jpg'), // Use root-relative paths
    "Venus": textureLoader.load('/textures/venus.jpg'),
    "Earth": textureLoader.load('/textures/earth.jpg'),
    "Mars": textureLoader.load('/textures/mars.jpg'),
    "Jupiter": textureLoader.load('/textures/jupiter.jpg'),
    "Saturn": textureLoader.load('/textures/saturn.jpg'),
    "Uranus": textureLoader.load('/textures/uranus.jpg'),
    "Neptune": textureLoader.load('/textures/neptune.jpg'),
    "Pluto": textureLoader.load('/textures/pluto.jpg'),
    "Sun": textureLoader.load('/textures/sun.jpg'),
    "Moon": textureLoader.load('/textures/moon.jpg'),
    "Io": textureLoader.load('/textures/io.jpg'),
    "Europa": textureLoader.load('/textures/europa.jpg'),
    "Ganymede": textureLoader.load('/textures/ganymede.jpg'),
    "Callisto": textureLoader.load('/textures/callisto.jpg'),
    "Halley": textureLoader.load('/textures/comet.jpg'), // Add a texture for Halley's Comet
    "SaturnRings": textureLoader.load('/textures/saturn_rings.jpg')
};

/**
 * Creates a planet, moon, or comet mesh.
 */
export const createCelestialBodyMesh = (body, positionScale, moonDistanceScale) => {
    const isMoon = body.name.includes("Moon") || body.name in MOON_SIZES;
    const isSun = body.name === "Sun";
    const isComet = body.name === "Halley";
    const isSaturn = body.name === "Saturn"; // Check if the body is Saturn

    // Use the size property for custom planets, fallback to predefined sizes
    let radius = body.size || sizes[body.name] || 1; // Default to 1 if no size is provided

    // Adjust radius for the Sun and comets
    if (isSun) {
        radius = radius / 5; // Scale down the Sun's radius for better visualization
    } else if (isComet) {
        radius = Math.max(radius * 20, 0.2); // Ensure comets are visible
    }

    const geometry = new THREE.SphereGeometry(
        Math.max(radius, 0.1), // Ensure a minimum radius
        isMoon ? 32 : 64,      // Lower resolution for moons
        isMoon ? 32 : 64
    );

    // Use the planet's color if provided, otherwise fallback to predefined textures
    const texture = TEXTURES[body.name] || null;
    const material = createPlanetMaterial(texture, isSun, isComet, body.planetColor);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = body.name;
    mesh.userData.scaledRadius = radius;
    mesh.userData.isComet = isComet;

    // Enable shadows for non-Sun and non-comet objects
    if (!isSun && !isComet) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // Position the mesh
    const distanceScale = isMoon ? moonDistanceScale : positionScale;
    mesh.position.set(
        body.x / distanceScale,
        body.y / distanceScale,
        body.z / distanceScale
    );

    // Add a comet trail if it's a comet
    if (isComet) {
        addCometTrail(mesh);
    }

    // Add rings if it's Saturn
    if (isSaturn) {
        addSaturnRings(mesh, radius);
    }

    return mesh;
};

/**
 * Adds rings to Saturn.
 */
const addSaturnRings = (saturnMesh, planetRadius) => {
    // Define ring dimensions
    const innerRadius = planetRadius * 1.5; // Inner radius of the rings
    const outerRadius = planetRadius * 2.5; // Outer radius of the rings
    const thetaSegments = 64; // Number of segments around the ring

    // Create ring geometry
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);

    // Load the ring texture
    const ringTexture = TEXTURES["SaturnRings"];
    ringTexture.wrapS = THREE.RepeatWrapping;
    ringTexture.wrapT = THREE.RepeatWrapping;
    ringTexture.repeat.set(1, 1); // Adjust texture repetition if needed

    // Create ring material
    const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        side: THREE.DoubleSide, // Render both sides of the ring
        transparent: true,      // Enable transparency
        opacity: 0.8,           // Adjust opacity for a more realistic look
    });

    // Create the ring mesh
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2; // Rotate the ring to align with Saturn's equator
    ringMesh.name = 'saturnRings';

    // Add the ring mesh as a child of Saturn
    saturnMesh.add(ringMesh);
};

/**
 * Creates a material for a planet, moon, or comet.
 */
function createPlanetMaterial(texture, isSun = false, isComet = false, planetColor = '#ffffff') {
    if (isSun) {
        // For the Sun, use MeshBasicMaterial for pure emission
        return new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffcc, // Warm yellow-white color
            toneMapped: false, // Disable tone mapping for brightness
        });
    } else if (isComet) {
        // For comets, add a glowing effect
        return new THREE.MeshStandardMaterial({
            map: texture,
            emissive: 0x88aaff,      // Blue-white glow
            emissiveIntensity: 0.000001,   // Stronger glow than planets
            toneMapped: false,
        });
    } else {
        // For planets, use MeshStandardMaterial and control emissiveness via a texture.
        return new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(planetColor), // Use the provided planet color
            emissive: new THREE.Color(planetColor), // Use the same color for emissive
            emissiveIntensity: 0.02,   // Subtle glow
            toneMapped: false,       // Prevent tone mapping from dimming the emission.
        });
    }
}

/**
 * Adds a particle trail for comets.
 */
const addCometTrail = (cometMesh) => {
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        positions[ix] = -Math.random() * 2;
        positions[ix + 1] = (Math.random() - 0.5) * 0.5;
        positions[ix + 2] = (Math.random() - 0.5) * 0.5;

        const fade = 1 - (i / particleCount);
        colors[ix] = 0.8 + (fade * 0.2);
        colors[ix + 1] = 0.8 + (fade * 0.2);
        colors[ix + 2] = 1.0;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    particleSystem.name = 'cometTrail';
    cometMesh.add(particleSystem);

    return particleSystem;
};

/**
 * Updates the comet trail based on the comet's velocity vector.
 */
export const updateCometTrail = (cometMesh, velocityVector) => {
    const trail = cometMesh.getObjectByName('cometTrail');
    if (!trail) return;

    // Normalize the velocity vector to get direction
    const direction = velocityVector.clone().normalize().multiplyScalar(-1); // Point away from travel direction

    // Rotate the trail to align with the velocity vector
    const up = new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3();
    axis.crossVectors(up, direction).normalize();

    // Compute the angle between up and direction
    const angle = Math.acos(up.dot(direction));

    // Apply the rotation to the trail
    trail.quaternion.setFromAxisAngle(axis, angle);
};

export const animateCameraToPosition = (camera, targetPosition, controls, duration = 1.5) => {
    const easing = (t) => t * t * (3 - 2 * t); // Cubic easing
    const startPos = camera.position.clone();
    const startTime = performance.now();

    const animateCamera = () => {
        const elapsedTime = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsedTime / duration, 1);
        const easedT = easing(t);

        camera.position.lerpVectors(startPos, targetPosition, easedT);
        controls.target.lerp(targetPosition, easedT);
        controls.update();

        if (t < 1) {
            requestAnimationFrame(animateCamera);
        }
    };
    animateCamera();
};

/**
 * Creates a starfield background.
 */
export const createStarfield = (scene) => {
    const { starCount, maxStarSize, minStarSize, positionScale } = STARFIELD_CONFIG;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * positionScale;
        positions[i * 3 + 1] = (Math.random() - 0.5) * positionScale;
        positions[i * 3 + 2] = (Math.random() - 0.5) * positionScale;

        const r = Math.random() * 0.5 + 0.5;
        const g = Math.random() * 0.5 + 0.5;
        const b = Math.random() * 0.5 + 0.5;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;

        sizes[i] = Math.random() * (maxStarSize - minStarSize) + minStarSize;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        transparent: true,
        vertexColors: true,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    starField.isStarfield = true;
    scene.add(starField);
};

/**
 * Calculates the maximum trail length.
 */
export const calculateMaxTrailLength = (orbitalPeriod, isComet = false) => {
    if (isComet) {
        return Math.max(2000, orbitalPeriod * ORBIT_CONFIG.cometTrailFactor);
    }
    return Math.max(1000, orbitalPeriod * ORBIT_CONFIG.trailLengthFactor);
};