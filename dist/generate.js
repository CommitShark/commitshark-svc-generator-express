#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simple_git_1 = __importDefault(require("simple-git"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const yaml = __importStar(require("yaml"));
function isValidProjectName(name) {
    const projectNameRegex = /^(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]{1,50}(?<![_-])$/;
    return projectNameRegex.test(name);
}
async function main() {
    try {
        // Prompt for project details
        const { projectName } = await inquirer_1.default.prompt([
            {
                name: "projectName",
                message: "Enter your project name:",
                type: "input",
                validate(input) {
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
        const templateRepo = "https://github.com/CommitShark/express-microservice-biolerplate.git";
        const projectDir = path_1.default.join(process.cwd(), projectName);
        // Clone the template repository
        await (0, simple_git_1.default)().clone(templateRepo, projectDir);
        // Remove the existing .git folder to avoid inheriting history
        await fs_extra_1.default.remove(path_1.default.join(projectDir, ".git"));
        // Modify `package.json` with project details
        const packageJsonPath = path_1.default.join(projectDir, "package.json");
        const packageJson = await fs_extra_1.default.readJson(packageJsonPath);
        packageJson.name = `${projectName}-svc`;
        await fs_extra_1.default.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        // List .yaml file paths needing placeholder replacement
        const replaceList = [
            path_1.default.join(projectDir, "devspace.yaml"), // Devspace file
            path_1.default.join(projectDir, "k8s", "server-service.yaml"), // k8s service declaration
            path_1.default.join(projectDir, "k8s", "server.yaml"), // k8s deployment declaration
        ];
        // Modify the `.yaml` files
        for (const replacePath of replaceList) {
            if (await fs_extra_1.default.pathExists(replacePath)) {
                const yamlContent = await fs_extra_1.default.readFile(replacePath, "utf8");
                const yamlObject = yaml.parse(yamlContent);
                // Convert the YAML object back to a string with replacements
                let updatedYaml = yaml.stringify(yamlObject);
                updatedYaml = updatedYaml.replace(/placeholder/g, projectName);
                // Write the modified YAML content back
                await fs_extra_1.default.writeFile(replacePath, updatedYaml, "utf8");
                console.log(`Updated ${replacePath} with project name: ${projectName}`);
            }
            else {
                console.warn(`No ${replacePath} file found in the project.`);
            }
        }
        // Install dependencies
        console.log("Installing dependencies...");
        (0, child_process_1.execSync)("npm install", { stdio: "inherit", cwd: projectDir });
        // Initialize a new Git repository
        console.log("Initializing a new Git repository...");
        const gitRepo = (0, simple_git_1.default)(projectDir);
        await gitRepo.init();
        await gitRepo.add(".");
        await gitRepo.commit("Initial commit");
        console.log(`Project '${projectName}' created successfully in ${projectDir}`);
    }
    catch (error) {
        console.error("Error creating project:", error);
    }
}
main();
