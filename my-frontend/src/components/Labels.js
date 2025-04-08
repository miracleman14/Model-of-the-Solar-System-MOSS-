import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Labels = ({ scene, planets, camera }) => {
    // Store references to our label sprites and their container group
    const labels = useRef({});
    const labelGroup = useRef(null);

    // Configuration for how labels should look and behave
    const config = {
        // Base dimensions for labels (Earth-sized reference)
        baseSpriteWidth: 8,
        baseSpriteHeight: 3,

        // How much labels should scale based on planet size
        referenceRadius: 6371000, // Earth's radius in meters
        minScaleFactor: 0.6,      // Minimum scaling for small planets
        maxScaleFactor: 2.2,      // Maximum scaling for large planets

        // Vertical offset above the planet
        yOffset: 1.9,

        // Text appearance settings
        fontSize: 72,
        fontColor: 'white',
        fontName: 'Arial, Helvetica, sans-serif',
        fontWeight: 'bold',
        padding: 18,

        // Visibility settings
        maxVisibleDistance: 5000, // Labels disappear beyond this distance

        // Fade out when camera gets too close
        closeFadeStart: 100,    // Start fading at this distance
        closeFadeEnd: 25,       // Fully faded at this distance
        minCloseOpacity: 0.2,   // Minimum opacity when very close

        // Minimum opacity when not close (keeps labels readable)
        minFarOpacity: 0.6,

        // Rendering settings
        renderOrder: 100,       // Draw labels on top of other objects
        alphaTest: 0.05,       // Helps with transparent edges
    };

    // Creates a canvas texture with the planet name
    const createTextTexture = (text) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Measure text first to size the canvas properly
        context.font = `${config.fontWeight} ${config.fontSize}px ${config.fontName}`;
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        const textHeight = config.fontSize * 1.2;

        // Set canvas dimensions with padding
        canvas.width = textWidth + config.padding * 2;
        canvas.height = textHeight + config.padding * 2;

        // Redraw the text centered
        context.font = `${config.fontWeight} ${config.fontSize}px ${config.fontName}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = config.fontColor;
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Convert to Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    // Set up the group that will contain all labels
    useEffect(() => {
        if (!scene) return;

        // Find or create the label container group
        let group = scene.getObjectByName('planetLabels');
        if (!group) {
            group = new THREE.Group();
            group.name = 'planetLabels';
            group.renderOrder = config.renderOrder;
            scene.add(group);
        }
        labelGroup.current = group;

        // Clean up when component unmounts
        return () => {
            if (scene && labelGroup.current) {
                removeExistingLabels();
                scene.remove(labelGroup.current);
                labelGroup.current = null;
            }
        };
    }, [scene]);

    // Remove all existing labels from the scene
    function removeExistingLabels() {
        if (labelGroup.current) {
            // Remove in reverse order to avoid array issues
            for (let i = labelGroup.current.children.length - 1; i >= 0; i--) {
                const sprite = labelGroup.current.children[i];
                labelGroup.current.remove(sprite);

                // Clean up textures and materials to prevent memory leaks
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
            }
        }
        labels.current = {};
    }

    // Create or remove labels when planets change
    useEffect(() => {
        if (!scene || !planets || !labelGroup.current) return;

        // Track which planets need labels added or removed
        const currentPlanetNames = new Set(planets.map(p => p.name));
        const existingLabelNames = new Set(Object.keys(labels.current));

        // Add new labels for planets that don't have them
        planets.forEach(planet => {
            if (!existingLabelNames.has(planet.name)) {
                createLabelSprite(planet);
            }
        });

        // Remove labels for planets that are gone
        existingLabelNames.forEach(name => {
            if (!currentPlanetNames.has(name)) {
                removeLabelSprite(name);
            }
        });
    }, [planets, scene, labelGroup.current]);

    // Update label positions and visibility every frame
    useEffect(() => {
        if (!planets || !camera || !labelGroup.current || Object.keys(labels.current).length === 0) {
            return;
        }

        // Reusable vectors to avoid creating new ones each frame
        const tempPosition = new THREE.Vector3();
        const cameraWorldPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraWorldPosition);

        // Make sure our fade distances make sense
        const actualFadeStart = Math.max(config.closeFadeEnd, config.closeFadeStart);
        const actualFadeEnd = config.closeFadeEnd;

        planets.forEach(planet => {
            const planetObj = scene.getObjectByName(planet.name);
            const labelSprite = labels.current[planet.name];

            if (planetObj && labelSprite) {
                // Get the planet's position in world space
                planetObj.getWorldPosition(tempPosition);

                // Calculate how high above the planet to place the label
                const planetMeshRadius = planetObj.geometry?.boundingSphere?.radius || 0.1;
                const planetScaleY = planetObj.scale.y || 1;
                const effectivePlanetRadius = planetMeshRadius * planetScaleY;
                const offset = new THREE.Vector3(0, effectivePlanetRadius * config.yOffset, 0);

                // Position the label above the planet
                labelSprite.position.copy(tempPosition).add(offset);

                // Calculate distance from camera to label
                const distance = cameraWorldPosition.distanceTo(labelSprite.position);

                // Calculate opacity based on distance
                let opacity = 1.0;

                // Fade out when camera gets too close
                if (distance < actualFadeStart) {
                    const fadeAmount = THREE.MathUtils.smoothstep(distance, actualFadeEnd, actualFadeStart);
                    opacity = THREE.MathUtils.lerp(config.minCloseOpacity, opacity, fadeAmount);
                }

                // Ensure labels never get too transparent (unless very close)
                opacity = Math.max(config.minFarOpacity, opacity);

                // Only update if the opacity actually changed
                if (labelSprite.material.opacity !== opacity) {
                    labelSprite.material.opacity = opacity;
                }

                // Hide labels that are too far away or nearly transparent
                const shouldBeVisible = distance < config.maxVisibleDistance && opacity > 0.01;
                if (labelSprite.visible !== shouldBeVisible) {
                    labelSprite.visible = shouldBeVisible;
                }
            }
        });
    });

    // Creates a new label sprite for a planet
    function createLabelSprite(planet) {
        if (!labelGroup.current) return;

        // Create the text texture
        const texture = createTextTexture(planet.name);
        if (!texture) return;

        // Set up the sprite material
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: true, // Makes labels scale with distance
            renderOrder: config.renderOrder,
            alphaTest: config.alphaTest,
            opacity: 1.0
        });

        // Create the sprite and name it for easy reference
        const sprite = new THREE.Sprite(material);
        sprite.name = `label-sprite-${planet.name}`;

        // Scale the label based on planet size
        const planetRadiusMeters = planet.radius || config.referenceRadius;
        let radiusScaleFactor = Math.cbrt(planetRadiusMeters / config.referenceRadius);
        radiusScaleFactor = THREE.MathUtils.clamp(radiusScaleFactor, config.minScaleFactor, config.maxScaleFactor);

        const finalWidth = config.baseSpriteWidth * radiusScaleFactor;
        const finalHeight = config.baseSpriteHeight * radiusScaleFactor;
        sprite.scale.set(finalWidth, finalHeight, 1.0);

        // Add to our label group and store reference
        labelGroup.current.add(sprite);
        labels.current[planet.name] = sprite;
    }

    // Removes a specific label sprite
    function removeLabelSprite(name) {
        const sprite = labels.current[name];
        if (sprite && labelGroup.current) {
            labelGroup.current.remove(sprite);

            // Clean up resources
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();

            // Remove from our tracking object
            delete labels.current[name];
        }
    }

    // This component doesn't render anything itself
    return null;
};

export default Labels;