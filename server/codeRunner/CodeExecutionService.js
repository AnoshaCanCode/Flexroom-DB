const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class CodeExecutionService {
    constructor() {
        // Ensure this folder exists in your project!
        this.tempDir = path.join(__dirname, '../../uploads/temp'); 
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async compileAndRunCpp(sourceBuffer, stdin = '') {
        const id = `test_${Date.now()}`;
        const srcPath = path.join(this.tempDir, `${id}.cpp`);
        const exePath = path.join(this.tempDir, process.platform === 'win32' ? `${id}.exe` : id);

        try {
            // 1. WRITE: Save the SQL VARBINARY (Buffer) to a real .cpp file
            await writeFile(srcPath, sourceBuffer);

            // 2. COMPILE: Run g++ command
            const compile = await this._spawnCommand('g++', [srcPath, '-o', exePath]);
            if (compile.code !== 0) {
                throw new Error(`Compilation Error: ${compile.stderr}`);
            }

            // 3. RUN: Execute the compiled .exe with the test case input (stdin)
            const run = await this._spawnCommand(exePath, [], stdin);

            // 4. DELETE: Clean up both files
            await this._safeUnlink(srcPath);
            await this._safeUnlink(exePath);

            return {
                stdout: run.stdout.trim(),
                stderr: run.stderr.trim(),
                exitCode: run.code
            };

        } catch (err) {
            // Ensure files are deleted even if a crash happens
            await this._safeUnlink(srcPath);
            await this._safeUnlink(exePath);
            return { stdout: '', stderr: err.message, exitCode: 1 };
        }
    }

    // Helper to run terminal commands
    _spawnCommand(command, args, input = '') {
        return new Promise((resolve) => {
            const child = spawn(command, args);
            let stdout = '';
            let stderr = '';

            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }

            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());
            child.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    }

    async _safeUnlink(p) {
        try { if (fs.existsSync(p)) await unlink(p); } catch (e) {}
    }
}

module.exports = { CodeExecutionService };