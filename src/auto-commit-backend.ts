import * as theia from '@theia/plugin';

let modifiedGitFiles: string[] = [];
let commitLock: boolean = false;
let timeoutInterval: number = 5000; // miliseconds
let interval: any = null;
let git: any = null;

export async function start(context: theia.PluginContext) {
    let gitLogHandlerInitialized: boolean;

    const onChange = () => {
        // Get the vscode Git plugin if the plugin is started.
        const gitExtension = theia.plugins.getPlugin('vscode.git');
        if (!gitLogHandlerInitialized && gitExtension && gitExtension.exports) {
            gitLogHandlerInitialized = true;

            if (typeof theia.workspace.rootPath === undefined) {
                return;
            }
            let rootPath = String(theia.workspace.rootPath);

            const workspacePath = new theia.RelativePattern(rootPath, "**/*");
            const fsw = theia.workspace.createFileSystemWatcher(workspacePath);

            git = gitExtension.exports._model.git;

            const fswListener = function(file: any) {
                if (modifiedGitFiles.indexOf(file.path) === -1) {
                    modifiedGitFiles.push(file.path);
                }
            };

            fsw.onDidCreate(fswListener);
            fsw.onDidChange(fswListener);
            fsw.onDidDelete(fswListener);

            if (interval === null) {
                interval = setInterval(function() { commitModifiedGitDirs(); }, timeoutInterval);
            }
        }
    }

    theia.plugins.onDidChange(onChange);
}


async function commitModifiedGitDirs(): Promise<void> {
    if (commitLock) {
        return;
    }
    commitLock = true;

    if (modifiedGitFiles.length === 0) {
        commitLock = false;
        return;
    }

    let dirs: string[] = [];
    let files = [...modifiedGitFiles];
    modifiedGitFiles = [];

    for (let i in files) {
        if (dirs.length === 0) {
            let output = await getGitDirForFile(files[i]);
            if (output && output.stdout) {
                dirs.push(output.stdout.trim());
            }
        } else {
            for (let j in dirs) {
                if (files[i].indexOf(dirs[j]) !== 0) {
                    let output = await getGitDirForFile(dirs[j]);
                    if (output && output.stdout) {
                        dirs.push(output.stdout.trim());
                    }
                }
            }
        }
    }

    if (dirs.length === 0) {
        commitLock = false;
        return;
    }

    commitChanges(dirs);
}

async function getGitDirForFile(file: string): Promise<any> {
    let elems = file.split('/');
    elems.pop();
    let fileDir = elems.join('/');

    return git.exec(fileDir, ['rev-parse', '--show-toplevel']).catch(() => { });
}

async function commitChanges(dirs: string[]): Promise<any> {
    dirs.forEach((dir: any) => {
        git.exec(dir, ['add', '--all']).then(() => {
            git.exec(dir, ['commit', '-am', 'auto']).then(() => {
                git.exec(dir, ['push']).then(() => { commitLock = false; }).catch(() => { commitLock = false; });
            }).catch(() => { commitLock = false; });
        }).catch(() => { commitLock = false; });
    });
}

export function stop() {
    clearInterval(interval);
    modifiedGitFiles = [];
    commitLock = false;
    interval = null;
    git = null;
}
