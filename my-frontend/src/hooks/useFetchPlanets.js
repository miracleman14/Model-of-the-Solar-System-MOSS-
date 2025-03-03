import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useFetchPlanets = () => {
    const [planetData, setPlanetData] = useState([]);
    const [date, setDate] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [planets, setPlanets] = useState([]); // Add this line
    const socketRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/reset');
            const initialData = await response.json();
            console.log("Initial planet data:", initialData.planets);

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
            setPlanetData(uniqueInitialData);
            setPlanets(uniqueInitialData); // Initialize planets state

            const socket = io('http://localhost:5000');
            socketRef.current = socket;

            socket.emit('start_simulation');

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

                setPlanetData(uniqueData);
                setPlanets(uniqueData); // Update planets state
            });

        } catch (error) {
            console.error('Error fetching planet data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [fetchData]);

    const handleSimulationToggle = useCallback(() => {
        const socket = socketRef.current;
        if (socket) {
            if (isPaused) {
                socket.emit('start_simulation');
            } else {
                socket.emit('stop_simulation');
            }
        }
        setIsPaused(prevIsPaused => !prevIsPaused);
    }, [isPaused]);

    const handleCreatePlanet = (newPlanet) => {
        fetch('http://localhost:5000/create_planet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPlanet),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Planet created:', data);
                setPlanets(prevPlanets => [...prevPlanets, data.planet]); // Update planets state
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return { planetData, date, isPaused, handleSimulationToggle, planets, handleCreatePlanet }; // Return planets and handleCreatePlanet
};

export default useFetchPlanets;