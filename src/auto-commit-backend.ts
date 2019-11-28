
/**
 * Generated using theia-plugin-generator
 */

import * as theia from '@theia/plugin';
import * as che from '@eclipse-che/plugin';

export async function start(context: theia.PluginContext) {
    let gitLogHandlerInitialized: boolean;

    const onChange = () => {
        // Get the vscode Git plugin if the plugin is started.
        const gitExtension = theia.plugins.getPlugin('vscode.git');
        if (!gitLogHandlerInitialized && gitExtension && gitExtension.exports) {
            gitLogHandlerInitialized = true;

            const git: any = gitExtension.exports._model.git;

            const listener = async (out: string) => {
                console.log("----------------------");
                console.log(out);
            }

            git.onOutput.addListener('log', listener);

            theia.workspace.onDidSaveTextDocument((elem) => {
                let elems = elem.fileName.split('/');
                elems.pop();
                let dir = elems.join('/');

                git.exec(dir, ['add', elem.fileName]);
                git.exec(dir, ["commit", "-am", "test"]);
                git.exec(dir, ['push']);
            });

        }
    }

    theia.plugins.onDidChange(onChange);
}

export function stop() {

}
