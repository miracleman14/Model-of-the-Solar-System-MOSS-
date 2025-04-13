import React from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Controls = ({ scene, camera, renderer }) => {
    const controlsRef = React.useRef(null);

    React.useEffect(() => {
        if (scene && camera && renderer) {
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.2;
            controls.screenSpacePanning = true;
            controls.minDistance = 100;
            controls.maxDistance = 50000;
            controlsRef.current = controls;

            return () => {
                controls.dispose(); // Clean up controls on unmount
            };
        }
    }, [scene, camera, renderer]);

    return null;
};

export default Controls;