import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';


const useSocket = (url) => {
    const socketRef = useRef(null);
    const [timeInterval, setTimeInterval] = useState("1 day/sec"); // Default to 1 day/sec
    const [createdPlanets, setCreatedPlanets] = useState([]); // Track created planets

    useEffect(() => {
        // Initialize the socket connection
        socketRef.current = io(url);

        // Listen for time interval updates
        socketRef.current.on("time_interval_update", (data) => {
            console.log("Received time interval update:", data.time_interval); // Debug log
            setTimeInterval(data.time_interval); // Update the time interval state
        });

        // Listen for planet creation events
        socketRef.current.on("planet_created", (newPlanet) => {
            console.log("New planet created:", newPlanet); // Debug log
            setCreatedPlanets((prevPlanets) => [...prevPlanets, newPlanet]); // Add the new planet to the list
        });

        // Clean up the socket connection on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [url]);

    const emitEvent = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    const onEvent = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    return { socket: socketRef.current, emitEvent, onEvent, timeInterval, createdPlanets };
};

export default useSocket;