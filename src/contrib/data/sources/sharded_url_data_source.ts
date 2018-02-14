/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * =============================================================================
 */

import {DataSource} from '../datasource';
import {ByteStream} from '../streams/byte_stream';
import {streamFromConcatenated} from '../streams/data_stream';
import {streamFromIncrementing} from '../streams/data_stream';
import {createUrlReaderStream} from '../streams/url_stream';
/*
 * Represents a URL readable as a stream of binary data chunks.
 */
export class ShardedURLDataSource extends DataSource {
  /**
   * Create a `ShardedURLDataSource`.
   *
   * @param url A source URL string prefix, or a `Request` object.
   * @param options Options passed to the underlying `FileReaderStream`s,
   *   such as {chunksize: 1024}.
   */
  constructor(
      protected readonly url: RequestInfo,
      protected readonly integerDigits: number,
      protected readonly urlSuffix: string,
      protected readonly startFrom: number = 0,
      protected readonly fetchOptions: RequestInit = {},
      protected readonly fileOptions = {}) {
    // TODO(soergel): Simpler config, e.g via a regex or printf-like pattern.
    super();
  }

  async getStream(): Promise<ByteStream> {
    const shards = streamFromIncrementing(this.startFrom).map(i => {
      let request;
      if (this.url instanceof Request) {
        // retain all the requested options while munging the url
        request =
            new Request(this.url.url + this.pad(i) + this.urlSuffix, this.url);
      } else {
        request = this.url + this.pad(i) + this.urlSuffix;
      }
      const result =
          createUrlReaderStream(request, this.fetchOptions, this.fileOptions);
      return result;
    });
    return (await streamFromConcatenated(shards)) as ByteStream;
  }

  pad(value: number) {
    return ('0'.repeat(this.integerDigits) + value).slice(-this.integerDigits);
  }
}
