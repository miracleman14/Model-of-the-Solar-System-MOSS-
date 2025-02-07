# Project Log: Model of the Solar System

This document logs the progress of the Model of the Solar System project, detailing the tasks completed, ongoing tasks, and planned next steps.

---

## Completed Tasks

### Research
- Researched planetary data:
  - **Properties**: Mass, velocity, positions, orbit radius.
  - **Orbital Periods**: Duration each planet takes to orbit the sun.

### Environment Setup
- Set up the development environment:
  - **React Project**: Initialised project using React.
  - **Dependencies**: Installed necessary libraries such as `Three.js` for 3D rendering.

### Ensure simulation start positions are accurate
- Plotted the Sun, Mercury, and Venus at specific positions and times.
  
### Basic Orbital Simulation
- Developed the algorithm to:
  - **Simulate Orbit**: Planets rotate around the sun with respective velocities.
  - **Time Progression**: The simulation rotates gradually as time elapses.
  
### Speed Control Functionality
- Added features to control simulation speed:
  - **Increase Speed**: Allows for faster orbit display.
  - **Decrease Speed**: Slows down orbit for slower orbit display.

### Implemented 3D environment
- Converted simulation to 3D:
  - **Orbit Controls**: Added orbit controls to move camera around
  - **Fixed date**: Fixed issues with date glitching after refresh

### Added basic UI features
- Added a UI that composes of:
  - **Camera panning on clicked planet**: When planet is clicked the camera will focus on that planet.
  - **Homepage**: Very basic homepage added with start simulation button that works.

---

## Ongoing Tasks
- Working on improving clickable Functionality
- Ensuring there is a home page to start simulation

---

## Planned Tasks
- Adding harder bodies such as pluto, comets and the moon
- Implement time-based progression control for user-defined dates.
- Allow user to go back in time

---

## Notes
This log will be updated as the project progresses, with each milestone and completed task recorded here for future reference.

---

_Last updated: [01/02/2025]_
