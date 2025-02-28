import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useFetchPlanets = () => {
    const [planetData, setPlanetData] = useState([]);
    const [date, setDate] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const socketRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/reset');
            const initialData = await response.json();
            console.log("Initial planet data:", initialData.planets); // Log initial data

            // Filter and deduplicate initial data
            const filteredInitialData = initialData.planets.filter(body => body.name !== "Moon Moon");
            const uniqueInitialData = [];
            const initialNames = new Set();
            for (const body of filteredInitialData) {
                if (!initialNames.has(body.name)) {
                    uniqueInitialData.push(body);
                    initialNames.add(body.name);
                }
            }
            setPlanetData(uniqueInitialData); // Set planet data to the filtered and deduplicated initial state

            const socket = io('http://localhost:5000');
            socketRef.current = socket;

            socket.emit('start_simulation'); // Start the simulation after reset

            socket.on('planet_data', (data) => {
                const truncatedDateString = data.date.substring(0, 23);
                const parsedDate = new Date(truncatedDateString);

                if (!isNaN(parsedDate)) {
                    const ukDate = parsedDate.toLocaleString('en-GB');
                    setDate(ukDate);
                } else {
                    console.error('Invalid date format received:', data.date);
                    setDate('Invalid Date');
                }

                // Filter and deduplicate updated data
                const filteredData = data.planets.filter(body => body.name !== "Moon Moon");
                const uniqueData = [];
                const names = new Set();
                for (const body of filteredData) {
                    if (!names.has(body.name)) {
                        uniqueData.push(body);
                        names.add(body.name);
                    }
                }

                //console.log("Updated planet data:", uniqueData);
                setPlanetData(uniqueData);

                // Debug: Log moon positions (optional, for checking)
                uniqueData.forEach(body => {
                    if(body.name.includes("Moon"))
                        console.log(`Moon ${body.name} position: (${body.x}, ${body.y}, ${body.z})`);
                });
            });


        } catch (error) {
            console.error('Error fetching planet data:', error);
        }
    }, []); // Empty dependency array for useCallback - fetchData doesn't depend on anything outside

    useEffect(() => {
        fetchData();

        // Cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect(); // Clean up socket connection on unmount
            }
        };
    }, [fetchData]); // fetchData is now a dependency

    const handleSimulationToggle = useCallback(() => { // Use useCallback here too
        const socket = socketRef.current;
        if (socket) { // Check if socket exists
            if (isPaused) {
                socket.emit('start_simulation'); // Resume simulation
            } else {
                socket.emit('stop_simulation'); // Pause simulation
            }
        }
        setIsPaused(prevIsPaused => !prevIsPaused); // Toggle pause state - more robust way
    }, [isPaused]); // isPaused is a dependency of handleSimulationToggle


    return { planetData, date, isPaused, handleSimulationToggle };
};

export default useFetchPlanets;