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
export const createCelestialBodyMesh = (body, positionScale, moonDistanceScale) => { // No need for cometDistanceScale here
    const isMoon = body.name.includes("Moon") || body.name in MOON_SIZES;
    const isSun = body.name === "Sun";
    const isComet = body.name === "Halley";
    const isSaturn = body.name === "Saturn";


    let meshRadius;
    const isPredefined = body.name in sizes; // Check if it's a known body

    if (!isPredefined && body.radius !== undefined && typeof body.radius === 'number') {
        // Convert back to Earth radii for relative scaling
        const earthRadiusMeters = 6371000;
        meshRadius = body.radius / earthRadiusMeters;
        console.log(`Custom planet ${body.name}: Calculated meshRadius ${meshRadius} from body.radius ${body.radius}`);

    } else if (body.radius !== undefined && typeof body.radius === 'number' && body.radius < 1000) {
        // Original check for small radius values (might be redundant if size is preferred)
        meshRadius = body.radius;
    } else if (body.size !== undefined && typeof body.size === 'number' && body.size < 1000) {
        // Use body.size if available (preferred for relative scaling)
        meshRadius = body.size;
    } else if (isPredefined) {
        // Fallback to predefined sizes for known bodies
        meshRadius = sizes[body.name];
    }


    if (meshRadius === undefined) {
        console.warn(`No valid size/radius found for ${body.name}. Defaulting meshRadius to 1.`);
        meshRadius = 1; // Default to 1 Earth radius equivalent
    }


    let visualRadius = meshRadius;
    if (isSun) {
        visualRadius = meshRadius / 5;
    } else if (isComet) {
        visualRadius = Math.max(meshRadius * 20, 0.2);
    }

    const geometry = new THREE.SphereGeometry(
        Math.max(visualRadius, 0.1),
        isMoon ? 32 : 64,
        isMoon ? 32 : 64
    );

    const texture = TEXTURES[body.name] || null;
    const material = createPlanetMaterial(texture, isSun, isComet, body.planetColor);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = body.name;
    mesh.userData.scaledRadius = meshRadius; // Store original relative size
    mesh.userData.isComet = isComet;

    if (!isSun && !isComet) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // --- SIMPLIFIED POSITIONING ---
    // The 'positionScale' argument already contains the correct scale
    // (general positionScale or cometDistanceScale) passed from SolarSystem.js.
    // Moon positioning is handled relatively in SolarSystem.js, so this direct
    // positioning is correct for planets, the sun, and comets when initially created.
    mesh.position.set(
        body.x / positionScale, // Use the 'positionScale' argument directly
        body.y / positionScale,
        body.z / positionScale
    );
    // --- END SIMPLIFIED POSITIONING ---


    if (isComet) {

    }

    if (isSaturn) {
        addSaturnRings(mesh, meshRadius); // Use original meshRadius for ring proportions
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
        return new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffcc,
            toneMapped: false,
        });
    } else if (isComet) {
        return new THREE.MeshStandardMaterial({
            map: texture, // Use texture if available
            color: texture ? 0xffffff : new THREE.Color(planetColor), // Use white if texture, else planetColor
            emissive: 0x88aaff,
            emissiveIntensity: 0.5, // Slightly increased intensity for visibility
            toneMapped: false,
            roughness: 0.9,
            metalness: 0.1,
        });
    } else {
        // For planets/moons
        const effectiveColor = planetColor ? new THREE.Color(planetColor) : new THREE.Color('#ffffff');
        return new THREE.MeshStandardMaterial({
            map: texture, // Apply texture if it exists
            color: effectiveColor, // Base color, visible if no texture or texture has transparency
            emissive: texture ? undefined : effectiveColor, // Only emit if no texture (avoids washing out texture)
            emissiveIntensity: texture ? 0 : 0.05,   // Adjust glow intensity
            roughness: 0.8, // Give non-textured planets some roughness
            metalness: 0.1,
            toneMapped: false, // Usually false is fine for space scenes unless you need specific HDR effects
        });
    }
}




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



