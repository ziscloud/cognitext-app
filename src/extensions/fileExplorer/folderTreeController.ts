import molecule from '@dtinsight/molecule';
import {FileTypes, IFolderTreeNodeProps} from '@dtinsight/molecule/esm/model';
import {transformToEditorTab} from '../../common';
import {readDir, readTextFile} from '@tauri-apps/plugin-fs';
import crypto from 'crypto-js'
import {UniqueId} from "@dtinsight/molecule/esm/common/types";

export async function initFolderTree() {
    const rootPath = "/Users/shunyun/Documents/Notes";
    let entries: any = await readDir(rootPath);
    if (entries) {
        molecule.folderTree.reset();
        const rootId = crypto.MD5(rootPath).toString(crypto.enc.Hex);
        console.log("root id", rootId)
        molecule.folderTree.add({
            //@ts-ignore
            id: rootId,
            name: "Notes",
            fileType: "RootFolder",
            location: "Notes",
            isLeaf: false,
            icon: 'file-code',
            data: "",
        })
        for (let i = 0; i < entries.length; i++) {
            const item = entries[i];
            if (item.name.startsWith(".")) {
                continue;
            }
            if (item.name.includes('.assets')) {
                continue;
            }
            if (item.name === 'assets') {
                continue;
            }
            if (item.isFile) {
                molecule.folderTree.add({
                    //@ts-ignore
                    id:  crypto.MD5(item.name).toString(crypto.enc.Hex),
                    fileType: 'File',
                    name: item.name,
                    location: item.name,
                    isLeaf: true,
                    icon: 'file-code',
                    data: {language: 'markdown'}
                }, rootId);
            }
            if (item.isDirectory) {
                molecule.folderTree.add({
                    //@ts-ignore
                    id:  crypto.MD5(item.name).toString(crypto.enc.Hex),
                    fileType: 'Folder',
                    name: item.name,
                    icon: 'file-code',
                    location: item.name,
                    isLeaf: false,
                    expanded: false
                }, rootId);
            }
        }
    }
}

export function getFileParentIds(id: UniqueId) {
    const node = molecule.folderTree.get(id);
    if (node) {
        const parentIds: UniqueId[] = [];
        let currentId = node.id;
        while (true) {
            const parentNode = molecule.folderTree.getParentNode(currentId);
            if (!parentNode || parentNode.fileType === FileTypes.RootFolder) {
                console.log('node with no parent node or it is RootFolder', node)
                break;
            }
            if (parentNode?.name) {
                parentIds.push(parentNode.id);
            }
        }
        return parentIds;
    }
    return [];
}

export function getFileLocationById(id: UniqueId) {
    const node = molecule.folderTree.get(id);
    if (node) {
        return getFileLocation(node);
    } else {
        console.error('node with id cannot be found in the folder tree', id)
        return null;
    }
}

export function getFileLocation(file: IFolderTreeNodeProps) {
    let currentId = file.id;
    // @ts-ignore
    const pathSeg: string[] = [file.name];
    while (true) {
        const parentNode = molecule.folderTree.getParentNode(currentId);
        if (!parentNode) {
            console.error('unexpected node with no parent node', file)
            break;
        }
        if (parentNode?.name) {
            pathSeg.push(parentNode.name);
            currentId = parentNode.id;
        }
        if (parentNode?.fileType === FileTypes.RootFolder) {
            break;
        }
    }
    return pathSeg.reverse().join('/');
}

export function handleSelectFolderTree() {
    molecule.folderTree.onExpandKeys((keys) => {
        console.log("folder expanded", keys)
        const loadedKeys = molecule.folderTree.getLoadedKeys();
        console.log("loaded keys", loadedKeys)
        keys.forEach(async (key) => {
            //@ts-ignore
            if (!loadedKeys.includes(key)) {
                const file: IFolderTreeNodeProps | null = molecule.folderTree.get(key);
                if (!file) {
                    return;
                }

                const fileLocation = getFileLocation(file);
                console.log("locations:", fileLocation)

                let entries: any = await readDir("/Users/shunyun/Documents/" + fileLocation);
                if (entries) {
                    for (let i = 0; i < entries.length; i++) {
                        const item = entries[i];
                        console.log("item", item.name)
                        if (item.name.startsWith(".") || item.name.includes('.assets') || item.name === 'assets') {
                            continue;
                        }
                        if (item.isFile) {
                            molecule.folderTree.add({
                                //@ts-ignore
                                id: crypto.MD5(file.id + "/" + item.name).toString(crypto.enc.Hex),
                                fileType: 'File',
                                name: item.name,
                                isLeaf: true,
                                icon: 'file-code',
                                data: {language: 'markdown'}
                            }, file.id);
                        }
                        if (item.isDirectory) {
                            molecule.folderTree.add({
                                //@ts-ignore
                                id: crypto.MD5(file.id + "/" + item.name).toString(crypto.enc.Hex),
                                fileType: 'Folder',
                                name: item.name,
                                isLeaf: false,
                            }, file.id);
                        }
                    }
                }
            }
        })
        //@ts-ignore
        molecule.folderTree.setLoadedKeys([...loadedKeys, ...keys]);
    })
    molecule.folderTree.onSelectFile(async (file: IFolderTreeNodeProps) => {
        if (file.fileType === 'Folder') {
            console.log("folder selected", file)

        } else {
            const fileLocation = getFileLocation(file);
            console.log("going to read file content ", fileLocation)
            const value = await readTextFile("/Users/shunyun/Documents/" + fileLocation, {});
            file.data.value = value;
            molecule.editor.open(transformToEditorTab(file));
        }
    });
}
