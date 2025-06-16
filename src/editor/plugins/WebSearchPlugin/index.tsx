import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useEffect} from 'react';
import {COMMAND_PRIORITY_LOW, createCommand, type LexicalCommand} from 'lexical';
import {openUrl} from "@tauri-apps/plugin-opener";

export const SEARCH_THE_WEB_COMMAND: LexicalCommand<string> = createCommand(
    'SEARCH_THE_WEB_COMMAND',
);

export default function WebSearchPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(SEARCH_THE_WEB_COMMAND, (query: string) => {
            if (query) {
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                openUrl(url).then(() => {
                    console.log('Opened URL', url)
                }).catch(() => {
                    console.error('Failed to open URL', url)
                }); // Tauri shell.open
            }
            return true;
        }, COMMAND_PRIORITY_LOW)
    }, [editor]);

    return null;
}
