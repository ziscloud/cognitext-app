import {IExtension} from '@dtinsight/molecule/esm/model/extension';
import {IExtensionService} from '@dtinsight/molecule/esm/services';
import * as folderTreeController from './folderTreeController';
import {getFileLocation, getFileLocationById, getFileParentIds} from './folderTreeController';
import molecule from "@dtinsight/molecule";
import {ExplorerEvent, FileTypes, TreeNodeModel} from "@dtinsight/molecule/esm/model";
import {constants, modules} from "@dtinsight/molecule/esm/services/builtinService/const";
import {randomId} from '@dtinsight/molecule/esm/common/utils'
import {isSamePath} from "../../common/utils.ts";
import {create, exists, mkdir, rename, remove} from '@tauri-apps/plugin-fs';
import { confirm } from '@tauri-apps/plugin-dialog';

export class LocalExplorerExtension implements IExtension {
    id: string = 'com.cognitext.localExplorer';
    name: string = 'Local Explorer Extension';

    // @ts-ignore
    private readonly _s = "/Users/shunyun/Documents/";

    //@ts-ignore
    activate(extensionCtx: IExtensionService): void {
        molecule.folderTree.setFileContextMenu([...molecule.folderTree.getFileContextMenu(),/*...modules.BASE_CONTEXT_MENU(),*/ ...modules.COMMON_CONTEXT_MENU()])
        molecule.folderTree.setFolderContextMenu([...molecule.folderTree.getFolderContextMenu(), ...modules.COMMON_CONTEXT_MENU()])
        folderTreeController.initFolderTree();
        folderTreeController.handleSelectFolderTree();

        molecule.editor.onSelectTab((tab) => {
            console.log('tab selected', tab)
        })
        molecule.editor.onCloseTab((tab) => {
            console.log('tab closed', tab)
        })
        molecule.folderTree.onCreate((type, nodeId) => {
            console.log('file created', type, nodeId)
            let resolvedParentId = nodeId;
            if (nodeId) {
                const node = molecule.folderTree.get(nodeId);
                if (node && node.fileType === FileTypes.File) {
                    const parentNode = molecule.folderTree.getParentNode(nodeId);
                    if (parentNode) {
                        resolvedParentId = parentNode.id;
                    }
                }
            }

            if (resolvedParentId) {
                molecule.folderTree.add(
                    new TreeNodeModel({
                        id: randomId(),
                        name: '',
                        fileType: type,
                        icon: 'file-code',
                        isLeaf: type === FileTypes.File,
                        data: {language: 'markdown'},
                        isEditable: true,
                    }),
                    nodeId
                );
            }
        });

        molecule.folderTree.onUpdateFileName(async node => {
            //1. rename or create
            //2. 需要更新location属性
            //3. name是新的name，旧的name已经被覆盖
            //4. 需要考虑重名的文件/文件夹是否已经存在
            const fileLocation = getFileLocation(node);
            console.log('location of the updated node is', fileLocation)
            // 如果node的location和parent的location是相同的，那么就应该是create，否则是rename
            const parentNode = molecule.folderTree.getParentNode(node.id);
            //@ts-ignore
            const parentFileLocation = getFileLocation(parentNode);
            let actionType = 'rename';
            if (parentNode) {
                //@ts-ignore
                if (isSamePath(parentFileLocation, fileLocation)) {
                    // create
                    actionType = 'create'
                }
            }

            console.log('going to ' + actionType + " " + node.fileType + ": " + node.name)

            if (node.fileType === FileTypes.Folder) {
                if (actionType === 'create') {
                    const newLocation = fileLocation + "/" + node.name;
                    const path = this._s + newLocation;
                    const isExists = await exists(path);
                    if (isExists) {
                        console.error('folder already exists ', path)
                        return;
                    } else {
                        await mkdir(path)
                    }
                } else {
                    const oldPath = this._s + node.location;
                    const newLocation = fileLocation?.split("/").slice(0, -1).join("/") + "/" + node.name;
                    const newPath = this._s + newLocation;
                    const isExists = await exists(newPath);
                    if (isExists) {
                        console.error('folder already exists ', newPath)
                        return;
                    } else {
                        await rename(oldPath, newPath);
                        node.location = newLocation;
                    }
                }
            } else {
                if (actionType === 'create') {
                    const newLocation = fileLocation + "/" + node.name;
                    const path = this._s + newLocation;
                    const isExists = await exists(path);
                    if (isExists) {
                        console.error('file already exists ', path)
                        return;
                    } else {
                        const file = await create(path);
                        await file.write(new TextEncoder().encode('# ' + node.name?.replace(".md", "")));
                        await file.close();
                    }
                } else {
                    const oldPath = this._s + node.location;
                    const newLocation = fileLocation?.split("/").slice(0, -1).join("/") + "/" + node.name;
                    const newPath = this._s + newLocation;
                    const isExists = await exists(newPath);
                    if (isExists) {
                        console.error('file already exists ', newPath)
                        return;
                    } else {
                        await rename(oldPath, newPath);
                        node.location = newLocation;
                        const groupIdByTab = molecule.editor.getGroupIdByTab(node.id);
                        //@ts-ignore
                        const tabById = molecule.editor.getTabById(node.id, groupIdByTab);
                        if (tabById) {
                            console.log("going to update tab name of the node", node.id)
                            //@ts-ignore
                            tabById.name = node.name;
                        } else {
                            console.log("editor is not opened", node.id)
                        }
                    }
                }
            }
        })

        molecule.explorer.subscribe(ExplorerEvent.onPanelToolbarClick, (toolbar: any, id: string) => {
            if (toolbar.id === constants.SAMPLE_FOLDER_PANEL_ID && id === 'refresh') {
                folderTreeController.initFolderTree();
            }
        })

        molecule.explorer.subscribe(ExplorerEvent.onCollapseAllFolders, () => {
            molecule.folderTree.setExpandKeys([]);
        })

        molecule.folderTree.onRemove(async (nodeId) => {
            console.log("going to remove node", nodeId)
            const confirmation = await confirm(
                'This action cannot be reverted. Are you sure?',
                { title: 'Delete Confirm', kind: 'warning' }
            );

            if(!confirmation) {
                return;
            }

            const node = molecule.folderTree.get(nodeId);
            if (!node) {
                console.error('node with id cannot be found in the folder tree', nodeId)
                return;
            }
            if (node.fileType === FileTypes.Folder) {
                const fileLocationById = getFileLocationById(nodeId);
                await remove(this._s + "/"+ fileLocationById, {
                    recursive: true,
                });
                const groupIdByTab = molecule.editor.getGroupIdByTab(nodeId);
                //@ts-ignore
                molecule.editor.getGroupById(groupIdByTab)?.data.forEach((tab) => {
                    const fileParentIds = getFileParentIds(tab.id);
                    if (fileParentIds.includes(nodeId)) {
                        //@ts-ignore
                        molecule.editor.closeTab(tab.id, groupIdByTab);
                    }
                });
                molecule.folderTree.remove(nodeId);
            } else if (node.fileType === FileTypes.File) {
                const fileLocationById = getFileLocationById(nodeId);
                await remove(this._s + "/"+ fileLocationById);
                const groupIdByTab = molecule.editor.getGroupIdByTab(nodeId);
                //@ts-ignore
                molecule.editor.closeTab(nodeId, groupIdByTab);
                molecule.folderTree.remove(nodeId);
            } else {
                console.error('unknown file type', node.fileType)
                return;
            }
        })
    }

    // @ts-ignore
    dispose(extensionCtx: IExtensionService): void {
        throw new Error('Method not implemented.');
    }
}
