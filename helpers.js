const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cliProgress = require('cli-progress');

const { alias, foldersToIgnore } = require('./config.json');

/**
 * Returns new progress bar
 * @return {cliProgress.Bar} progress bar
 */
function newProgressBar() {
	const progressBarFormat = {
		barsize: 60,
		clearOnComplete: true,
		hideCursor: true,
		format: `${chalk.cyan(' {bar}')} ${chalk.yellow(`{percentage}%`)} | ETA: ${chalk.yellow(
			`{eta_formatted}`
		)} | ${chalk.yellow('{value}')}/{total}`
	};
	return new cliProgress.Bar(progressBarFormat, cliProgress.Presets.shades_classic);
}
/**
 * Check if import is used in file
 * @param  {array} filesToCheck file paths to check
 * @param  {string} importPathToCheck import path to check if exist
 * @return {boolean} true if used
 */
function checkIfImportIsUsedInFiles(filesToCheck, importPathToCheck) {
	const importNameToCheck = getParentDir(importPathToCheck);

	return filesToCheck.some(file => {
		const fileString = fs.readFileSync(file, 'utf8');
		const importsInFile = getImportsFromFile(fileString, file);
		return importsInFile.some(imp => imp.endsWith(`${importNameToCheck}'`));
	});
}

/**
 * Returns list of imports from file
 * @param  {string} stringToCheck string output of file
 * @param  {string} filePath path of file
 * @return {array} list of sanitised imports in file
 */
function getImportsFromFile(stringToCheck, filePath) {
	const parentDir = getParentDir(filePath);
	const foundImports = getNextMatchingImport(stringToCheck);

	const importsWithParents = foundImports.map(importStr => {
		if (importStr.includes(`'.'`)) {
			return importStr.replace(`'.'`, `'${parentDir}'`);
		} else {
			return importStr;
		}
	});

	const importsWithoutAlias = importsWithParents.map(importStr => replaceAlias(importStr));

	return importsWithoutAlias;
}

/**
 * Replace matching alias if any
 * @param  {string} importString import statement string
 * @return {object} alias with full path
 */
function replaceAlias(importString) {
	const matchingAlias = Object.keys(alias).find(a => importString.includes(`'${a}`));
	if (matchingAlias) {
		return importString.replace(`'${matchingAlias}`, `'${alias[matchingAlias]}`);
	}

	return importString;
}
/**
 * Recursive function that strips imports out of a file
 * @param {string} stringToCheck string output of file
 * @param {array} [foundImports] produced by recursion
 * @return {array} list of found imports in file
 */
function getNextMatchingImport(stringToCheck, foundImports = []) {
	const rx = /(import([\s\S]*?)from([\s\S]*?)[^;]*)/;
	const matches = rx.exec(stringToCheck);

	if (matches) {
		const found = matches[0];
		const nextStringToCheck = stringToCheck.slice(matches.index + found.length);
		foundImports.push(found);
		return getNextMatchingImport(nextStringToCheck, foundImports);
	} else {
		return foundImports;
	}
}

/**
 * lists out paths for a given DIR
 * @param  {string} dir
 * @param {array} [allPaths] optional
 * @return {array} list of file paths
 */
function getJsFilesFromDir(dir, allPaths = []) {
	fs.readdirSync(dir).forEach(file => {
		const fullPath = path.join(dir, file);
		const isDirectory = fs.lstatSync(fullPath).isDirectory();
		const isIgnoredFolder = foldersToIgnore.some(folder => folder === file);

		if (isDirectory && isIgnoredFolder) return;

		if (isDirectory) {
			getJsFilesFromDir(fullPath, allPaths);
		} else if (file.endsWith('.js')) {
			allPaths.push(fullPath);
		}
	});

	return allPaths;
}

/**
 * Returns parent directory
 * @param  {string} fullFilePath
 * @return {string} parent dir
 */
function getParentDir(fullFilePath) {
	return fullFilePath.split(path.sep).slice(-2)[0];
}

module.exports = { newProgressBar, getJsFilesFromDir, getParentDir, checkIfImportIsUsedInFiles };
