import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const OrbitSimulation = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const planetsRef = useRef([]);

    // State for planet data
    const [planetData, setPlanetData] = useState(null);

    // Fetch planet positions from backend
    useEffect(() => {
        const fetchPlanetData = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/positions');
                const data = await response.json();
                setPlanetData(data);
            } catch (error) {
                console.error('Error fetching planet data:', error);
            }
        };

        fetchPlanetData();
        const intervalId = setInterval(fetchPlanetData, 1000); // Update positions every second

        return () => clearInterval(intervalId);
    }, []);

    // Set up the scene, camera, renderer, and objects
    useEffect(() => {
        if (!mountRef.current) return;

        // Set up scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        // Set up camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 150, 400);

        // Set up renderer
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Add Sun
        const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Store references
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        // Handle window resize
        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    // Add planets and update animation
    useEffect(() => {
        if (!planetData || !sceneRef.current) return;

        const scene = sceneRef.current;

        // Clear existing planets
        planetsRef.current.forEach(({ mesh, label, orbit }) => {
            scene.remove(mesh);
            scene.remove(label);
            scene.remove(orbit);
        });
        planetsRef.current = [];

        // Create planets, labels, and orbits
        Object.entries(planetData).forEach(([planet, data], index) => {
            const color = new THREE.Color(`hsl(${(index * 40) % 360}, 70%, 50%)`);

            // Planet mesh
            const geometry = new THREE.SphereGeometry(5, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(data.calculated_position[0] / 100, 0, data.calculated_position[1] / 100);
            scene.add(mesh);

            // Label
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 256;
            labelCanvas.height = 64;
            const context = labelCanvas.getContext('2d');
            context.fillStyle = 'white';
            context.font = '24px Arial';
            context.fillText(planet.toUpperCase(), 10, 40);
            const texture = new THREE.CanvasTexture(labelCanvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const label = new THREE.Sprite(spriteMaterial);
            label.position.set(mesh.position.x, mesh.position.y + 10, mesh.position.z);
            scene.add(label);

            // Orbital path
            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
                new THREE.CircleGeometry(data.orbital_distance / 100, 64).attributes.position.array
            );
            const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
            const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2; // Align with the horizontal plane
            scene.add(orbit);


            planetsRef.current.push({ mesh, label, orbit, distance: data.orbital_distance / 100, speed: data.orbital_speed || 0.01, angle: 0 });
        });

        // Add light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        scene.add(ambientLight, pointLight);

        // Animate planets
        const animate = () => {
            requestAnimationFrame(animate);

            planetsRef.current.forEach((planetInfo) => {
                planetInfo.angle += planetInfo.speed;
                planetInfo.mesh.position.x = planetInfo.distance * Math.cos(planetInfo.angle);
                planetInfo.mesh.position.z = planetInfo.distance * Math.sin(planetInfo.angle);

                planetInfo.label.position.set(planetInfo.mesh.position.x, planetInfo.mesh.position.y + 10, planetInfo.mesh.position.z);
            });

            rendererRef.current.render(scene, cameraRef.current);
        };

        animate();
    }, [planetData]);

    return <div ref={mountRef} />;
};

export default OrbitSimulation;
