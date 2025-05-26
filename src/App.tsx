// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import {Menu, PredefinedMenuItem, Submenu} from '@tauri-apps/api/menu';
import {useEffect, useState} from "react";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {SETTINGS_FILE} from "./common/consts.ts";
import MainLayout from "./components/MainLayout.tsx";
import "./App.css";
import {SettingsProvider} from "./settings/SettingsContext.tsx";
import {listen} from "@tauri-apps/api/event";

const macOS = navigator.userAgent.includes('Macintosh')

async function showSettings() {
    const mainWin = await getCurrentWindow();
    // disable main so it can’t be interacted with :contentReference[oaicite:4]{index=4}
    // open the settings modal
    const settingsWin = new WebviewWindow('settings', {
        url: '/settings.html',
        title: 'Settings',
        width: 800,
        height: 600,
    });

    // when Settings closes, re-enable main
    //@ts-ignore
    settingsWin.once('tauri://destroyed', async (e) => {
        await mainWin.setEnabled(true);
    });

    settingsWin.once('tauri://error', function (e) {
        // an error happened creating the webview
        console.log('settingsWin created Failed', e)
    });
    //@ts-ignore
    settingsWin.once('tauri://created', async (event) => {
        // bring Settings to front
        await mainWin.setEnabled(false);
        settingsWin.setFocus();
    })
}

async function initMenu() {
    const appMenu = await Submenu.new({
        id: 'app',
        text: 'app',
        items: [
            {
                text: "About",
                enabled: true,
                action: () => {
                    alert("About")
                }
            },
            {
                id: "checkForUpdates",
                text: "Check For Updates...",
                enabled: true,
                action: () => {
                    alert("checkForUpdates")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            {
                id: "settings",
                text: "Settings...",
                accelerator: macOS ? 'Cmd+,' : 'Ctrl+,',
                enabled: true,
                action: () => {
                    showSettings();
                }
            },
            // await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            await PredefinedMenuItem.new({text: "Services", item: 'Services'}),
            await PredefinedMenuItem.new({text: "Hide", item: 'Hide'}),
            await PredefinedMenuItem.new({text: "HideOthers", item: 'HideOthers'}),
            await PredefinedMenuItem.new({text: "ShowAll", item: 'ShowAll'}),
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            await PredefinedMenuItem.new({text: "Quit", item: 'Quit'}),
        ]
    });
    const fileMenu = await Submenu.new({
        text: "File",
        items: [
            {
                text: "New File",
                enabled: true,
                accelerator: macOS ? 'Cmd+N' : 'Ctrl+N',
                action: () => {
                    alert("New File")
                }
            },
            {
                text: "New Folder",
                enabled: true,
                action: () => {
                    alert("New Folder")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            {
                text: "Save",
                enabled: true,
                action: () => {
                    alert("New Folder")
                }
            },
            {
                text: "Save As...",
                enabled: true,
                action: () => {
                    alert("New Folder")
                }
            },
            {
                text: "Save All",
                enabled: true,
                action: () => {
                    alert("New Folder")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            await PredefinedMenuItem.new({text: "CloseWindow", item: 'CloseWindow'}),
        ]
    });
    const editMenu = await Submenu.new({
        text: "Edit",
        items: [
            await PredefinedMenuItem.new({text: "Undo", item: 'Undo'}),
            await PredefinedMenuItem.new({text: "Redo", item: 'Redo'}),
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            await PredefinedMenuItem.new({text: "Copy", item: 'Copy'}),
            await PredefinedMenuItem.new({text: "Cut", item: 'Cut'}),
            await PredefinedMenuItem.new({text: "Paste", item: 'Paste'}),
            await PredefinedMenuItem.new({text: "SelectAll", item: 'SelectAll'}),
        ]
    });

    const windowMenu = await Submenu.new({
        text: "Window",
        items: [
            await PredefinedMenuItem.new({text: "Minimize", item: 'Minimize'}),
            await PredefinedMenuItem.new({text: "Maximize", item: 'Maximize'}),
            await PredefinedMenuItem.new({text: "Fullscreen", item: 'Fullscreen'}),
        ]
    });

    const helpMenu = await Submenu.new({
        text: "Help",
        items: [
            {
                text: "Help",
                enabled: true,
                action: () => {
                    alert("Help")
                }
            },
            {
                text: "Documentation",
                enabled: true,
                action: () => {
                    alert("Documentation")
                }
            },
            {
                text: "Show Release Notes",
                enabled: true,
                action: () => {
                    alert("Show Release Notes")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            {
                text: 'Tips and Tricks',
                enabled: true,
                action: () => {
                    alert("Tips and Tricks")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            {
                text: 'Report an Issue',
                enabled: true,
                action: () => {
                    alert("Report an Issue")
                }
            },
            await PredefinedMenuItem.new({text: "Separator", item: 'Separator'}),
            {
                text: 'View License',
                enabled: true,
                action: () => {
                    alert("View License")
                }
            }
        ]
    })

    const menu = await Menu.new({
        items: [appMenu, fileMenu, editMenu , windowMenu, helpMenu ]
    })

    const res = await (macOS ? menu.setAsAppMenu() : menu.setAsWindowMenu())
    console.log('menu set success', res);
}

async function loadSettings() {
    const hasSettings = await exists(SETTINGS_FILE, {baseDir: BaseDirectory.AppConfig});
    if (hasSettings) {
        const settingJson = await readTextFile(SETTINGS_FILE, {
            baseDir: BaseDirectory.AppConfig,
        });
        return JSON.parse(settingJson);
    } else {
        return {};
    }
}

function App() {
    // const [greetMsg, setGreetMsg] = useState("");
    const [settings, setSettings] = useState({});
    //
    // async function greet() {
    //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    //   setGreetMsg(await invoke("greet", { name }));
    // }
    useEffect(() => {
        initMenu();
        loadSettings().then((settings) => {
            if (settings) {
                setSettings(settings);
            }
        });
        listen('settings-updated', async (event) => {
            const payload = event.payload;
            // Process and save the settings
            //@ts-ignore
            const dirExists = await exists('', {baseDir: BaseDirectory.AppConfig});
            if (!dirExists) {
                await mkdir('', {baseDir: BaseDirectory.AppConfig, recursive: true});
            }
            await writeTextFile(SETTINGS_FILE, JSON.stringify(payload), {
                baseDir: BaseDirectory.AppConfig,
                create: true
            });
            //@ts-ignore
            setSettings(payload);
        });
    }, [])

    return (
        <SettingsProvider settings={settings}>
            <MainLayout/>
        </SettingsProvider>
    );
}

export default App;
