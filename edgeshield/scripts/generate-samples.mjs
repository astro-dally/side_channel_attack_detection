import { generateSample, generateTrace } from "../src/simulator.js";

console.log(JSON.stringify({
  benign: generateSample({ mode: "benign", os: "ubuntu", seed: 101 }),
  attack: generateSample({ mode: "attack", os: "fedora", seed: 202 }),
  trace: generateTrace({ mode: "attack", os: "mixed", count: 5, seed: 303 })
}, null, 2));
