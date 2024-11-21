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

- `/backend`: Contains the Flask-based backend code for the simulation, handling API requests and physics calculations.
- `/frontend`: React.js code that renders the solar system simulation and handles user inputs.
- `/docs`: Documentation related to the project, including architecture, design decisions, and development notes.
- `/assets`: Static assets for images, textures, and other resources used in the simulation.

The main software artefacts are located in:

- `/backend/` - The main simulation logic that updates the planetary positions.
- `/frontend/src/` - The main React component for rendering the 3D solar system.

## Getting Started

### Prerequisites
- Python 3.8+ for backend development
- Node.js 14+ for frontend development

### Install Dependencies

#### Frontend (React) Dependencies:
1. Navigate to your project’s frontend directory:
   ```bash
   cd my-frontend
Run the following command to install the necessary Node.js dependencies (using npm or yarn):

**Using npm:**
```bash
npm install


npm install
Or if you are using yarn:

yarn install
This will install all the dependencies listed in your package.json file, including:

- @react-three/drei
- react
- axios
- d3
- socket.io-client
- And others.



Backend (Flask) Dependencies:
- Navigate to your backend directory:
- cd my-backend



Create a virtual environment if you haven’t already:
- python -m venv venv
- Activate your virtual environment:


On Windows:
venv\Scripts\activate

On macOS/Linux:
source venv/bin/activate

Install the Python dependencies listed in requirements.txt:
pip install -r requirements.txt

This will install all the backend dependencies, including:

- Flask
- Flask-Cors
- Werkzeug
- Jinja2
- itsdangerous
- And others.


Running the Simulation
Clone the repository:

git clone https://campus.cs.le.ac.uk/gitlab/ug_project/24-25/mn303.git

Set up the backend:

Navigate to the backend directory and run:
python app.py
Set up the frontend:

Navigate to the frontend directory and run:


npm start
Open the simulation in your browser at: http://localhost:3000.

Note: I am intending to make the project accessible via browser link by uploading it to GitHub Pages to make it easier to access.
