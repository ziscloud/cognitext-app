import molecule from '@dtinsight/molecule';
import {IFolderTreeNodeProps} from '@dtinsight/molecule/esm/model';
import {transformToEditorTab} from '../../common';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';

export async function initFolderTree() {
    let entries: any = await readDir("/Users/shunyun/Documents/Notes");
    if (entries) {
        molecule.folderTree.reset();
        molecule.folderTree.add({
            id: 0,
            name: "Notes",
            fileType: "RootFolder",
            location: "Notes",
            isLeaf: false,
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
                    id: i + 1,
                    fileType: 'File',
                    name: item.name,
                    location: item.name,
                    isLeaf: true,
                    data: {language: 'markdown'}
                }, 0);
            }
            if (item.isDirectory) {
                molecule.folderTree.add({
                    id: i + 1,
                    fileType: 'Folder',
                    name: item.name,
                    location: item.name,
                    isLeaf: false,
                }, 0);
            }
        }
    }
}

export function handleSelectFolderTree() {
    molecule.folderTree.onSelectFile(async (file: IFolderTreeNodeProps) => {
        const value = await readTextFile("/Users/shunyun/Documents/" + file.location, {
        });
        file.data.value = value;
        molecule.editor.open(transformToEditorTab(file));
    });
}
