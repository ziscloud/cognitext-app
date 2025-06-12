import React, {useEffect, useRef, useState} from 'react';
import {Button, Layout, MenuProps, Modal, Tabs, TabsProps, theme} from 'antd';
import Side from "./Side.tsx";
import FolderTree from "./FolderTree.tsx";
import {BaseDirectory, create, readTextFile} from "@tauri-apps/plugin-fs";
import MarkdownEditor from "../editor/MarkdownEditor.tsx";
import {appConfigDir, join} from "@tauri-apps/api/path";
import {useEvent} from "../event/EventContext.tsx";
import {EventType} from "../event/event.ts";
import {save} from "@tauri-apps/plugin-dialog";
import {useSettings} from "../settings/SettingsContext.tsx";
import {GoDotFill} from "react-icons/go";
import TableOfContentsList from "./TableOfContentsList.tsx";
import type {TableOfContentsEntry} from "@lexical/react/LexicalTableOfContentsPlugin";
import Copilot from "./Copilot.tsx";
import SplitPane, {Pane} from "./react-split-pane-next";
import {debounce} from "lodash-es";
import FullTextSearch from "./FullTextSearch.tsx";
import {SearchableDocument} from "../services/search/SearchService.ts";
import crypto from "crypto-js";

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
    const [sideWidth, setSideWidth] = useState<string>('200px');
    const [activeTabKey, setActiveTabKey] = useState<string>('');
    const [targetTabKey, setTargetTabKey] = useState<string>('');
    //@ts-ignore
    const [activeMenu, setActiveMenu] = useState<string>('notes');
    const [tabItems, setTabItems] = useState<TabsItem[]>([]);
    const [newFileCount, setNewFileCount] = useState<number>(1);
    const [open, setOpen] = useState(false);
    const [tableOfContents, setTableOfContents] = useState<Partial<Record<string, Array<TableOfContentsEntry>>>>({});
    // refs
    const newFileCountRef = useRef(newFileCount);
    const activeTabKeyRef = useRef(activeTabKey);
    const tabItemsRef = useRef(tabItems);
    // mics
    const settings = useSettings();
    const {token: {colorBgContainer}} = theme.useToken();
    const {subscribe, publish} = useEvent();
    const onFileSelected = async (key: string, path: string, fileName?: string) => {
        if (tabItems.find(item => item.key === 'tab-' + key)) {
            setActiveTabKey('tab-' + key);
        } else {
            const fileContent = await readTextFile(path, {});
            const item = {
                key: 'tab-' + key,
                label: fileName?.split('.').slice(0, -1).join('.'),
                isNew: false,
                children: <MarkdownEditor id={key} key={'editor-' + key} file={{
                    language: 'markdown',
                    value: fileContent,
                    path: path,
                    tabId: key,
                    groupId: '0',
                    isNew: false
                }}/>,
            } as TabsItem;

            setTabItems(prevState => [...prevState, item])
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
            icon: <GoDotFill/>,
            children: <MarkdownEditor id={id} key={'editor-' + fileName} file={{
                language: 'markdown',
                value: '# ',
                path: path,
                tabId: id,
                groupId: '0',
                isNew: true
            }}/>,
        } as TabsItem;

        setTabItems(prevState => [...prevState, item])
        setActiveTabKey('tab-' + id);
        setNewFileCount(prevState => prevState + 1);
    }

    function updateActiveTabAfterCloseTab(targetTabKey: string) {
        const targetTab = tabItems.find((pane) => pane.key === targetTabKey);
        //@ts-ignore
        if (targetTab?.isNew) {//saved, closed
            setNewFileCount(prevState => prevState - 1);
        }
        const targetIndex = tabItems.findIndex((pane) => pane.key === targetTabKey);
        const otherTabs = tabItems.filter((pane) => pane.key !== targetTabKey);
        if (otherTabs.length && targetTabKey === activeTabKey) {
            const {key} = otherTabs[targetIndex === otherTabs.length ? targetIndex - 1 : targetIndex];
            setActiveTabKey(key);
        }
        setTabItems(otherTabs);
        if (otherTabs.length == 0) {
            setActiveTabKey('');
        }
    }

    const onTabEdit = async (targetTabKey: string, action: 'add' | 'remove') => {
        if (action === 'add') {
            await createNewFile(newFileCount);
        } else {
            const find = tabItems.find((pane) => pane.key === targetTabKey);
            //@ts-ignore
            if (find?.isNew) {
                setOpen(true);
                setTargetTabKey(targetTabKey);
            } else {
                publish(EventType.SAVE_FILE, {});
                updateActiveTabAfterCloseTab(targetTabKey)
            }
        }
    };

    const onMenuClick: MenuProps['onClick'] = ({key}) => {
        setActiveMenu(key);
    };

    useEffect(() => {
        return subscribe(EventType.FILE_SAVED, ({file, path, content}) => {
            console.log('FILE_SAVED', path)
            if (tabItemsRef.current.find(item => item.key === 'tab-' + file.tabId)) {
                setTabItems(prevState => prevState.map((item) => {
                    if ((item.key === 'tab-' + file.tabId)) {
                        if (file.isNew) {
                            if (path) {
                                const fileName = getFileNameWithoutExtension(path)
                                return {
                                    key: 'tab-' + file.tabId,
                                    label: fileName,
                                    isNew: false,
                                    icon: false,
                                    children: <MarkdownEditor id={file.tabId} key={'editor-' + fileName} file={{
                                        language: 'markdown',
                                        value: content || '',
                                        path: path,
                                        tabId: file.tabId,
                                        groupId: '0',
                                        isNew: false
                                    }}/>,
                                };
                            } else {
                                return {...item, icon: false}
                            }
                        } else {
                            return {
                                ...item,
                                icon: false,
                            };
                        }
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
        activeTabKeyRef.current = activeTabKey;
    }, [activeTabKey]);

    useEffect(() => {
        tabItemsRef.current = tabItems;
    }, [tabItems]);

    useEffect(() => {
        return subscribe(EventType.NEW_FILE, async () => {
            await createNewFile(newFileCountRef.current);
        });
    }, [subscribe]);

    useEffect(() => {
        return subscribe(EventType.FILE_CHANGED, async ({tabId}) => {
            //console.log('file change of tab', tabId)
            if (tabItemsRef.current.find(item => item.id === 'tab-' + tabId)) {
                setTabItems(prevState => prevState.map((item) => {
                    if ((item.key === 'tab-' + tabId)) {
                        return {
                            ...item,
                            icon: <GoDotFill/>,
                        };
                    } else {
                        return item;
                    }
                }));
            } else {
                //console.log('tab is not opened', 'tab-' + tabId)
            }
        });
    }, [subscribe]);

    useEffect(() => {
        return subscribe(EventType.SAVE, async () => {
            if (activeTabKeyRef.current) {
                const find = tabItemsRef.current.find((pane) => pane.key === activeTabKeyRef.current);
                //@ts-ignore
                if (find?.isNew) {
                    setOpen(true);
                    setTargetTabKey(activeTabKeyRef.current);
                } else {
                    publish(EventType.SAVE_FILE, {});
                }
            } else {
                console.log('activeTabKey is not found', tabItemsRef.current, activeTabKeyRef.current)
            }
        });
    }, [subscribe]);

    useEffect(() => {
        return subscribe(EventType.FILE_TOC, ({id, toc}) => {
            setTableOfContents(prevState => {
                return {...prevState, [id]: toc};
            });
        });
    }, [subscribe]);

    useEffect(() => {
        publish(EventType.FILE_ACTIVE, {id: activeTabKey})
    }, [activeTabKey]);

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Side onMenuClick={onMenuClick}/>
            <SplitPane split="vertical"
                       className={'main-content'}
                       onChange={(sizes) => {
                           debounce(setSideWidth, 50)(sizes[0]);
                       }}
            >
                <Pane
                    className={'main-side'}
                    initialSize={sideWidth}
                >
                    <div style={{
                        display: activeMenu === 'notes' ? 'block' : 'none',
                        height: '100%',
                        width: '100%',
                    }}>
                        <FolderTree onFileSelect={onFileSelected} width={sideWidth}/>
                    </div>

                    <div style={{display: activeMenu === 'toc' ? 'block' : 'none', height: '100%', width: '100%'}}>
                        <TableOfContentsList
                            id={activeTabKey?.substring(4)}
                            tableOfContents={tableOfContents[activeTabKey?.substring(4)]}
                        />
                    </div>
                    <div
                        style={{
                            display: activeMenu === 'search' ? 'block' : 'none',
                            height: '100%',
                            width: '100%'
                        }}>
                        <FullTextSearch onDocumentSelect={async (document: SearchableDocument) => {
                            console.log('Selected document:', document);
                            const key = crypto.MD5(document.path).toString(crypto.enc.Hex);
                            onFileSelected(key, document.path, document.title);
                        }}/>
                    </div>
                    <div style={{display: activeMenu === 'chat' ? 'block' : 'none', height: '100%', width: '100%'}}>
                        <Copilot/>
                    </div>
                </Pane>
                <Pane
                    className={'main-body'}
                    style={{backgroundColor: colorBgContainer}}
                >
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
                                        updateActiveTabAfterCloseTab(targetTabKey);
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
                                updateActiveTabAfterCloseTab(targetTabKey);
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
                          activeKey={activeTabKey} items={tabItems}
                          onChange={setActiveTabKey}
                        //@ts-ignore
                          onEdit={onTabEdit}
                    />
                </Pane>
            </SplitPane>
        </Layout>
    );
};

export default MainLayout;
