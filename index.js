const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { projectPath } = require('./config.json');
const { getJsFilesFromDir, getParentDir, checkIfImportIsUsedInFiles } = require('./helpers');
const welcome = fs.readFileSync('./assets/welcome', 'utf8');

console.log(chalk.blue.bold(welcome));
console.log(chalk.red.bold('press CTRL+C to quit \n'));

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
		const jsFilePaths = getJsFilesFromDir(path.join(projectPath));
		console.log(`${jsFilePaths.length} js files found`);

		const indexFilePaths = jsFilePaths.filter(file => file.endsWith('index.js'));
		const indexImportsToCheck = indexFilePaths.map(file => getParentDir(file));
		console.log(`${indexImportsToCheck.length} index files found`);

		const unusedFiles = indexFilePaths.filter(indexPath => !checkIfImportIsUsedInFiles(jsFilePaths, indexPath));
		console.log(`${unusedFiles.length} unused files found.`);
		unusedFiles.forEach(file => console.log(`${file}`));
	}
});
