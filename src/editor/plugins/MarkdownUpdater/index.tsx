import {useEffect} from 'react';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {PLAYGROUND_TRANSFORMERS} from "../MarkdownTransformers";
import {useFile} from "../../context/FileContext.tsx";

interface MarkdownUpdaterProps {
}

const MarkdownUpdater: React.FC<MarkdownUpdaterProps> = () => {
    const [editor] = useLexicalComposerContext();
    let file = useFile();

    useEffect(() => {
        if (file) {
            editor.update(() => {
                $convertFromMarkdownString(file.data.value, PLAYGROUND_TRANSFORMERS);
            });
        }
    }, [editor, file]);

    return null;
};

export default MarkdownUpdater;
