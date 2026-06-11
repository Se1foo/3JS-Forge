# 3JS Forge

3JS Forge is an open-source browser-based tool for creating 3D models with code. Instead of modeling by hand, you write Three.js code to generate geometry, preview it instantly, and export the result to industry-standard formats such as OBJ, GLTF, and STL.

Whether you're experimenting with procedural generation, building assets for games, creating models for 3D printing, or learning Three.js, 3JS Forge provides a fast workflow without requiring a local development setup.

## Features

- **Live Code Editor**: Features CodeMirror 6 with full JavaScript syntax highlighting and intelligent auto-compilation.
- **Instant Preview**: Your Three.js code is compiled and rendered in a robust 3D scene equipped with `OrbitControls` and studio lighting.
- **Import & Export**: 
  - Import existing `.obj`, `.stl`, `.gltf`, or `.glb` models to view.
  - Export your generated shapes back out to `.obj`, `.stl`, or `.gltf` with a single click.
- **Modern Stack**: Built with Vite and Vanilla JS for a lightning-fast development experience.

## Getting Started

To run the project locally, you simply need [Node.js](https://nodejs.org/) installed on your computer.

1. Clone the repository:
   ```bash
   git clone https://github.com/Se1foo/3JS-Forge.git
   ```
2. Navigate into the project folder:
   ```bash
   cd 3JS-Forge
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```

Then, open `http://localhost:5173` in your browser to start coding!

## Usage

1. **Write Code**: Enter standard Three.js geometry and material code in the left panel.
2. **Assign `myObject`**: Make sure you assign your final `THREE.Mesh` or `THREE.Group` to the global `myObject` variable.
3. **Live Update**: The viewer on the right will automatically update 400ms after you stop typing (if your code is valid).
4. **Export**: Pick your desired format from the dropdown and hit **Export Selection** to download your model!
## Live Demo

Try the live demo at https://3-js-forge.vercel.app/.
