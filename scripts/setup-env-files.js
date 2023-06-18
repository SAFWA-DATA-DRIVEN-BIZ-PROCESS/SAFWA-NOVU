const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');

const prePopulateEnv = async (
  folders,
  folderBasePath,
  exampleEnvFilePath = 'src/.example.env',
  envFilePath = 'src/.env'
) => {
  for (const folder of folders) {
    const exists = fs.existsSync(path.resolve(`${folderBasePath}/${folder}/${envFilePath}`));
    if (!exists) {
      console.log(`Populating ${folderBasePath}/${folder} with .env file`);
      fs.copyFileSync(
        path.resolve(`${folderBasePath}/${folder}/${exampleEnvFilePath}`),
        path.resolve(`${folderBasePath}/${folder}/${envFilePath}`)
      );
    } else {
      console.log(`.env file already exists in ${folderBasePath}/${folder}`);

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Do you want to overwrite ${folderBasePath}/${folder}/${envFilePath}?`,
          default: false,
        },
      ]);

      if (overwrite) {
        console.log(`Overwriting ${folderBasePath}/${folder}/${envFilePath}`);
        fs.copyFileSync(
          path.resolve(`${folderBasePath}/${folder}/${exampleEnvFilePath}`),
          path.resolve(`${folderBasePath}/${folder}/${envFilePath}`)
        );
      }

      console.log(`Skipping ${folderBasePath}/${folder}/${envFilePath}`);
    }
  }
};

(async () => {
  const apps = ['api', 'ws', 'worker'];
  const appsBasePath = `${__dirname}/../apps`;

  console.log('----------------------------------------');
  console.log('Pre-populating .env files from .example.env');

  // ask for exampleEnvFilePath to copy from
  const { exampleEnvFilePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'exampleEnvFilePath',
      message: 'Enter the path to the example .env file to copy from',
      default: 'src/.example.env',
    },
  ]);

  if (!exampleEnvFilePath) {
    prePopulateEnv(apps, appsBasePath);
  } else {
    prePopulateEnv(apps, appsBasePath, exampleEnvFilePath);
  }

  console.log('Finished populating .env files');
  console.log('----------------------------------------');
})();
