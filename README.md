# Model of the Solar System

## Project Overview

This repository contains the development of a 3D solar system simulation. The simulation models the planets in orbit around the sun, considering real-time physics for each celestial body, including gravity and orbital mechanics. This project is built using Flask for the backend and React.js for the frontend.

### Features
- **Planetary Simulations:** Models orbits, velocities, and masses based on real-world physics.
- **User Interaction:** Allows users to zoom in/out, adjust the view, and interact with planets.
- **Real-time Updates:** Displays changes in the system's state as planets move based on calculated physics.
- **Physics Engine:** Uses Newtonian mechanics to simulate the interactions between celestial bodies.

## Project Structure

The repository is divided into the following main components:

- `/my-backend`: Contains the Flask-based backend code for the simulation, handling API requests and physics calculations.
- `/my-frontend`: React.js code that renders the solar system simulation and handles user inputs.


The main software artefacts are located in:

-   `/my-backend/src/app.py`: Main Flask application file, SocketIO handlers, API routes.
-   `/my-backend/src/calculations.py`: Core physics calculation logic.
-   `/my-backend/src/constants.py`: Physical constants and initial body data.
-   `/my-frontend/src/components/SolarSystem.js`: The main React component for rendering the 3D scene and managing state.
-   `/my-frontend/src/hooks/`: Custom React hooks for data fetching and WebSocket handling.
-   `/my-frontend/src/utils/`: Helper functions and frontend constants.
-   `/my-frontend/public/`: Textures for celestial bodies

## Getting Started

### Prerequisites
- Python 3.8+ for backend development
- Node.js 14+ for frontend development
- Git

### Installation

1.  **Clone the repository:**
2. **Set up the Backend:**
    ```bash
    cd my-backend

    # Create a virtual environment
    python -m venv venv

    # Activate the virtual environment
    # Windows:
    # venv\Scripts\activate
    # macOS/Linux:
    # source venv/bin/activate
    
   # Install Python dependencies
   # pip install -r requirements.txt
   
3.    **Set up the Frontend:**
      ```bash
      cd my-frontend
      
    # Install Node.js dependencies
    npm install

    
### Running the Application


1.  **Start the Backend Server:**
    ```bash
    cd my-backend/src
    # Make sure your virtual environment is activated
    # source venv/bin/activate # macOS/Linux
    # venv\Scripts\activate # Windows
    python app.py

2.  **Start the Frontend Development Server:**
    Open *another* terminal window.
    ```bash
    cd my-frontend
    npm start

3.  **Access the Simulation:**
    Open your web browser and navigate to `http://localhost:3000`

## Technology Stack

*   **Backend:**
    *   Language: Python 3
    *   Framework: Flask
    *   Real-time Communication: Flask-SocketIO
    *   Astronomy Calculations: Skyfield
    *   HTTP Requests: Requests (for JPL API)
    *   Data Handling: JSON
*   **Frontend:**
    *   Library: React.js
    *   3D Graphics: Three.js
    *   Real-time Communication: socket.io-client
    *   Language: JavaScript
    *   Styling: CSS 
*   **Data Sources:**
    *   JPL Horizons API (for small body data)
    *   NASA/JPL SPICE Ephemeris Files (`.bsp` format, DE440, JUP365)
*   **Core Concepts:**
    *   N-Body Simulation
    *   Velocity Verlet Integration
    *   WebSockets



