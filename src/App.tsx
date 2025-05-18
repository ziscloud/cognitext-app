// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import {Menu, Submenu} from '@tauri-apps/api/menu';
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
    settingsWin.once('tauri://destroyed', async (e) => {
        await mainWin.setEnabled(true);
    });

    settingsWin.once('tauri://error', function (e) {
        // an error happened creating the webview
        console.log('settingsWin created Failed', e)
    });

    settingsWin.once('tauri://created', async (event) => {
        // bring Settings to front
        await mainWin.setEnabled(false);
        settingsWin.setFocus();
    })
}

async function initMenu() {
    const submenu = await Submenu.new({
        id: 'app',
        text: 'app',
        items: [
            {
                id: "settings",
                text: "Settings...",
                accelerator: macOS ? 'Cmd+,' : 'Ctrl+,',
                enabled: true,
                action: () => {
                    showSettings();
                }
            }
        ]
    });
    const submenu2 = await Submenu.new({
        text: "Real Actions",
        items: [
            {
                text: "Add one",
                enabled: true,
                action: () => {
                    alert("Test1")
                }
            },
            {
                text: "Alert",
                enabled: true,
                action: () => {
                    alert("Test")
                }
            }
        ]
    });

    const menu = await Menu.new({
        items: [submenu, submenu2]
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
