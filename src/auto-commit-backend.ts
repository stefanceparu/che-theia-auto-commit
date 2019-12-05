import * as theia from '@theia/plugin';

let modifiedGitDirs: string[] = [];
let commitLock: boolean = false;
let timeoutInterval: number = 5000; // miliseconds
let interval: any = null;

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

            const git = gitExtension.exports._model.git;

            const fswListener = function(file: any) {
                fileCommit(git, file.path);
            };

            fsw.onDidCreate(fswListener);
            fsw.onDidChange(fswListener);
            fsw.onDidDelete(fswListener);

            if (interval === null) {
                interval = setInterval(function() { commitChanges(git); }, timeoutInterval);
            }
        }
    }

    theia.plugins.onDidChange(onChange);
}

function fileCommit(git: any, filePath: string): void {
    let elems = filePath.split('/');
    elems.pop();
    let dir = elems.join('/');

    git.exec(dir, ['rev-parse', '--show-toplevel']).then(
        (elem: any) => {
            if (elem.stdout && modifiedGitDirs.indexOf(elem.stdout.trim()) === -1) {
                modifiedGitDirs.push(elem.stdout.trim());
            }
        }
    ).catch(() => { });
}

function commitChanges(git: any): void {
    if (commitLock && modifiedGitDirs.length == 0) {
        return;
    }
    commitLock = true;

    modifiedGitDirs.forEach((dir) => {
        git.exec(dir, ['add', '--all']).then(() => {
            git.exec(dir, ['commit', '-am', 'auto']).then(() => {
                git.exec(dir, ['push']).then(() => { commitLock = false; }).catch(() => { commitLock = false; });
            }).catch(() => { commitLock = false; });
        }).catch(() => { commitLock = false; });
    });
}

export function stop() {
    clearInterval(interval);
    modifiedGitDirs = [];
    commitLock = false;
    interval = null;
}
