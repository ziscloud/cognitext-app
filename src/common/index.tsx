import {IEditorTab, IFolderTreeNodeProps} from '@dtinsight/molecule/esm/model';
import MarkdownEditor from "../editor/MarkdownEditor.tsx";

export function transformToEditorTab(item: IFolderTreeNodeProps): IEditorTab {
    if (item.data?.language == 'markdown') {
        return {
            id: item.id,
            name: item.name,
            data: {
                path: item.location,
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
        return {
            ...item,
            id: item.id?.toString(),
            data: {
                path: item.location,
                ...(item.data || {}),
            },
            breadcrumb: item.location
                ? item.location
                    .split('/')
                    .map((local: string) => ({id: local, name: local}))
                : []
        };
    }
}
