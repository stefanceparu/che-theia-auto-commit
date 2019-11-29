
/**
 * Generated using theia-plugin-generator
 */

import * as theia from '@theia/plugin';

export async function start(context: theia.PluginContext) {
    let gitLogHandlerInitialized: boolean;

    const onChange = () => {
        theia.window.showInformationMessage('Hello World 1!');

        // Get the vscode Git plugin if the plugin is started.
        const gitExtension = theia.plugins.getPlugin('vscode.git');
        if (!gitLogHandlerInitialized && gitExtension && gitExtension.exports) {
            theia.window.showInformationMessage('Hello World 2!');

            gitLogHandlerInitialized = true;

            const git: any = gitExtension.exports._model.git;

            const listener = async (out: string) => {
                theia.window.showInformationMessage('Hello World 3!');
                console.log("----------------------");
                console.log(out);
            }

            git.onOutput.addListener('log', listener);

            theia.workspace.onDidSaveTextDocument((elem) => {
                theia.window.showInformationMessage('Hello World 4!');

                let elems = elem.fileName.split('/');
                elems.pop();
                let dir = elems.join('/');

                git.exec(dir, ['add', elem.fileName]).then(() => {}).catch(() => {});
                git.exec(dir, ["commit", "-am", "test"]).then(() => {}).catch(() => {});
                git.exec(dir, ['push']).then(() => {}).catch(() => {});
            });

        }
    }

    theia.plugins.onDidChange(onChange);
}

export function stop() {

}
