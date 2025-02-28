import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const Starfield = ({ scene }) => {
    const starFieldRef = useRef(null);
    const animationRef = useRef(null);
    const celestialBodiesRef = useRef([]);
    const [texturesLoaded, setTexturesLoaded] = useState(false);

    // Performance settings based on platform detection
    const detectPerformanceLevel = () => {
        // Check if running on Linux (may have different GL capabilities)
        const isLinux = navigator.platform &&
            (navigator.platform.toLowerCase().includes('linux') ||
                navigator.userAgent.toLowerCase().includes('linux'));

        // Check if WebGL is fully supported
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const isWebGLFullySupported = gl && gl.getExtension('OES_texture_float');

        // Default to medium if we can't detect
        if (!gl) return 'low';
        if (isLinux && !isWebGLFullySupported) return 'low';
        return 'high';
    };

    useEffect(() => {
        if (!scene || starFieldRef.current) return;

        const performanceLevel = detectPerformanceLevel();

        // Adjust star count based on performance level
        const starCount = performanceLevel === 'high' ? 8000 : 3000;
        const starSize = performanceLevel === 'high' ? 8 : 12; // Larger size for fewer stars

        // Create starfield with improved positioning
        createStarfield(scene, starCount, starSize);

        // Only add solar system on high performance mode
        if (performanceLevel === 'high') {
            createSolarSystem(scene);
        }

        return () => {
            // Clean up all resources
            if (starFieldRef.current) {
                scene.remove(starFieldRef.current);
                starFieldRef.current.geometry.dispose();
                starFieldRef.current.material.dispose();
                if (starFieldRef.current.material.map) {
                    starFieldRef.current.material.map.dispose();
                }
            }

            // Clean up celestial bodies
            celestialBodiesRef.current.forEach(body => {
                scene.remove(body);
                if (body.geometry) body.geometry.dispose();
                if (body.material) {
                    body.material.dispose();
                    if (body.material.map) body.material.map.dispose();
                }
            });

            // Cancel animation frame
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [scene]);

    // Create the starfield with improved distribution
    const createStarfield = (scene, starCount, starSize) => {
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        // Improved star distribution using layered approach
        for (let i = 0; i < starCount; i++) {
            // Create a more realistic distribution with denser areas
            const layerChance = Math.random();
            let radius;

            if (layerChance < 0.7) {
                // Distant stars (majority)
                radius = 15000 + Math.random() * 10000;
            } else if (layerChance < 0.9) {
                // Mid-distance stars
                radius = 8000 + Math.random() * 5000;
            } else {
                // Nearby bright stars (rare)
                radius = 5000 + Math.random() * 3000;
            }

            // Spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions.set([x, y, z], i * 3);

            // Variable star colors based on spectral classification
            // Realistic star color distribution (O, B, A, F, G, K, M)
            const starType = Math.random();
            let r, g, b;

            if (starType < 0.01) {       // O-type (rare, blue)
                r = 0.6 + Math.random() * 0.2;
                g = 0.7 + Math.random() * 0.2;
                b = 1.0;
            } else if (starType < 0.03) { // B-type (blue-white)
                r = 0.7 + Math.random() * 0.2;
                g = 0.8 + Math.random() * 0.2;
                b = 0.9 + Math.random() * 0.1;
            } else if (starType < 0.1) {  // A-type (white)
                r = 0.9 + Math.random() * 0.1;
                g = 0.9 + Math.random() * 0.1;
                b = 0.9 + Math.random() * 0.1;
            } else if (starType < 0.2) {  // F-type (yellow-white)
                r = 1.0;
                g = 0.9 + Math.random() * 0.1;
                b = 0.7 + Math.random() * 0.2;
            } else if (starType < 0.4) {  // G-type (yellow, like our Sun)
                r = 1.0;
                g = 0.9 + Math.random() * 0.1;
                b = 0.5 + Math.random() * 0.2;
            } else if (starType < 0.7) {  // K-type (orange)
                r = 1.0;
                g = 0.7 + Math.random() * 0.2;
                b = 0.2 + Math.random() * 0.3;
            } else {                      // M-type (red)
                r = 0.9 + Math.random() * 0.1;
                g = 0.3 + Math.random() * 0.3;
                b = 0.2 + Math.random() * 0.2;
            }

            colors.set([r, g, b], i * 3);

            // Variable star sizes
            sizes[i] = layerChance < 0.9 ?
                0.5 + Math.random() : // Regular stars
                1.5 + Math.random() * 2; // Brighter stars
        }

        // Create the geometry
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        // Create a fallback texture in case loading fails
        const fallbackTexture = createFallbackStarTexture();

        // Create material with shader for better cross-platform compatibility
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: fallbackTexture },
                baseSize: { value: starSize }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float baseSize;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * baseSize * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Simple circular point without requiring texture
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if (length(coord) > 0.5) discard;
                    
                    // Circular gradient
                    float intensity = 1.0 - length(coord) * 2.0;
                    intensity = pow(intensity, 1.5);
                    
                    gl_FragColor = vec4(vColor, intensity);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
        });

        // Try to load texture for better looking stars if available
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            "/textures/star-glow.png",
            (texture) => {
                starMaterial.uniforms.pointTexture.value = texture;
                setTexturesLoaded(true);
            },
            undefined,
            (err) => {
                console.warn("Star texture failed to load. Using fallback.", err);
                // Already using fallback
            }
        );

        // Create the starfield
        const starField = new THREE.Points(starGeometry, starMaterial);
        scene.add(starField);
        starFieldRef.current = starField;

        // Animate with optimized parallax effect
        const animateStars = () => {
            if (starField) {
                starField.rotation.y += 0.0001; // Slower rotation for more realistic movement
                starField.rotation.x += 0.00002; // Very slight x rotation for added depth
            }

            // Animate celestial bodies
            celestialBodiesRef.current.forEach((body) => {
                if (body.userData && body.userData.animate) {
                    body.userData.animate();
                }
            });

            animationRef.current = requestAnimationFrame(animateStars);
        };

        animateStars();
    };

    // Create a fallback texture procedurally
    const createFallbackStarTexture = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    // Create solar system components
    const createSolarSystem = (scene) => {
        // Create a sun at the center
        const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            emissive: 0xff8800,
            emissiveIntensity: 1
        });

        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        scene.add(sun);
        celestialBodiesRef.current.push(sun);

        // Add glow effect to sun
        const sunGlow = createGlow(sun, 0xff8800, 1.5);
        scene.add(sunGlow);
        celestialBodiesRef.current.push(sunGlow);

        // Create a few planets
        const planets = [
            { radius: 30, distance: 600, color: 0x663300, speed: 0.01 },    // Mercury-like
            { radius: 70, distance: 900, color: 0xffcc99, speed: 0.008 },   // Venus-like
            { radius: 80, distance: 1200, color: 0x6699ff, speed: 0.006 },  // Earth-like
            { radius: 50, distance: 1600, color: 0xff6633, speed: 0.004 },  // Mars-like
            { radius: 150, distance: 2400, color: 0xffcc66, speed: 0.002 }, // Jupiter-like
        ];

        planets.forEach((planetData, index) => {
            const planetGeometry = new THREE.SphereGeometry(planetData.radius, 24, 24);
            const planetMaterial = new THREE.MeshLambertMaterial({ color: planetData.color });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);

            // Set initial position
            const angle = index * (Math.PI * 2 / planets.length);
            planet.position.x = Math.cos(angle) * planetData.distance;
            planet.position.z = Math.sin(angle) * planetData.distance;

            // Add animation data
            planet.userData.angle = angle;
            planet.userData.distance = planetData.distance;
            planet.userData.speed = planetData.speed;
            planet.userData.animate = () => {
                planet.userData.angle += planet.userData.speed * 0.01;
                planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
                planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
                planet.rotation.y += 0.01;
            };

            scene.add(planet);
            celestialBodiesRef.current.push(planet);
        });

        // Add a simple asteroid belt
        createAsteroidBelt(scene, 1800, 200, 300);
    };

    // Create a glow effect for celestial bodies
    const createGlow = (mesh, color, size) => {
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.1 },
                p: { value: 6 },
                glowColor: { value: new THREE.Color(color) },
                viewVector: { value: new THREE.Vector3(0, 0, 0) }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normal);
                    vec3 vNormel = normalize(viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(mesh.geometry.parameters.radius * size, 32, 32),
            glowMaterial
        );

        glow.position.set(
            mesh.position.x,
            mesh.position.y,
            mesh.position.z
        );

        glow.userData.animate = () => {
            if (mesh) {
                glow.position.set(
                    mesh.position.x,
                    mesh.position.y,
                    mesh.position.z
                );
            }
        };

        return glow;
    };

    // Create asteroid belt
    const createAsteroidBelt = (scene, radius, width, count) => {
        const asteroidGeometry = new THREE.SphereGeometry(10, 4, 4);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

        for (let i = 0; i < count; i++) {
            const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

            // Random position within belt
            const angle = Math.random() * Math.PI * 2;
            const distance = radius + (Math.random() * width - width/2);
            asteroid.position.x = Math.cos(angle) * distance;
            asteroid.position.z = Math.sin(angle) * distance;
            asteroid.position.y = (Math.random() - 0.5) * 100; // Some vertical variation

            // Random scale
            const scale = 0.1 + Math.random() * 0.9;
            asteroid.scale.set(scale, scale, scale);

            // Random rotation
            asteroid.rotation.x = Math.random() * Math.PI;
            asteroid.rotation.y = Math.random() * Math.PI;
            asteroid.rotation.z = Math.random() * Math.PI;

            // Animation data
            asteroid.userData.angle = angle;
            asteroid.userData.distance = distance;
            asteroid.userData.speed = 0.001 + Math.random() * 0.002;
            asteroid.userData.rotationSpeed = Math.random() * 0.02;
            asteroid.userData.animate = () => {
                asteroid.userData.angle += asteroid.userData.speed;
                asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
                asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;
                asteroid.rotation.x += asteroid.userData.rotationSpeed;
                asteroid.rotation.y += asteroid.userData.rotationSpeed;
            };

            scene.add(asteroid);
            celestialBodiesRef.current.push(asteroid);
        }
    };

    return null;
};

export default Starfield;