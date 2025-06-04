import React, {useEffect, useRef, useState} from 'react';
import {Button, Layout, MenuProps, Modal, Splitter, Tabs, TabsProps, theme} from 'antd';
import Side from "./Side.tsx";
import FolderTree from "./FolderTree.tsx";
import {BaseDirectory, create, readTextFile} from "@tauri-apps/plugin-fs";
import MarkdownEditor from "../editor/MarkdownEditor.tsx";
import {appConfigDir, join} from "@tauri-apps/api/path";
import {useEvent} from "../event/EventContext.tsx";
import {EventType} from "../event/event.ts";
import {save} from "@tauri-apps/plugin-dialog";
import {useSettings} from "../settings/SettingsContext.tsx";

type TabsItem = Required<TabsProps>['items'][number];

function getFileNameWithoutExtension(path: string): string {
    // 1. 获取文件名（含扩展名）
    const fileName = path.split(/[/\\]/).pop() || "";

    // 2. 移除扩展名
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
}

const MainLayout: React.FC = () => {
    // status
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeTabKey, setActiveTabKey] = useState<string>('');
    const [targetTabKey, setTargetTabKey] = useState<string>('');
    //@ts-ignore
    const [activeMenu, setActiveMenu] = useState<string>('');
    const [items, setItems] = useState<TabsItem[]>([]);
    const [newFileCount, setNewFileCount] = useState<number>(1);
    const [open, setOpen] = useState(false);
    // refs
    const newFileCountRef = useRef(newFileCount);
    const openFilesRef = useRef(openFiles);
    const activeTabKeyRef = useRef(activeTabKey);
    const itemsRef = useRef(items);
    // mics
    const settings = useSettings();
    const {token: {colorBgContainer}} = theme.useToken();
    const {subscribe, publish} = useEvent();
    const onFileSelected = async (key: string, path: string, fileName?: string) => {
        if (openFiles.includes('tab-' + key)) {
            setActiveTabKey('tab-' + key);
        } else {
            const fileContent = await readTextFile(path, {});
            const item = {
                key: 'tab-' + key,
                label: fileName?.split('.').slice(0, -1).join('.'),
                isNew: false,
                children: <MarkdownEditor key={'editor-' + key} file={{
                    language: 'markdown',
                    value: fileContent,
                    path: path,
                    tabId: key,
                    groupId: '0',
                    isNew: false
                }}/>,
            } as TabsItem;

            setItems(prevState => [...prevState, item])
            setOpenFiles(prevState => [...prevState, 'tab-' + key]);
            setActiveTabKey('tab-' + key);
        }
    }

    async function createNewFile(newFileCount: number) {
        const id = Math.random().toString(36);
        const fileName = id + ".md";
        const file = await create(`Backups/${fileName}`, {baseDir: BaseDirectory.AppConfig});
        await file.write(new TextEncoder().encode('# '));
        await file.close();

        const path = await join(await appConfigDir(), 'CogniText', 'Backups', fileName);
        const item = {
            key: 'tab-' + id,
            label: `Untitled ${newFileCount}`,
            isNew: true,
            children: <MarkdownEditor key={'editor-' + fileName} file={{
                language: 'markdown',
                value: '# ',
                path: path,
                tabId: id,
                groupId: '0',
                isNew: true
            }}/>,
        } as TabsItem;

        setItems(prevState => [...prevState, item])
        setOpenFiles(prevState => [...prevState, 'tab-' + id]);
        setActiveTabKey('tab-' + id);
        setNewFileCount(prevState => prevState + 1);
    }

    function updateActiveTab(targetTabKey: string) {
        const find = items.find((pane) => pane.key === targetTabKey);
        //@ts-ignore
        if (find?.isNew) {
            setNewFileCount(prevState => prevState - 1);
        }
        const targetIndex = items.findIndex((pane) => pane.key === targetTabKey);
        const newPanes = items.filter((pane) => pane.key !== targetTabKey);
        if (newPanes.length && targetTabKey === activeTabKey) {
            const {key} = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
            setActiveTabKey(key);
        }
        setOpenFiles(newPanes.map((pane) => pane.key))
        setItems(newPanes);
    }

    const onTabEdit = async (targetTabKey: string, action: 'add' | 'remove') => {
        if (action === 'add') {
            await createNewFile(newFileCount);
        } else {
            const find = items.find((pane) => pane.key === targetTabKey);
            //@ts-ignore
            if (find?.isNew) {
                setOpen(true);
                setTargetTabKey(targetTabKey);
            } else {
                publish(EventType.SAVE_FILE, {});
                updateActiveTab(targetTabKey)
            }
        }
    };

    const onMenuClick: MenuProps['onClick'] = ({key}) => {
        setActiveMenu(key);
    };

    useEffect(() => {
        return subscribe(EventType.FILE_SAVED, ({file, path, content}) => {
            if (openFilesRef.current.includes('tab-' + file.tabId)) {
                setItems(prevState => prevState.map((item) => {
                    if ((item.key === 'tab-' + file.tabId) && path) {
                        const fileName = getFileNameWithoutExtension(path)
                        return {
                            key: 'tab-' + file.tabId,
                            label: fileName,
                            isNew: false,
                            children: <MarkdownEditor key={'editor-' + fileName} file={{
                                language: 'markdown',
                                value: content || '',
                                path: path,
                                tabId: file.tabId,
                                groupId: '0',
                                isNew: false
                            }}/>,
                        };
                    } else {
                        return item;
                    }
                }));
            } else {
                console.log('tab is not opened', 'tab-' + file.tabId)
            }
        });
    }, [subscribe]);

    useEffect(() => {
        newFileCountRef.current = newFileCount; // 每次newFileCount变化时更新ref
    }, [newFileCount]);

    useEffect(() => {
        openFilesRef.current = openFiles;
    }, [openFiles]);

    useEffect(() => {
        activeTabKeyRef.current = activeTabKey;
    }, [activeTabKey]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        return subscribe(EventType.NEW_FILE, async () => {
            await createNewFile(newFileCountRef.current);
        });
    }, [subscribe]);

    useEffect(() => {
        return subscribe(EventType.SAVE, async () => {
            if (activeTabKeyRef.current) {
                const find = itemsRef.current.find((pane) => pane.key === activeTabKeyRef.current);
                //@ts-ignore
                if (find?.isNew) {
                    setOpen(true);
                    setTargetTabKey(activeTabKeyRef.current);
                } else {
                    publish(EventType.SAVE_FILE, {});
                }
            } else {
                console.log('activeTabKey is not found', itemsRef.current, activeTabKeyRef.current)
            }
        });
    }, [subscribe]);

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Side onMenuClick={onMenuClick}/>
            <Splitter style={{height: '100vh'}} className={'main-content'} lazy={true}>
                <Splitter.Panel defaultSize="20%" min="0" max="70%" collapsible={true}>
                    <FolderTree onFileSelect={onFileSelected}/>
                </Splitter.Panel>
                <Splitter.Panel style={{backgroundColor: colorBgContainer}}>
                    <Modal
                        open={open}
                        title="Do you want to save the changes you made to Untitled-4?"
                        onCancel={() => {
                            setOpen(false)
                        }}
                        footer={[
                            <Button key="back" type="primary" onClick={() => {
                                setOpen(false);
                                save({
                                    defaultPath: settings.actionOnStartup.dir,
                                }).then(async (path) => {
                                    console.log('path', path)
                                    if (path) {
                                        publish(EventType.SAVE_FILE, {path: path});
                                        updateActiveTab(targetTabKey);
                                        setTargetTabKey('');
                                    } else {
                                        console.log('save file is canceled on the location choosing step.')
                                    }
                                });
                            }}>
                                Save
                            </Button>,
                            <Button key="submit" onClick={() => {
                                setOpen(false);
                                updateActiveTab(targetTabKey);
                                setTargetTabKey('');
                            }}>
                                Do not save
                            </Button>,
                            <Button
                                key="link"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>,
                        ]}
                    >
                        <p>Your changes will be lost if you don't save them.</p>
                    </Modal>
                    <Tabs className="editor-tabs" type="editable-card"
                          activeKey={activeTabKey} items={items}
                          onChange={setActiveTabKey}
                        //@ts-ignore
                          onEdit={onTabEdit}
                    />
                </Splitter.Panel>
            </Splitter>
        </Layout>
    );
};

export default MainLayout;
