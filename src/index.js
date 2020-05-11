const fs = require('fs');
const path = require('path');
const { Component } = require('./component');
const { readFile, writeFile } = require('./files');

const configFile = path.resolve(process.cwd(), 'xte.cfg.js');
let configCode;
try {
	configCode = fs.readFileSync(configFile, 'utf8');
} catch (e) {
	console.error(`Config file not found`);
	process.exit(1);
}

const config = new Function(configCode)();

const comp = new Component(config.input, readFile(config.input));

const render = comp.render(config.data);
writeFile(config.output, render);
