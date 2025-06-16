import {COMMAND_PRIORITY_NORMAL, createCommand, LexicalCommand,} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useCallback, useEffect} from 'react';
import {mergeRegister} from '@lexical/utils';
import {useFile} from "../../context/FileContext.tsx";

export const PRINT: LexicalCommand<void> = createCommand();

export function PrintPlugin() {
    const [editor] = useLexicalComposerContext();
    const file = useFile();

    const print = useCallback(() => {
        editor.update(async () => {
            if (file.fileName.endsWith(".md")) {
                document.title = file.fileName?.split('.').slice(0, -1).join('.')
            } else {
                document.title = file.fileName;
            }

            window.print();
        });
    }, [editor])


    // 1. Register the Ctrl+F command
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                PRINT,
                () => {
                    print();
                    return true; // Mark as handled
                },
                COMMAND_PRIORITY_NORMAL
            ),
        );
    }, [editor]);

    return (
        <>
        </>
    );
}
