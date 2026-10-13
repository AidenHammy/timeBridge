// We just grab the English-only part of chrono-node and stick it on the window object
// so our content script can use it without messing with ES modules in the browser.
const chrono = require("chrono-node/en");
window.chrono = chrono;