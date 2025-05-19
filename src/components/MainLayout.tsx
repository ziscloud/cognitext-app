import React, {useState} from 'react';
import {MenuProps, TabsProps, theme} from 'antd';
import {Layout, Splitter, Tabs} from 'antd';
import Side from "./Side.tsx";
import FolderTree from "./FolderTree.tsx";
import {readTextFile} from "@tauri-apps/plugin-fs";
import MarkdownEditor from "../editor/MarkdownEditor.tsx";


type TabsItem = Required<TabsProps>['items'][number];

const MainLayout: React.FC = () => {
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    //@ts-ignore
    const [activeMenu, setActiveMenu] = useState<string>('');
    const [items, setItems] = useState<TabsItem[]>([])
    const {
        token: {colorBgContainer},
    } = theme.useToken();
    const onFileSelected = async (key: string, path: string, fileName?: string) => {
        console.log(path, key);
        if (openFiles.includes('tab-' + key)) {
            setActiveTab('tab-' + key);
        } else {
            const fileContent = await readTextFile(path, {});
            const item = {
                key: 'tab-' + key,
                label: fileName?.split('.').slice(0, -1).join('.'),
                children: <MarkdownEditor key={'editor-' + key} file={{
                    language: 'markdown',
                    value: fileContent,
                    path: path,
                    tabId: key,
                    groupId: '0'
                }}/>,
            } as TabsItem;

            setItems([...items, item])
            setOpenFiles([...openFiles, 'tab-' + key]);
            setActiveTab('tab-' + key);
        }
    }

    const onTabEdit = (targetKey: string, action: 'add' | 'remove') => {
        if (action === 'add') {
            //add();
        } else {
            const targetIndex = items.findIndex((pane) => pane.key === targetKey);
            const newPanes = items.filter((pane) => pane.key !== targetKey);
            if (newPanes.length && targetKey === activeTab) {
                const {key} = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
                setActiveTab(key);
            }
            setOpenFiles(newPanes.map((pane) => pane.key))
            setItems(newPanes);
        }
    };

    const onMenuClick: MenuProps['onClick'] = ({key}) => {
        setActiveMenu(key);
    };

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Side onMenuClick={onMenuClick}/>
            <Splitter style={{height: '100vh'}} className={'main-content'} lazy={true}>
                <Splitter.Panel defaultSize="20%" min="0" max="70%">
                    <FolderTree onFileSelect={onFileSelected}/>
                </Splitter.Panel>
                <Splitter.Panel style={{backgroundColor: colorBgContainer}}>
                    <Tabs className="editor-tabs" type="editable-card"
                          activeKey={activeTab} items={items}
                          onChange={setActiveTab}
                        //@ts-ignore
                          onEdit={onTabEdit}
                    />
                </Splitter.Panel>
            </Splitter>
        </Layout>
    );
};

export default MainLayout;
