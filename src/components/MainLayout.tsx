import React, {useState} from 'react';
import type {MenuProps, TabsProps} from 'antd';
import {Button, Flex, Input, Layout, Splitter, Tabs, theme} from 'antd';
import Side from "./Side.tsx";
import FolderTree from "./FolderTree.tsx";
import {PlusOutlined} from '@ant-design/icons';
import {readTextFile} from "@tauri-apps/plugin-fs";
import MarkdownEditor from "../editor/MarkdownEditor.tsx";

const {Header} = Layout;

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
                    <Flex vertical={true} style={{height: '100%', width: '100%'}}>
                        <Header style={{
                            margin: 0,
                            padding: 0,
                            width: '100%',
                            maxWidth: '100%',
                            height: '46px',
                            background: colorBgContainer
                        }}>
                            <Flex justify={'space-around'} gap={'small'} align={'center'}
                                  style={{width: '100%', padding: '0 24px'}}>
                                <Input placeholder="Search" style={{width: '100%'}}/>
                                <Button icon={<PlusOutlined/>}/>
                            </Flex>
                        </Header>
                        <Flex id={'left-panel'} style={{flexGrow: 3, overflowY: 'auto', width: '100%', backgroundColor:'white'}}>
                            <FolderTree onFileSelect={onFileSelected}/>
                        </Flex>
                    </Flex>
                </Splitter.Panel>
                <Splitter.Panel style={{backgroundColor: 'white'}}>
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
