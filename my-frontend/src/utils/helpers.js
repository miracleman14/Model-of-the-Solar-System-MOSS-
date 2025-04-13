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
    "SaturnRings": textureLoader.load('/textures/saturnmap.jpg')
};

// Creates a 3D object for any space body
export const createCelestialBodyMesh = (body, positionScale) => {
    const isMoon = body.name in MOON_SIZES;
    const isSun = body.name === "Sun";
    const isComet = body.name === "Halley";
    const isSaturn = body.name === "Saturn";

    // Calculate the size
    let size = calculateBodySize(body);

    // Adjust visual size for special cases
    if (isSun) size /= 5;  // Make sun smaller on screen
    if (isComet) size *= 20;  // Make comet nucleus visible

    // Create the sphere shape
    const geometry = new THREE.SphereGeometry(
        Math.max(size, 0.1),  // Never smaller than 0.1 units
        isMoon ? 32 : 64,     // Less detail for moons
        isMoon ? 32 : 64
    );

    // Create the surface appearance
    const material = createPlanetMaterial(
        TEXTURES[body.name],
        isSun,
        isComet,
        body.planetColor
    );

    // Combine shape and appearance
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = body.name;

    // Store useful data for later
    mesh.userData = {
        scaledRadius: size,
        isComet: isComet
    };

    // Most objects cast shadows
    if (!isSun && !isComet) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // Set initial position
    mesh.position.set(
        body.x / positionScale,
        body.y / positionScale,
        body.z / positionScale
    );

    // Add rings to Saturn
    if (isSaturn) {
        addSaturnRings(mesh, size);
    }

    return mesh;
};

// Helper to determine body size
function calculateBodySize(body) {
    // Use custom size if provided
    if (typeof body.size === 'number') {
        return body.size;
    }

    // Convert meters to Earth radii if radius provided
    if (typeof body.radius === 'number') {
        return body.radius / 6371000;
    }

    // Use predefined size for known bodies
    if (body.name in sizes) {
        return sizes[body.name];
    }

    // Default to Earth size if unknown
    console.warn(`Unknown body size for ${body.name}, using default`);
    return 1.0;
}

// Adds rings to Saturn
function addSaturnRings(saturnMesh, planetSize) {
    const innerRadius = planetSize * 1.5;
    const outerRadius = planetSize * 2.5;

    const ringGeometry = new THREE.RingGeometry(
        innerRadius,
        outerRadius,
        64  // Smooth ring edge
    );

    const ringMaterial = new THREE.MeshBasicMaterial({
        map: TEXTURES["SaturnRings"],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;  // Lay flat around Saturn
    rings.name = 'saturnRings';

    saturnMesh.add(rings);
}

// Creates the right material for each body type
function createPlanetMaterial(texture, isSun, isComet, planetColor) {
    const color = new THREE.Color(planetColor || '#ffffff');

    // Sun needs special bright material
    if (isSun) {
        return new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffcc,  // Slightly yellow
            toneMapped: false  // Stay bright
        });
    }

    // Comet gets glowing blue tail
    if (isComet) {
        return new THREE.MeshStandardMaterial({
            map: texture,
            color: texture ? 0xffffff : color,
            emissive: 0x88aaff,  // Blue glow
            roughness: 0.9,
            metalness: 0.1
        });
    }

    // Regular planets and moons
    return new THREE.MeshStandardMaterial({
        map: texture,
        color: color,
        roughness: 0.8,
        metalness: 0.1
    });
}

// Makes comet tail point away from movement direction
export const updateCometTrail = (cometMesh, velocity) => {
    const trail = cometMesh.getObjectByName('cometTrail');
    if (!trail) return;

    // Point trail opposite to movement
    const direction = velocity.clone().normalize().negate();
    const up = new THREE.Vector3(0, 1, 0);

    // Calculate rotation needed
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(up.dot(direction));

    // Apply rotation
    trail.quaternion.setFromAxisAngle(axis, angle);
};


