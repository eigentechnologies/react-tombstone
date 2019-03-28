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
		name: 'dir_correct_1',
		message: `Is this file path correct? ${projectPath}`,
		validate(value) {
			return value.trim() !== '';
		}
	},
	{
		type: 'confirm',
		name: 'dir_correct_2',
		message: `Are you sure? ${projectPath}`,
		validate(value) {
			return value.trim() !== '';
		}
	}
];

inquirer.prompt(questions).then(answers => {
	if (answers.dir_correct_1 && answers.dir_correct_2) {
		if (fs.existsSync(projectPath)) {
			executeZombies(projectPath);
		} else {
			console.log(chalk.bold.red('Project path does not exist, please check the path in `config.json`'));
		}
	}
});

/**
 * Gets unused components, deletes, rinses and repeat
 * @param {string} projectPath path to project js folder
 */
async function executeZombies(projectPath) {
	const unusedFiles = getUnused(projectPath);
	if (unusedFiles.length > 0) {
		const deletePromises = unusedFiles.map(file => deleteDirectory(getFullParentDir(file)));
		const pathsCouldNotDelete = await Promise.all(deletePromises);

		console.log(chalk.bold.red('\nCould not remove the following DIRs as they have child DIRs.\n'));
		pathsCouldNotDelete.filter(path => path).forEach(path => console.log(chalk.yellow(path)));

		// repeat if all deleted successfully
		if (pathsCouldNotDelete.length === 0) {
			console.log(chalk.green('Zombie components removed, searching again...'));
			executeZombies(projectPath);
		}
	}
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
