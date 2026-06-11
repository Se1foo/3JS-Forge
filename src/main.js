import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Exporters
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

// Loaders
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// CodeMirror
import { EditorState } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror"

// Custom CodeMirror Theme tied to CSS variables
const customTheme = EditorView.theme({
  "&": {
    color: "var(--syntax-variable)",
    backgroundColor: "transparent"
  },
  ".cm-content": {
    caretColor: "var(--primary)"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--primary)"
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(14, 165, 233, 0.3)"
  },
  ".cm-gutters": {
    backgroundColor: "var(--panel-bg)",
    color: "var(--text-muted)",
    borderRight: "1px solid var(--border)"
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.03)"
  }
}, {dark: true});

const customHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "var(--syntax-keyword)" },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "var(--syntax-variable)" },
  { tag: [t.function(t.variableName), t.labelName], color: "var(--syntax-function)" },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "var(--syntax-function)" },
  { tag: [t.definition(t.name), t.separator], color: "var(--syntax-variable)" },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "var(--syntax-number)" },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "var(--syntax-keyword)" },
  { tag: [t.meta, t.comment], color: "var(--syntax-comment)", fontStyle: "italic" },
  { tag: t.string, color: "var(--syntax-string)" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--syntax-keyword)", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "var(--syntax-keyword)" }
]);

// Editor Setup
const initialCode = `// Add code here
// Assign to 'myObject'

const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const material = new THREE.MeshPhysicalMaterial({ 
    color: 0x3b82f6, 
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 1.0
});

myObject = new THREE.Mesh(geometry, material);`;

let liveUpdateTimeout;
const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    clearTimeout(liveUpdateTimeout);
    liveUpdateTimeout = setTimeout(() => {
      generateFromCode(true); // pass true to indicate silent/live execution
    }, 400); // 400ms debounce
  }
});

const editorState = EditorState.create({
  doc: initialCode,
  extensions: [
    basicSetup,
    keymap.of(defaultKeymap),
    javascript(),
    customTheme,
    syntaxHighlighting(customHighlightStyle),
    updateListener
  ]
})

const editorView = new EditorView({
  state: editorState,
  parent: document.getElementById("code-editor")
})

// State
window.myObject = null; 

// Scene
const container = document.getElementById('viewer');
const scene = new THREE.Scene();

// Grid
const gridHelper = new THREE.GridHelper(20, 40, 0x334155, 0x1e293b);
scene.add(gridHelper);

// Camera
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight1.position.set(5, 10, 7);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0x90b0d0, 0.5);
dirLight2.position.set(-5, 5, -5);
scene.add(dirLight2);

// Clear object
function clearCurrentObject() {
    if (window.myObject) {
        scene.remove(window.myObject);
        window.myObject.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if(Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        window.myObject = null;
    }
}

// Fit camera
function fitCameraToObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.0;
    
    camera.position.set(center.x, center.y + maxDim/2, center.z + cameraZ);
    controls.target.copy(center);
    controls.update();
}

// Run code
function generateFromCode(isSilent = false) {
    const code = editorView.state.doc.toString();
    try {
        const runCode = new Function('THREE', code);
        
        // Only clear if we are about to successfully generate a new one
        // This prevents the screen from going blank if there's a temporary syntax error
        let tempObject = null;
        
        // We override window.myObject locally to test if code works before committing
        const originalObject = window.myObject;
        window.myObject = null; 
        
        runCode(THREE);

        if (window.myObject && (window.myObject.isMesh || window.myObject.isGroup || window.myObject.isObject3D)) {
            tempObject = window.myObject;
        }
        
        if (tempObject) {
            // Restore original object reference so clearCurrentObject can remove it
            window.myObject = originalObject;
            clearCurrentObject();
            
            window.myObject = tempObject;
            scene.add(window.myObject);
        } else {
             // Restore
             window.myObject = originalObject;
             if (!isSilent) alert("Error: 'myObject' is invalid.");
        }
    } catch (error) {
        if (!isSilent) alert("Error:\n" + error.message);
        else console.warn("Live compilation error (ignored):", error.message);
    }
}

// File import
document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    reader.onload = (event) => {
        const contents = event.target.result;
        clearCurrentObject();

        try {
            if (extension === 'obj') {
                const loader = new OBJLoader();
                window.myObject = loader.parse(contents);
                scene.add(window.myObject);
                fitCameraToObject(window.myObject);
            } else if (extension === 'stl') {
                const loader = new STLLoader();
                const geometry = loader.parse(contents);
                const material = new THREE.MeshStandardMaterial({ color: 0x90b0d0, roughness: 0.2 });
                window.myObject = new THREE.Mesh(geometry, material);
                scene.add(window.myObject);
                fitCameraToObject(window.myObject);
            } else if (extension === 'gltf' || extension === 'glb') {
                const loader = new GLTFLoader();
                loader.parse(contents, '', (gltf) => {
                    window.myObject = gltf.scene;
                    scene.add(window.myObject);
                    fitCameraToObject(window.myObject);
                });
            }
        } catch(err) {
            alert("Error: " + err.message);
        }
    };

    if (extension === 'glb') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
    
    e.target.value = '';
});

// Export
document.getElementById('export-btn').addEventListener('click', () => {
    if (!window.myObject) {
        alert("No object to export.");
        return;
    }
    const format = document.getElementById('export-format').value;
    let result;
    let filename = 'model.' + format;
    
    if (format === 'obj') {
        const exporter = new OBJExporter();
        result = exporter.parse(window.myObject);
        downloadBlob(result, filename);
    } else if (format === 'stl') {
        const exporter = new STLExporter();
        result = exporter.parse(window.myObject);
        downloadBlob(result, filename);
    } else if (format === 'gltf') {
        const exporter = new GLTFExporter();
        exporter.parse(
            window.myObject,
            function ( gltf ) {
                downloadBlob(JSON.stringify(gltf, null, 2), filename);
            },
            function ( error ) {
                alert('Error: ' + error);
            }
        );
    }
});

// Download helper
function downloadBlob(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Animate
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Events
document.getElementById('run-btn').addEventListener('click', generateFromCode);

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// Init
generateFromCode();
animate();
