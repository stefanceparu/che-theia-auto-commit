import * as theia from '@theia/plugin';

export async function start(context: theia.PluginContext) {
    let gitLogHandlerInitialized: boolean;

    const onChange = () => {
        // Get the vscode Git plugin if the plugin is started.
        const gitExtension = theia.plugins.getPlugin('vscode.git');
        if (!gitLogHandlerInitialized && gitExtension && gitExtension.exports) {
            gitLogHandlerInitialized = true;

            const git: any = gitExtension.exports._model.git;

            theia.workspace.onDidSaveTextDocument((elem: any) => {
                let elems = elem.fileName.split('/');
                elems.pop();
                let dir = elems.join('/');

                git.exec(dir, ['add', elem.fileName]).then(() => {
                    git.exec(dir, ['commit', '-am', 'test']).then(() => {
                        git.exec(dir, ['push']).then(() => { }).catch(() => { });
                    }).catch(() => { });
                }).catch(() => { });
            });
        }
    }

    theia.plugins.onDidChange(onChange);
}

export function stop() {

}
