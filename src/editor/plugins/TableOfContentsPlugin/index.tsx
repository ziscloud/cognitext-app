/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {TableOfContentsPlugin as LexicalTableOfContentsPlugin} from '@lexical/react/LexicalTableOfContentsPlugin';

import {useFile} from "../../context/FileContext.tsx";
import {useEvent} from "../../../event/EventContext.tsx";
import {EventType} from '../../../event/event.ts';


export default function TableOfContentsPlugin() {
    const file = useFile();
    const {publish} = useEvent();
    return (
        <LexicalTableOfContentsPlugin>
            {(tableOfContents) => {
                publish(EventType.FILE_TOC, {id: file.tabId, toc: tableOfContents})
                return <></>;
            }}
        </LexicalTableOfContentsPlugin>
    );
}
