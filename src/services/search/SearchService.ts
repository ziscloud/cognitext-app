import { Document } from 'flexsearch';
import { readTextFile, readDir } from '@tauri-apps/plugin-fs';
import {join} from "@tauri-apps/api/path";

export interface SearchableDocument {
  id: string;
  title: string;
  content: string;
  path: string;
  [key: string]: string; // Add index signature to satisfy DocumentData constraint
}

export class SearchService {
  private index: Document<SearchableDocument>;
  private documents: Map<string, SearchableDocument>;

  constructor() {
    this.index = new Document<SearchableDocument>({
      document: {
        id: 'id',
        index: ['title', 'content'],
        store: ['title', 'content', 'path']
      },
      tokenize: 'forward'
    });
    this.documents = new Map();
  }

  async indexDirectory(directoryPath: string): Promise<void> {
    console.log('Indexing directory:', directoryPath)
    try {

      const entries = await readDir(directoryPath);
      for (const entry of entries) {
        if (entry.isFile && entry.name?.endsWith('.md')) {
          const fullPath =  await join(directoryPath, entry.name);
          const content = await readTextFile(fullPath);
          const doc: SearchableDocument = {
            id: fullPath,
            title: entry.name,
            content,
            path: fullPath
          };

          this.documents.set(fullPath, doc);
          await this.index.add(doc);
        } else  if (entry.isDirectory) {
          if (entry.name.startsWith(".")) {
            console.log('skip the folder that start with dot', entry.name);
          } else {
            const dir = await join(directoryPath, entry.name);
            await this.indexDirectory(dir)
          }
        } else {
          //console.log(`Skipping non-file entry: ${entry.name}`);
        }
      }
    } catch (error) {
      console.error('Error indexing directory:', error);
      throw error;
    }
  }

  async search(query: string): Promise<SearchableDocument[]> {
    try {
      const results = await this.index.search(query, {
        enrich: true,
        suggest: true
      });

      const documents: SearchableDocument[] = [];

      for (const result of results) {
        if (result.result) {
          documents.push(...result.result.map(r => r.doc as SearchableDocument).filter(Boolean));
        }
      }

      return documents;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async reindexDocument(path: string): Promise<void> {
    try {
      const content = await readTextFile(path);
      const doc: SearchableDocument = {
        id: path,
        title: path.split('/').pop() || '',
        content,
        path
      };

      this.documents.set(path, doc);
      await this.index.update(doc);
    } catch (error) {
      console.error('Error reindexing document:', error);
      throw error;
    }
  }

  async removeFromIndex(path: string): Promise<void> {
    try {
      this.documents.delete(path);
      await this.index.remove(path);
    } catch (error) {
      console.error('Error removing document from index:', error);
      throw error;
    }
  }
}
