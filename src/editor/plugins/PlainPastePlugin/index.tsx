import {$getSelection, COMMAND_PRIORITY_HIGH, createCommand, type LexicalCommand} from 'lexical';
import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from "@lexical/utils";
import {readText} from "@tauri-apps/plugin-clipboard-manager";

export const PLAIN_PASTE_COMMAND: LexicalCommand<void> = createCommand(
    'PLAIN_PASTE_COMMAND',
);

export default function PlainTextPastePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return mergeRegister(editor.registerCommand(
                PLAIN_PASTE_COMMAND,
                () => {
                    console.log('got plain paste command event')
                    readText().then((content) => {
                        console.log('content from clipboard', content)
                        if (!content) return false;

                        editor.update(() => {
                            const sel = $getSelection();
                            if (sel) {
                                sel.insertText(content);
                            } else {
                                console.log('selection is null')
                            }
                        });
                    })
                    return true;
                },
                COMMAND_PRIORITY_HIGH
            ),
        );
    }, [editor]);

    return null;
}
