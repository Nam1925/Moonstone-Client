const https = require('https');
const fs = require('fs');
const path = require('path');
try {
    const AdmZip = require('adm-zip');
} catch (e) {
    console.log('adm-zip not found. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install adm-zip', { stdio: 'inherit' });
    console.log('adm-zip installed.');
    const AdmZip = require('adm-zip');
}

 class AutoUpdater {
    constructor(options = {}) {
    this.repoUrl = options.repoUrl || '';
    this.tempDir = options.tempDir || 'temp_update';
    this.webDir = options.webDir || 'web';
    }
 

    async update() {
    console.log('Starting update process...');
 

    if (!this.repoUrl) {
    throw new Error('Repository URL is required.');
    }
 

    // 1. Create temp directory
    this.createTempDir();
 

    // 2. Download the latest code
    await this.downloadRepo();
 

    // 3. Update files
    await this.updateFiles();
 

    // 4. Clean up temp directory
    this.cleanUp();
 

    console.log('Update completed successfully!');
    }
 

    createTempDir() {
    if (!fs.existsSync(this.tempDir)) {
    fs.mkdirSync(this.tempDir);
    console.log(`Created temporary directory: ${this.tempDir}`);
    }
    }
 

    async downloadRepo() {
    const repoName = this.repoUrl.split('/').pop().replace('.git', '');
    const archiveUrl = this.repoUrl.replace('.git', '/archive/refs/heads/main.zip'); // Assuming 'main' branch
    const zipFilePath = path.join(this.tempDir, 'repo.zip');
    const extractPath = this.tempDir;
 

    console.log(`Downloading repository from: ${archiveUrl}`);
    await this.downloadFile(archiveUrl, zipFilePath);
 

    console.log(`Extracting repository to: ${extractPath}`);
    await this.extractZip(zipFilePath, extractPath);
 

    this.repoExtractedPath = path.join(this.tempDir, `${repoName}-main`); // Adjust if the extracted folder name is different
    }
 

    async downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
    reject(new Error(`Failed to download file: ${response.statusCode}`));
    return;
    }
    response.pipe(file);
    file.on('finish', () => {
    file.close(resolve);
    });
    }).on('error', err => {
    fs.unlink(dest, () => reject(err)); // Delete the file asynchronously if an error occurred
    });
    });
    }
 

    async extractZip(zipPath, extractPath) {
    return new Promise((resolve, reject) => {
    try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
    resolve();
    } catch (err) {
    reject(err);
    }
    });
    }
 

    async updateFiles() {
    console.log('Updating files...');
    await this.processDirectory(this.repoExtractedPath, process.cwd());
    }
 

    async processDirectory(source, target) {
    const files = fs.readdirSync(source);
 

    for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const sourceStats = fs.statSync(sourcePath);
 

    if (sourceStats.isDirectory()) {
    if (file === this.webDir) {
    // Special handling for the 'web' directory
    await this.processDirectory(sourcePath, path.join(process.cwd(), this.webDir));
    } else {
    if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
    }
    await this.processDirectory(sourcePath, targetPath);
    }
    } else {
    await this.updateFile(sourcePath, targetPath);
    }
    }
    }
 

    async updateFile(sourceFile, targetFile) {
    try {
    const sourceContent = fs.readFileSync(sourceFile);
 

    if (fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, sourceContent);
    console.log(`Updated file: ${targetFile}`);
    } else {
    fs.writeFileSync(targetFile, sourceContent);
    console.log(`Added file: ${targetFile}`);
    }
    } catch (err) {
    console.error(`Error updating file ${targetFile}: ${err.message}`);
    }
    }
 

    cleanUp() {
    console.log('Cleaning up temporary directory...');
    this.deleteDirectoryRecursive(this.tempDir);
    console.log('Clean up complete.');
    }
 

    deleteDirectoryRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
    const curPath = path.join(directoryPath, file);
    if (fs.lstatSync(curPath).isDirectory()) { // recurse
    this.deleteDirectoryRecursive(curPath);
    } else { // delete file
    fs.unlinkSync(curPath);
    }
    });
    fs.rmdirSync(directoryPath);
    }
    }
 }
 

 // Example usage (replace with your actual repository URL)
 // const updater = new AutoUpdater({ repoUrl: 'https://github.com/your-username/your-repo.git' });
 // updater.update().catch(err => console.error('Update failed:', err));
 

 module.exports = AutoUpdater;