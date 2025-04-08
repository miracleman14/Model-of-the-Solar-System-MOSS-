import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Custom hook for managing socket.io connections
const useSocket = (url) => {
    // Store the socket connection
    const socketRef = useRef(null);

    // Track simulation speed (starts at 0.1 days/second)
    const [timeInterval, setTimeInterval] = useState("0.10 days/second");

    // Keep list of user-created planets
    const [createdPlanets, setCreatedPlanets] = useState([]);

    useEffect(() => {
        // Set up the socket connection when component mounts
        socketRef.current = io(url);

        // Handle speed updates from server
        socketRef.current.on("time_interval_update", (data) => {
            console.log("Simulation speed changed to:", data.time_interval);
            setTimeInterval(data.time_interval);
        });

        // Handle new planet notifications
        socketRef.current.on("planet_created", (newPlanet) => {
            console.log("Added new planet:", newPlanet.name);
            setCreatedPlanets(prev => [...prev, newPlanet]);
        });

        // Clean up socket when component unmounts
        return () => {
            if (socketRef.current) {
                console.log("Closing socket connection");
                socketRef.current.disconnect();
            }
        };
    }, [url]); // Only re-run if URL changes

    // Helper to send events to server
    const emitEvent = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    // Helper to listen for events from server
    const onEvent = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    // Expose what components need
    return {
        socket: socketRef.current,
        emitEvent,
        onEvent,
        timeInterval,
        createdPlanets
    };
};

export default useSocket;