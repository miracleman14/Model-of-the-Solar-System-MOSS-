# Project Log: Model of the Solar System

This document logs the progress of the Model of the Solar System project, detailing the tasks completed, ongoing tasks, and planned next steps.

---

## Completed Tasks

### Research  29/09/24
- Researched planetary data:
  - **Properties**: Mass, velocity, positions, orbit radius.
  - **Orbital Periods**: Duration each planet takes to orbit the sun.

### Environment Setup 07/10/24
- Set up the development environment:
  - **React Project**: Initialised project using React.
  - **Dependencies**: Installed necessary libraries such as `Three.js` for 3D rendering.

### Ensure simulation start positions are accurate 18/11/24
- Plotted the Sun, Mercury, and Venus at specific positions and times.
  
### Basic Orbital Simulation 02/12/24
- Developed the algorithm to:
  - **Simulate Orbit**: Planets rotate around the sun with respective velocities.
  - **Time Progression**: The simulation rotates gradually as time elapses.
  
### Speed Control Functionality 13/01/25
- Added features to control simulation speed:
  - **Increase Speed**: Allows for faster orbit display.
  - **Decrease Speed**: Slows down orbit for slower orbit display.

### Implemented 3D environment 20/01/25
- Converted simulation to 3D:
  - **Orbit Controls**: Added orbit controls to move camera around
  - **Fixed date**: Fixed issues with date glitching after refresh

### Added basic UI features 03/02/25
- Added a UI that composes of:
  - **Camera panning on clicked planet**: When planet is clicked the camera will focus on that planet.
  - **Homepage**: Very basic homepage added with start simulation button that works.

### Introduced Halley's comets and moons 20/02/25
- Added Halley's Comet;
  - **Fetching its starting position** from Horizon data, and ensuring calculations are accurate
- Added Moons;
  - Added Moons for **Earth and Jupiter's** four largest moons, and ensured they rotate around their parent planets.

### Added more styling for system 26/02/25
- Added Textures for all bodies
  - **Added textures** for Sun, Planets, Moons and Halley's Comet
- Stying to orbits
  - **Orbit Lines**: Incorporated orbit lines for all planets
---

## Ongoing Tasks 05/03/25
- Ensure orbit lines have 3D depth and improve them to avoid chopping or overlapping
- Fixing issues with other bodies being added to scene


---

## Planned Tasks 30/03/25
- Implement time-based progression control for user-defined dates.
- Allow user to go back in time
- Allow users to add planets in to simulate (take as input the positions, mass, and size of each planet and, after solving the net gravitational force acting on each planet, and solving for the trajectory)
- Add about/ contact page
- Style pages and have a consistent style for simulation
- Add calming backing music
- Introduce hovering over planet showing some details about planet
- Improving modal features

---

## Notes
This log will be updated as the project progresses, with each milestone and completed task recorded here for future reference.

---

_Last updated: [27/02/2025]_
