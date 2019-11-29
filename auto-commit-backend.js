"use strict";
/**
 * Generated using theia-plugin-generator
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const theia = require("@theia/plugin");
function start(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let gitLogHandlerInitialized;
        const onChange = () => {
            // Get the vscode Git plugin if the plugin is started.
            const gitExtension = theia.plugins.getPlugin('vscode.git');
            if (!gitLogHandlerInitialized && gitExtension && gitExtension.exports) {
                gitLogHandlerInitialized = true;
                const git = gitExtension.exports._model.git;
                const listener = (out) => __awaiter(this, void 0, void 0, function* () {
                    console.log("----------------------");
                    console.log(out);
                });
                git.onOutput.addListener('log', listener);
                theia.workspace.onDidSaveTextDocument((elem) => {
                    let elems = elem.fileName.split('/');
                    elems.pop();
                    let dir = elems.join('/');
                    git.exec(dir, ['add', elem.fileName]).then(() => { }).catch(() => { });
                    git.exec(dir, ["commit", "-am", "test"]).then(() => { }).catch(() => { });
                    git.exec(dir, ['push']).then(() => { }).catch(() => { });
                });
            }
        };
        theia.plugins.onDidChange(onChange);
    });
}
exports.start = start;
function stop() {
}
exports.stop = stop;
//# sourceMappingURL=auto-commit-backend.js.map