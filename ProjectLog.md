# **Project Log: Model of the Solar System (MOSS)**

This document logs the progress of the Model of the Solar System project, detailing the tasks completed, ongoing tasks, and planned next steps.

---

## **Completed Milestones & Tasks**

**(**29/09/24**) Research**
- Researched planetary data:
  - **Properties**: Mass, velocity, positions, orbit radius.
  - **Orbital Periods**: Duration each planet takes to orbit the sun.

**(**07/10/24**) Environment Setup**
- Set up the development environment:
  - **React Project**: Initialised project using React.
  - **Dependencies**: Installed necessary libraries such as `Three.js` for 3D rendering.

**(**18/11/24**) Ensure simulation start positions are accurate**
- Plotted the Sun, Mercury, and Venus at specific positions and times.

**(**02/12/24**) Basic Orbital Simulation**
- Developed the algorithm to:
  - **Simulate Orbit**: Planets rotate around the sun with respective velocities.
  - **Time Progression**: The simulation rotates gradually as time elapses.

**(**13/01/25**) Speed Control Functionality**
- Added features to control simulation speed:
  - **Increase Speed**: Allows for faster orbit display.
  - **Decrease Speed**: Slows down orbit for slower orbit display.

**(**20/01/25**) Implemented 3D environment**
- Converted simulation to 3D:
  - **Orbit Controls**: Added orbit controls to move camera around
  - **Fixed date**: Fixed issues with date glitching after refresh

**(**03/02/25**) Added basic UI features**
- Added a UI that composes of:
  - **Camera panning on clicked planet**: When planet is clicked the camera will focus on that planet.
  - **Homepage**: Very basic homepage added with start simulation button that works.

**(**20/02/25**) Introduced Halley's comets and moons**
- Added Halley's Comet;
  - **Fetching its starting position** from Horizon data, and ensuring calculations are accurate
- Added Moons;
  - Added Moons for **Earth and Jupiter's** four largest moons, and ensured they rotate around their parent planets.

**(**26/02/25**) Added more styling for system**
- Added Textures for all bodies
  - **Added textures** for Sun, Planets, Moons and Halley's Comet
- Stying to orbits
  - **Orbit Lines**: Incorporated orbit lines for all planets

**(**5/03/25**) Added Creating Planet Feature**
- Allow users to add planets in to simulate
  - **User inputs constants** User can choose constants from dropdown and view planet in scene
- Users can customise their planet during creation
  - **Colour and trail colour** Users can choose the colour of the trail and the planet

**(**25/03/25**) Added Labels and allowed for toggle**
- Added Labels for planets
  - Ensured all bodies, moons, comets and planets have labels
- Added toggle labels button
  - Made sure that labels can be toggled on and off if users please

**(**08/04/25**) Reformatted and fixed issues throughout the code**
- Fixed Issues in code
  - Creating planet issues have been fixed
- Reformatted code
  - Ensured for cleaner comments and easier to understand code

**(**13/04/25**) Styling updates for css**
- Made consistent styling for main js
  - Implemented a consistent and clean css for the solar system page
- Ensured the css between the planet creation makes sense with the solarsystem css
  - Improving user experience

**(**20/04/25**) Frontend Improvements**
- Created About us page
  - Gives more info about project and have made it able to run project
- Ensured project is able to run on mobile and is usable for mobile users
  - Added adjustments to css via media to make sure mobile users can access smoothly

**(**22/04/25**) Unit Tests**
- Completed Unit Tests
  - Completed 7 Unit Tests going through core functions of simulation

**(**23/04/25**) Celestial body logs**
- Log Test for every planet's orbit time

---

## Notes
This log will be updated as the project progresses, with each milestone and completed task recorded here for future reference.

---

_Last updated: [30/04/2025]_