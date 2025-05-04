import {IEditorTab, IFolderTreeNodeProps} from '@dtinsight/molecule/esm/model';
import MarkdownEditor from "../editor/MarkdownEditor.tsx";
import {getFileLocation} from "../extensions/fileExplorer/folderTreeController.ts";

export function transformToEditorTab(item: IFolderTreeNodeProps): IEditorTab {
    if (item.data?.language == 'markdown') {
        return {
            id: item.id,
            name: item.name,
            data: {
                treeNodeId: item.id,
                value: item.data.value,
                language: item.data.language,
            },
            closable: true,
            //@ts-ignore
            renderPane: (data, tab, group) => {
                console.log('going to render the editor pane of ', tab?.id)
                return <MarkdownEditor key={tab?.id} file={{...data, tabId: tab?.id, groupId: group?.id}}/>;
            },
        };
    } else {
        const fileLocation = getFileLocation(item);
        return {
            ...item,
            id: item.id?.toString(),
            data: {
                treeNodeId: item.id,
                ...(item.data || {}),
            },
            breadcrumb: fileLocation
                ? fileLocation
                    .split('/')
                    .map((local: string) => ({id: local, name: local}))
                : []
        };
    }
}
