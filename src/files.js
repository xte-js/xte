const fs = require('fs');

function readFile(filename, from) {
	try {
		return fs.readFileSync(filename, 'utf8');
	} catch (e) {
		console.error(`Cannot find file '${filename}', used in '${from}'`);
		process.exit(1);
	}
}

function writeFile(filename, data) {
	try {
		return fs.writeFileSync(filename, data, 'utf8');
	} catch (e) {
		console.error(`Cannot write file '${filename}'`);
		process.exit(1);
	}
}

module.exports = {
	readFile,
	writeFile,
};
