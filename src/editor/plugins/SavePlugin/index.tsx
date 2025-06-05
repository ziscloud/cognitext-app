/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalCommand,} from 'lexical';
import {COMMAND_PRIORITY_EDITOR, createCommand,} from 'lexical';
import {JSX, useEffect} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {$convertToMarkdownString} from "@lexical/markdown";
import {PLAYGROUND_TRANSFORMERS} from "../MarkdownTransformers";
import {useFile} from "../../context/FileContext.tsx";
import {writeTextFile} from "@tauri-apps/plugin-fs";
import {message} from "antd";
import {useEvent} from "../../../event/EventContext.tsx";
import {EventType} from "../../../event/event.ts";

export const SAVE_COMMAND: LexicalCommand<void> = createCommand(
    'SAVE_COMMAND',
);

export default function SavePlugin(): JSX.Element {
    const [editor] = useLexicalComposerContext();
    const file = useFile();
    const [messageApi, contextHolder] = message.useMessage();
    const {publish, subscribe} = useEvent();

    const doSave = (markdown: string, path?: string) => {
        const fileLocation = path || file.path;
        if (fileLocation) {
            writeTextFile(fileLocation, markdown).then(() => {
                messageApi.open({
                    type: 'success',
                    content: 'File Saved',
                    style: {
                        marginTop: '40px',
                    },
                })
                    publish(EventType.FILE_SAVED, {
                        path: path,
                        file: file,
                        content: markdown,
                    });
            })
        }
    }

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                SAVE_COMMAND,
                ({path}) => {
                    const markdown = $convertToMarkdownString(
                        PLAYGROUND_TRANSFORMERS,
                        undefined, //node
                        false,
                    );
                    if (path) {
                        doSave(markdown, path.endsWith(".md") ? path : path + ".md");
                    } else {
                        doSave(markdown);
                    }
                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        );
    }, [editor]);

    useEffect(() => {
        return subscribe(EventType.SAVE_FILE, ({path}) => {
            editor.dispatchCommand(SAVE_COMMAND, {path:path})
        })
    }, [subscribe]);

    return (
        <>
            {contextHolder}
        </>
    );
}
