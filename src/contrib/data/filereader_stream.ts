// inspired by https://github.com/maxogden/filereader-stream
import {DataStream} from './stream';

export interface FileReaderStreamOptions {
  /** The byte offset at which to begin reading the File or Blob. Default 0. */
  offset?: number;
  /** The number of bytes to read at a time. Default 1MB. */
  chunkSize?: number;
}

/**
 * Provide a stream of chunks from a File or Blob.
 * @param file The source File or Blob.
 * @param options Optional settings controlling file reading.
 * @returns a lazy Stream of Uint8Arrays containing sequential chunks of the
 *   input file.
 */
export class FileReaderStream extends DataStream<Uint8Array> {
  offset: number;
  chunkSize: number;

  constructor(
      protected file: File|Blob,
      protected options: FileReaderStreamOptions = {}) {
    super();
    this.offset = options.offset || 0;
    // default 1MB chunk has tolerable perf on large files
    this.chunkSize = options.chunkSize || 1024 * 1024;
  }

  async next(): Promise<Uint8Array|undefined> {
    if (this.offset >= this.file.size) {
      return undefined;
    }
    const chunk = new Promise<Uint8Array>((resolve, reject) => {
      // TODO(soergel): is this a performance issue?
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        let data = fileReader.result;
        // Not sure we can trust the return type of
        // FileReader.readAsArrayBuffer See e.g.
        // https://github.com/node-file-api/FileReader/issues/2
        if (data instanceof ArrayBuffer) {
          data = new Uint8Array(data);
        }
        if (!(data instanceof Uint8Array)) {
          return reject(new TypeError('FileReader returned unknown type.'));
        }
        resolve(data);
      };
      fileReader.onabort = (event) => {
        return reject(new Error('Aborted'));
      };
      fileReader.onerror = (event) => {
        return reject(new Error(event.error));
      };
      // TODO(soergel): better handle onabort, onerror
      const end = this.offset + this.chunkSize;
      // Note if end > this.file.size, we just get a small last chunk.
      const slice = this.file.slice(this.offset, end);
      // We can't use readAsText here (even if we know the file is text)
      // because the slice boundary may fall within a multi-byte character.
      fileReader.readAsArrayBuffer(slice);
      this.offset = end;
    });
    return chunk;
  }
}
