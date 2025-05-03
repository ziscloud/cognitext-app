import molecule from '@dtinsight/molecule';
import { IExtension } from '@dtinsight/molecule/esm/model/extension';
import { IExtensionService } from '@dtinsight/molecule/esm/services';

export default class MDExtension implements IExtension {
    id: string = 'MDExtension';
    name: string = 'MDExtension';

    // @ts-ignore
    async activate(extensionCtx: IExtensionService) {
        //molecule.editor.open(mdEditor, LEFT_PANEL_ID);
        //molecule.editor.open(previewTab, RIGHT_PANEL_ID);

        molecule.layout.toggleMenuBarVisibility();
        molecule.layout.togglePanelVisibility();
        // molecule.layout.toggleSidebarVisibility();
        // molecule.layout.toggleActivityBarVisibility();
        // molecule.explorer.removePanel('outline');
        // molecule.explorer.removePanel('sidebar.explore.openEditor');
        molecule.colorTheme.setTheme("Default Light+");

        // const editor = await new Promise<MonacoEditor.IStandaloneCodeEditor>(
        //     (resolve) => {
        //         setTimeout(() => resolve(molecule.editor.getGroupById(1)?.editorInstance));
        //     }
        // );

        // editor.onDidChangeModelContent(() => {
        //     const value = editor.getValue();
        // });

    }
    // @ts-ignore
    dispose(extensionCtx: IExtensionService): void {
        throw new Error('Method not implemented.');
    }

}
