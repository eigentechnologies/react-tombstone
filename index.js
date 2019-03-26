const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { projectPath } = require('./config.json');
const {
	getJsFilesFromDir,
	getFullParentDir,
	getParentDir,
	deleteDirectory,
	checkIfImportIsUsedInFiles,
	newProgressBar
} = require('./helpers');

const welcome = fs.readFileSync('./assets/welcome', 'utf8');

console.log(chalk.blue.bold(welcome));
console.log(chalk.red.bold('CTRL+C to quit \n'));

const questions = [
	{
		type: 'confirm',
		name: 'target_dir_correct',
		message: `Is this file path correct? ${projectPath}`,
		validate(value) {
			return value.trim() !== '';
		}
	}
];

inquirer.prompt(questions).then(answers => {
	if (answers.target_dir_correct) {
		executeZombies(projectPath);
	}
});

/**
 * Gets unused components, deletes, rinses and repeat
 * @param {string} projectPath path to project js folder
 */
function executeZombies(projectPath) {
	const unusedFiles = getUnused(projectPath);
	unusedFiles.forEach(file => deleteDirectory(getFullParentDir(file)));
}

/**
 * Gets unused components from src directory
 * @param {string} projectPath path to project js folder
 * @return {array} unused files
 */
function getUnused(projectPath) {
	const jsFilePaths = getJsFilesFromDir(path.join(projectPath));
	console.log(`${chalk.green(jsFilePaths.length)} js files found`);

	const indexFilePaths = jsFilePaths.filter(file => file.endsWith('index.js'));
	const indexImportsToCheck = indexFilePaths.map(file => getParentDir(file));
	console.log(`${chalk.yellow(indexImportsToCheck.length)} index files found`);

	const progressBar = newProgressBar();
	progressBar.start(indexImportsToCheck.length, 0);

	const unusedFiles = indexFilePaths.filter(indexPath => {
		const isNotUsed = !checkIfImportIsUsedInFiles(jsFilePaths, indexPath, progressBar);
		progressBar.increment();
		return isNotUsed;
	});

	progressBar.stop();

	console.log(`${unusedFiles.length} unused files found.`);
	unusedFiles.forEach(file => console.log(`${chalk.red(file)}`));
	return unusedFiles;
}
