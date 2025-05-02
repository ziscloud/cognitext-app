import { IExtension } from '@dtinsight/molecule/esm/model/extension';
import { IExtensionService } from '@dtinsight/molecule/esm/services';
import * as folderTreeController from './folderTreeController';

export class FirstExtension implements IExtension {
    id: string = 'TheFirstExtension';
    name: string = 'The First Extension';

    // @ts-ignore
    activate(extensionCtx: IExtensionService): void {
        folderTreeController.initFolderTree();
        folderTreeController.handleSelectFolderTree();
    }

    // @ts-ignore
    dispose(extensionCtx: IExtensionService): void {
        throw new Error('Method not implemented.');
    }
}
