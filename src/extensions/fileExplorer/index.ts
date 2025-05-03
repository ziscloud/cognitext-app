import { IExtension } from '@dtinsight/molecule/esm/model/extension';
import { IExtensionService } from '@dtinsight/molecule/esm/services';
import * as folderTreeController from './folderTreeController';
import molecule from "@dtinsight/molecule";

export class FirstExtension implements IExtension {
    id: string = 'TheFirstExtension';
    name: string = 'The First Extension';

    // @ts-ignore
    activate(extensionCtx: IExtensionService): void {
        folderTreeController.initFolderTree();
        folderTreeController.handleSelectFolderTree();
        molecule.editor.onSelectTab((tab) => {
            console.log('tab selected', tab)
        })
    }

    // @ts-ignore
    dispose(extensionCtx: IExtensionService): void {
        throw new Error('Method not implemented.');
    }
}
