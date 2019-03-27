const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const rimraf = require('rimraf');
const { alias, foldersToIgnore } = require('./config.json');

/**
 * Delete directory
 * @param  {string} dirPath path to dir
 */
async function deleteDirectory(dirPath) {
	return new Promise(resolve => {
		if (doesDirHaveChildDirs(dirPath)) {
			resolve(dirPath);
		} else {
			rimraf(dirPath, () => resolve());
		}
	});
}
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

		const cleanImport = cleanseImport(found);
		foundImports.push(cleanImport);
		return getNextMatchingImport(nextStringToCheck, foundImports);
	} else {
		return foundImports;
	}
}

/**
 * Returns a clean import string
 * @param  {string} importName
 * @return  {string} importName
 */
function cleanseImport(importName) {
	const split = importName.split('/');

	// remove 'import from 'some/file/index.js';
	return split.slice(-1)[0].includes('index') ? `${split.slice(0, -1).join('/')}'` : importName;
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
		} else if (file.endsWith('.js') && !file.includes('spec')) {
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

/**
 * Returns parent directory full path
 * @param  {string} fullFilePath
 * @return {string} parent dir
 */
function getFullParentDir(fullFilePath) {
	const splitPath = fullFilePath.split(path.sep);
	return path.sep + path.join(...splitPath.slice(0, splitPath.length - 1));
}

/**
 * Returns true if DIR has child DIRs
 * @param  {string} filePath
 * @return {bool} has children DIRs or not
 */
function doesDirHaveChildDirs(filePath) {
	const isDirectory = source => fs.lstatSync(source).isDirectory();
	const dirs = fs
		.readdirSync(filePath)
		.map(name => path.join(filePath, name))
		.filter(isDirectory);

	return dirs.length > 0;
}

module.exports = {
	getFullParentDir,
	deleteDirectory,
	newProgressBar,
	getJsFilesFromDir,
	getParentDir,
	checkIfImportIsUsedInFiles
};
