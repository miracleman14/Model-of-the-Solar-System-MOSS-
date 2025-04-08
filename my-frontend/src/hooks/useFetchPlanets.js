import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Hook for managing planet data and simulation state
const useFetchPlanets = () => {
    // State for storing planet data
    const [planetData, setPlanetData] = useState([]);

    // Current simulation date
    const [date, setDate] = useState('');

    // Pause state of the simulation
    const [isPaused, setIsPaused] = useState(false);

    // Socket connection reference
    const socketRef = useRef(null);

    // Fetch initial data and set up socket connection
    const fetchData = useCallback(async () => {
        try {
            // Get initial simulation state from server
            const response = await fetch('http://localhost:5000/reset');
            const initialData = await response.json();

            // Set initial planet positions
            setPlanetData(initialData.planets || []);

            // Connect to socket server
            const socket = io('http://localhost:5000');
            socketRef.current = socket;

            // Start the simulation
            socket.emit('start_simulation');

            // Handle incoming planet updates
            socket.on('planet_data', (data) => {
                if (!data?.planets) {
                    console.error("Missing planet data in update");
                    return;
                }

                // Format and set the simulation date
                if (data.date) {
                    const ukDate = new Date(data.date.substring(0, 23))
                        .toLocaleString('en-GB');
                    setDate(ukDate);
                }

                // Filter out any duplicate planets
                const uniquePlanets = [];
                const seenNames = new Set();

                data.planets.forEach(planet => {
                    if (planet?.name && !seenNames.has(planet.name)) {
                        uniquePlanets.push(planet);
                        seenNames.add(planet.name);
                    }
                });

                setPlanetData(uniquePlanets);
            });

            // Handle connection errors
            socket.on('connect_error', (err) => {
                console.error("Connection failed:", err);
            });

        } catch (error) {
            console.error('Failed to initialize simulation:', error);
        }
    }, []);

    // Set up and clean up socket connection
    useEffect(() => {
        fetchData();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [fetchData]);

    // Toggle simulation pause/play
    const handleSimulationToggle = useCallback(() => {
        if (!socketRef.current) {
            console.warn("No active connection");
            return;
        }

        if (isPaused) {
            socketRef.current.emit('start_simulation');
            console.log("Resuming simulation");
        } else {
            socketRef.current.emit('stop_simulation');
            console.log("Pausing simulation");
        }

        setIsPaused(prev => !prev);
    }, [isPaused]);

    return {
        planetData,          // Current planet positions
        date,                // Formatted simulation date
        isPaused,            // Whether simulation is paused
        handleSimulationToggle, // Function to pause/resume
        socket: socketRef.current // Socket instance
    };
};

export default useFetchPlanets;