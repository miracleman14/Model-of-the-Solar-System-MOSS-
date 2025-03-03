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

### Added Creating Planet Feature
- Allow users to add planets in to simulate 
  - **User inputs constants** User can choose constants from dropdown and view planet in scene
- Users can customise their planet during creation
  - **Colour and trail colour** Users can choose the colour of the trail and the planet

## Ongoing Tasks 20/03/25
- Improving Planet Creation
- Style pages and have a consistent style for simulation
- Add calming backing music
- Improving modal features


---

## Planned Tasks 30/03/25
- Implement time-based progression control for user-defined dates.
- Allow user to go back in time
- Introduce hovering over planet showing some details about planet

---

## Notes
This log will be updated as the project progresses, with each milestone and completed task recorded here for future reference.

---

_Last updated: [03/05/2025]_
