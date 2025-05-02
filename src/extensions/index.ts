import {IExtension} from '@dtinsight/molecule/esm/model';
import {FirstExtension} from './fileExplorer';
import MDExtension from './markdown';

const extensions: IExtension[] = [
    new FirstExtension(),
    new MDExtension(),
];

export default extensions;
