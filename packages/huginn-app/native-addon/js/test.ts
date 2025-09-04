import addon from "./index";

const t0 = performance.now();
const result = addon.helloWorld("THIS IS A TEST");
const t1 = performance.now();
console.log(result, t1 - t0);
