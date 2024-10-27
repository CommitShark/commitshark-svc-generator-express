#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
!/usr/bin / env;
node;
const simple_git_1 = __importDefault(require("simple-git"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
async function main() {
    try {
        // Prompt for project details
        const { projectName, description } = await inquirer_1.default.prompt([
            { name: "projectName", message: "Enter your project name:" },
            { name: "description", message: "Enter your project description:" },
        ]);
        // Define repo URL and destination directory
        const templateRepo = "https://github.com/yourusername/your-template-repo.git";
        const projectDir = path_1.default.join(process.cwd(), projectName);
        // Clone the template repository
        await (0, simple_git_1.default)().clone(templateRepo, projectDir);
        // Modify `package.json` with project details
        const packageJsonPath = path_1.default.join(projectDir, "package.json");
        const packageJson = await fs_extra_1.default.readJson(packageJsonPath);
        packageJson.name = projectName;
        packageJson.description = description;
        await fs_extra_1.default.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        // Install dependencies
        console.log("Installing dependencies...");
        (0, child_process_1.execSync)("npm install", { stdio: "inherit", cwd: projectDir });
        console.log(`Project '${projectName}' created successfully in ${projectDir}`);
    }
    catch (error) {
        console.error("Error creating project:", error);
    }
}
main();
