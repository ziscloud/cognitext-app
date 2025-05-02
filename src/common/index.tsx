import {IEditorTab, IFolderTreeNodeProps} from '@dtinsight/molecule/esm/model';
import MarkdownEditor from "../editor/MarkdownEditor.tsx";

export function transformToEditorTab(item: IFolderTreeNodeProps): IEditorTab {
    if (item.data?.language == 'markdown') {
        console.log('going to open markdown')
        const tabData: IEditorTab = {
            id: item.id,
            name: item.name,
            closable: true,
            renderPane: () => {
                console.log('render markdown editor panel, ', item.id);
                return <MarkdownEditor key={item.id} id={item.id.toString()} markdown={item.data.value}/>;
            },
        };
        return tabData;
    }
    const tabData: IEditorTab = {
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
    return tabData;
}
