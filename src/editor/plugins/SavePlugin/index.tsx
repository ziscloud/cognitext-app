/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalCommand,} from 'lexical';
import {COMMAND_PRIORITY_EDITOR, createCommand,} from 'lexical';
import type {JSX} from 'react';
import {useEffect,} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {$convertToMarkdownString} from "@lexical/markdown";
import {PLAYGROUND_TRANSFORMERS} from "../MarkdownTransformers";
import {useFile} from "../../context/FileContext.tsx";
import {writeTextFile} from "@tauri-apps/plugin-fs";
import {getFileLocationById} from "../../../extensions/fileExplorer/folderTreeController.ts";

export const SAVE_COMMAND: LexicalCommand<void> = createCommand(
    'SAVE_COMMAND',
);

export default function SavePlugin(): JSX.Element {
    const [editor] = useLexicalComposerContext();
    const file = useFile();

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                SAVE_COMMAND,
                () => {
                    const markdown = $convertToMarkdownString(
                        PLAYGROUND_TRANSFORMERS,
                        undefined, //node
                        false,
                    );
                    const fileLocation = getFileLocationById(file.treeNodeId);
                    if (fileLocation) {
                        writeTextFile("/Users/shunyun/Documents/" + fileLocation, markdown).then(() => {
                            console.log('save is done.', fileLocation, markdown)
                        })
                    }
                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        );
    }, [editor]);


    return (
        <>

        </>
    );
}
