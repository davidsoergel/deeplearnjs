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

import {FileReaderStream} from './filereader_stream';

/**
 * Provide a stream of chunks from a URL.
 *
 * Note this utility first downloads the entire file into memory before
 * providing the first element from the stream.  This is because the Fetch API
 * does not yet reliably provide a reader stream for the response body.
 *
 * @param url A source URL string, or a `Request` object.
 * @param fileOptions Options passed to the underlying `FileReaderStream`s,
 *   such as {chunksize: 1024}.
 * @returns a Stream of Uint8Arrays containing sequential chunks of the
 *   input file.
 */
export async function createUrlReaderStream(
    url: RequestInfo, fetchOptions: RequestInit = {}, fileOptions = {}) {
  try {
    const response = await fetch(url, fetchOptions);
    if (response.ok) {
      return new FileReaderStream(await response.blob(), fileOptions);
    } else {
      return undefined;
    }
  } catch (e) {
    // Most errors take the path of !response.ok above.
    console.log(`FETCH EXCEPTION: ${e}`);
    return undefined;
  }
}
