import * as theia from '@theia/plugin';
import * as process from 'child_process';

let modifiedGitFiles: string[] = [];
let commitLock: boolean = false;
let timeoutInterval: number = 5000; // miliseconds
let interval: any = null;

export async function start(context: theia.PluginContext) {
    let pluginInitialized: boolean;

    const onChange = () => {
        if (!pluginInitialized) {
            pluginInitialized = true;

            if (typeof theia.workspace.rootPath === undefined) {
                return;
            }
            let rootPath = String(theia.workspace.rootPath);

            const workspacePath = new theia.RelativePattern(rootPath, "**/*");
            const fsw = theia.workspace.createFileSystemWatcher(workspacePath);

            const fswListener = function(file: any) {
                if (file.path.indexOf('/node_modules/') === -1 &&
                    file.path.indexOf('/.Trash') === -1 &&
                    file.path.indexOf('/.theia') === -1 &&
                    modifiedGitFiles.indexOf(file.path) === -1) {

                    modifiedGitFiles.push(file.path);
                }
            };

            fsw.onDidCreate(fswListener);
            fsw.onDidChange(fswListener);
            fsw.onDidDelete(fswListener);

            if (interval === null) {
                interval = setInterval(function() { commitModifiedGitDirs(); }, timeoutInterval);
            }

            console.log('Auto-commit: plugin started');
        }
    }

    theia.plugins.onDidChange(onChange);
}


function commitModifiedGitDirs(): void {
    if (commitLock) {
        return;
    }
    commitLock = true;

    if (modifiedGitFiles.length === 0) {
        commitLock = false;
        console.log('Auto-commit: there are no changes to be commited');
        return;
    }

    let dirs: string[] = [];
    let files = [...modifiedGitFiles];
    modifiedGitFiles = [];

    for (let i in files) {
        if (dirs.length === 0) {
            let output = getGitDirForFile(files[i]);
            if (output) {
                dirs.push(output.trim());
            }
        } else {
            for (let j in dirs) {
                if (files[i].indexOf(dirs[j]) !== 0) {
                    let output = getGitDirForFile(files[i]);
                    if (output) {
                        dirs.push(output.trim());
                    }
                }
            }
        }
    }

    if (dirs.length === 0) {
        commitLock = false;
        return;
    }

    console.log('Auto-commit: try to commit changes, total items: ' + dirs.length);
    commitChanges(dirs);
}

function getGitDirForFile(file: string): string | null {
    let elems = file.split('/');
    elems.pop();
    let fileDir = elems.join('/');

    try {
        let buf: Buffer = process.execSync(
            'git rev-parse --show-toplevel',
            {
                cwd: fileDir
            }
        );

        return buf.toString();
    } catch (err) {
        console.error("Auto-commit: error on getDirForFile() - path: " + fileDir);
        console.error(err.message);
        return null;
    }
}

function commitChanges(dirs: string[]): void {
    dirs.forEach((dir: any) => {
        try {
            process.execSync(
                'git add --all && git commit -am auto && git push',
                {
                    cwd: dir
                }
            );
        } catch (err) {
            console.error("Auto-commit: error on commitChanges() - path: " + dir);
            console.error(err.message);
        }
    });

    commitLock = false;
}

export function stop() {
    clearInterval(interval);
    modifiedGitFiles = [];
    commitLock = false;
    interval = null;
    pluginInitialized = false;
    console.log("Auto-commit: plugin stopped");
}
