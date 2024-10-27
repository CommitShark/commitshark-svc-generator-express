#!/usr/bin/env node
import git from "simple-git";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import * as yaml from "yaml";

interface ProjectConfig {
  projectName: string;
}

function isValidProjectName(name: string): boolean {
  const projectNameRegex =
    /^(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]{1,50}(?<![_-])$/;
  return projectNameRegex.test(name);
}

async function main() {
  try {
    // Prompt for project details
    const { projectName } = await inquirer.prompt<ProjectConfig>([
      {
        name: "projectName",
        message: "Enter your project name:",
        type: "input",
        validate(input: string) {
          if (isValidProjectName(input)) {
            return true;
          }
          return "Project name is invalid. It should contain only letters, numbers, dashes (-), and underscores (_), with no spaces or special characters. The name cannot start or end with a dash or underscore, and it must be between 1 and 50 characters long.";
        },
        transformer(value) {
          return value.toLowerCase();
        },
      },
    ]);

    // Define repo URL and destination directory
    const templateRepo =
      "https://github.com/CommitShark/express-microservice-biolerplate.git";
    const projectDir = path.join(process.cwd(), projectName);

    // Clone the template repository
    await git().clone(templateRepo, projectDir);

    // Modify `package.json` with project details
    const packageJsonPath = path.join(projectDir, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = `${projectName}-svc`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // List .yaml file paths needing placeholder replacement
    const replaceList = [
      path.join(projectDir, "devspace.yaml"), // Devspace file
      path.join(projectDir, "k8s", "server-service.yaml"), // k8s service declaration
      path.join(projectDir, "k8s", "server.yaml"), // k8s deployment declaration
    ];

    // Modify the `.yaml` files
    for (const replacePath of replaceList) {
      if (await fs.pathExists(replacePath)) {
        const yamlContent = await fs.readFile(replacePath, "utf8");
        const yamlObject = yaml.parse(yamlContent);

        // Convert the YAML object back to a string with replacements
        let updatedYaml = yaml.stringify(yamlObject);
        updatedYaml = updatedYaml.replace(/placeholder/g, projectName);

        // Write the modified YAML content back
        await fs.writeFile(replacePath, updatedYaml, "utf8");
        console.log(`Updated ${replacePath} with project name: ${projectName}`);
      } else {
        console.warn(`No ${replacePath} file found in the project.`);
      }
    }

    // Install dependencies
    console.log("Installing dependencies...");
    execSync("npm install", { stdio: "inherit", cwd: projectDir });

    console.log(
      `Project '${projectName}' created successfully in ${projectDir}`
    );
  } catch (error) {
    console.error("Error creating project:", error);
  }
}

main();
