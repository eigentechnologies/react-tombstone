

                            _  /)
                          mo / )
                          |/)\)
                            /\_
                            \__|=
                          (    )
                          __)(__
                    _____/      \\_____
                    |  _     _______   ||
                    | | \       |      ||
                    | |  |      |      ||
                    | |_/       |      ||
                    | | \       |      ||
                    | |  \      |      ||
                    | |   \.    | .    ||
                    |                  ||
                    |  React Tombstone ||
                    |                  ||
            *       | *   **    * **   |**      **
            \))ejm97/.,(//,,..,,\||(,,.,\\,.((//

# React Tombstone

## Hunts and destroys any 'zombie' (unused) components within a React project.

### Assumptions
  This project will only work if your components have been added to a folder under a file called `index.js`.

for example:
  `./path/to/my/component/index.js`

## Currently ignores `.spec.js`

will have to see how that performs

### How To Run

Install dependencies

      npm install

Add the full path to your project in:

      config.json

In the root folder run:

      node .

### What it does

- Gets all the JavaScript files in your project
- Creates a list of all the index.js files and gets their parent directory

from:

      ./my/component_folder/index.js

it will grab:

      component_folder

- Goes through all JavaScript files and pulls out the import statements
- Cleans the import statements

#### 1 - remove trailing 'index' from imports

      import MyComponent from 'my/component_folder/index'

becomes

      import MyComponent from 'my/component_folder'


#### 2 - remove alias

      import MyComponent from 'SomeAliasFolder/component_folder'

becomes

      import MyComponent from './full/path/to/component_folder'

#### 3 - remove relative import

      import MyComponent from '.'

becomes

      import MyComponent from './full/path/to/component_folder'


- Next it loops through all import statements checks whether the statement includes our component folder
- It makes a list of all component folders that aren't imported anywhere and sends them for deletion
- Finally it goes and deletes the folders, then repeats the process until there are no unused components.

### Final Note
If there are any folders marked for deletion that contains sub folders it will stop the process and you will have to manually correct and re run.

For example:

        component_folder/
        ├── other_component_folder/
        ├── and_another_component_folder/
        └── index.js

# Next Steps

- add tests