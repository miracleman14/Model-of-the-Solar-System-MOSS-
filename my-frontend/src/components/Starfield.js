import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Constants
const STAR_COUNT = 30000;
const MIN_DISTANCE = 5e11;  // 500 million km
const MAX_DISTANCE = 2e12;  // 2 trillion km
const BASE_SIZE = 1;
const BRIGHT_STAR_CHANCE = 0.01;  // 1% chance to be a bright star
const BRIGHT_STAR_BOOST = 5;
const DISTANCE_BIAS = 3.5;  // Higher = more stars further out
const SIZE_SCALE = 1e10;    // Adjusts star size relative to distance

const Starfield = ({ scene }) => {
    const starsRef = useRef(null);

    useEffect(() => {
        if (!scene || starsRef.current) return;

        // Generate star positions, colors, and sizes
        const positions = new Float32Array(STAR_COUNT * 3);
        const colors = new Float32Array(STAR_COUNT * 3);
        const sizes = new Float32Array(STAR_COUNT);

        for (let i = 0; i < STAR_COUNT; i++) {
            // Position - biased toward outer distances
            const distance = MIN_DISTANCE +
                Math.pow(Math.random(), DISTANCE_BIAS) * (MAX_DISTANCE - MIN_DISTANCE);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = distance * Math.cos(phi);

            // Brightness - few bright stars, many dim ones
            const isBright = Math.random() < BRIGHT_STAR_CHANCE;
            const brightness = isBright ?
                BRIGHT_STAR_BOOST * (0.9 + Math.random() * 0.2) :
                (0.4 + Math.random() * 0.6);

            sizes[i] = BASE_SIZE * brightness;

            // Color - subtle variations
            let r = brightness, g = brightness, b = brightness;

            if (isBright && Math.random() > 0.4) {
                // Slightly blue tint for bright stars
                b *= 1.0 + Math.random() * 0.15;
                r *= 0.9 + Math.random() * 0.05;
            } else if (!isBright && Math.random() > 0.6) {
                // Slightly warm tint for dim stars
                r *= 1.0 + Math.random() * 0.1;
                g *= 0.95 + Math.random() * 0.05;
                b *= 0.85 + Math.random() * 0.1;
            }

            // Clamp values and set color
            colors[i * 3] = Math.min(r, 1.0);
            colors[i * 3 + 1] = Math.min(g, 1.0);
            colors[i * 3 + 2] = Math.min(b, 1.0);
        }

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        // Shaders
        const vertexShader = `
            attribute float size;
            varying vec3 vColor;
            uniform float pointScale;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (pointScale / max(1.0, -mvPosition.z));
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;

            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                float strength = 1.0 - pow(dist * 2.0, 3.0);
                if (strength <= 0.0) discard;
                gl_FragColor = vec4(vColor, strength * 0.9);
            }
        `;

        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: { pointScale: { value: SIZE_SCALE } },
            vertexShader,
            fragmentShader,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
        });

        // Create starfield
        const stars = new THREE.Points(geometry, material);
        stars.name = "Starfield";
        stars.frustumCulled = false;
        scene.add(stars);
        starsRef.current = stars;

        // Cleanup
        return () => {
            if (starsRef.current) {
                scene.remove(starsRef.current);
                starsRef.current.geometry.dispose();
                starsRef.current.material.dispose();
                starsRef.current = null;
            }
        };
    }, [scene]);

    return null;
};

export default Starfield;