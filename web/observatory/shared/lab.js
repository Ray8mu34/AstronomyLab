// Compatibility facade for existing integrations. New pure 2D tools import
// core-controls.js and plot.js directly; only 3D consumers import scene.js.
export {assetURL,bindControls,syncControls} from './core-controls.js';
export {plot} from './plot.js';
export {THREE,makeScene} from './scene.js';
