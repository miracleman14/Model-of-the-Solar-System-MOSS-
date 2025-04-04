// useFetchPlanets.js
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useFetchPlanets = () => {
    const [planetData, setPlanetData] = useState([]); // Use planetData consistently
    const [date, setDate] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    // Removed: const [planets, setPlanets] = useState([]);
    const socketRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            // Fetch initial state via reset or a dedicated endpoint
            const response = await fetch('http://localhost:5000/reset'); // Or '/api/get-simulation-state'
            const initialData = await response.json();
            console.log("Initial planet data:", initialData.planets);

            // Initial processing (deduplication can happen here or rely on backend)
            setPlanetData(initialData.planets || []); // Set initial state

            // Setup SocketIO connection
            const socket = io('http://localhost:5000');
            socketRef.current = socket;

            // Request simulation start (if not auto-started)
            socket.emit('start_simulation'); // Keep this to trigger the backend loop if needed

            // Listen for simulation updates
            socket.on('planet_data', (data) => {
                if (!data || !data.planets) {
                    console.error("Received invalid planet_data:", data);
                    return;
                }

                // Update Date
                const truncatedDateString = data.date ? data.date.substring(0, 23) : new Date().toISOString();
                const parsedDate = new Date(truncatedDateString);
                if (!isNaN(parsedDate)) {
                    const ukDate = parsedDate.toLocaleString('en-GB');
                    setDate(ukDate);
                } else {
                    console.error('Invalid date format received:', data.date);
                    setDate('Invalid Date');
                }

                // --- Update Planet Data State ---
                // Deduplication can be done here if needed, but backend should ideally send clean data
                const uniqueData = [];
                const names = new Set();
                for (const body of data.planets) {
                    if (body && body.name && !names.has(body.name)) { // Add checks for valid body/name
                        uniqueData.push(body);
                        names.add(body.name);
                    } else if (!body || !body.name) {
                        // console.warn("Received invalid body data:", body);
                    }
                }
                setPlanetData(uniqueData); // Update the state

            });

            // Handle potential errors
            socket.on('connect_error', (err) => {
                console.error("Socket connection error:", err);
            });
            socket.on('error', (err) => {
                console.error("Socket server error:", err);
            });


        } catch (error) {
            console.error('Error fetching initial planet data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Cleanup socket connection on component unmount
        return () => {
            if (socketRef.current) {
                console.log("Disconnecting socket...");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [fetchData]); // Dependencies for useEffect

    // Simulation Pause/Resume Toggle
    const handleSimulationToggle = useCallback(() => {
        const socket = socketRef.current;
        if (socket) {
            if (isPaused) {
                console.log("Emitting start_simulation");
                socket.emit('start_simulation');
            } else {
                console.log("Emitting stop_simulation");
                socket.emit('stop_simulation');
            }
            setIsPaused(prevIsPaused => !prevIsPaused); // Toggle state
        } else {
            console.warn("Socket not connected, cannot toggle simulation.");
        }
    }, [isPaused]); // isPaused is a dependency

    // --- Remove the fetch-based handleCreatePlanet ---
    // const handleCreatePlanet = (newPlanet) => { ... }

    // Return only the necessary state and functions
    // Expose the socket ref if SolarSystem needs to emit events directly
    return {
        planetData,
        date,
        isPaused,
        handleSimulationToggle,
        socket: socketRef.current // Expose socket instance
    };
};

export default useFetchPlanets;