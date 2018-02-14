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

import * as fetchMock from 'fetch-mock';

import {ShardedURLDataSource} from './sharded_url_data_source';

const testString = 'abcdefghijklmnopqrstuvwxyz';
const url = 'sharded_url';

function setupFetchMock() {
  // use an end: matcher so that we match both foo and http://localhost:xxx/foo
  fetchMock.get(`end:${url}.0`, testString.slice(0, 12));
  fetchMock.get(`end:${url}.1`, testString.slice(12, 17));
  fetchMock.get(`end:${url}.2`, testString.slice(17));
  fetchMock.get('*', 404);
}

describe('ShardedUrlDataSource', () => {
  afterEach(fetchMock.restore);

  it('Reads the entire file and then closes the stream, given a string url',
     done => {
       setupFetchMock();
       const readStreamPromise = new ShardedURLDataSource(url, 5, '', 1, {}, {
                                   chunkSize: 10
                                 }).getStream();
       // Note there will be separate chunks per shard, and also separate chunks
       // based on the chunksize.  Thus we expect the chunks:
       // "abcdefghij" "kl" "mnopq" "rstuvwxyz"
       readStreamPromise
           .then(readStream => readStream.collectRemaining().then(result => {
             expect(result.length).toEqual(4);
             const totalBytes =
                 result.map(x => x.length).reduce((a, b) => a + b);
             expect(totalBytes).toEqual(26);
           }))
           .then(done)
           .catch(done.fail);
     });

  it('Reads the entire file and then closes the stream, given a Request',
     done => {
       setupFetchMock();
       const readStreamPromise =
           new ShardedURLDataSource(new Request(url),5, '', 1, {}, {
            chunkSize: 10
          }).getStream();
       // Note there will be separate chunks per shard, and also separate chunks
       // based on the chunksize.  Thus we expect the chunks:
       // "abcdefghij" "kl" "mnopq" "rstuvwxyz"
       readStreamPromise
           .then(readStream => readStream.collectRemaining().then(result => {
             expect(result.length).toEqual(4);
             const totalBytes =
                 result.map(x => x.length).reduce((a, b) => a + b);
             expect(totalBytes).toEqual(26);
           }))
           .then(done)
           .catch(done.fail);
     });

  it('Reads chunks in order', done => {
    setupFetchMock();
    const readStreamPromise =
        new ShardedURLDataSource(url, 5, '', 1, {}, {
          chunkSize: 10
        }).getStream();
    readStreamPromise.then(readStream => readStream.collectRemaining())
        .then(result => {
          expect(result[0][0]).toEqual('a'.charCodeAt(0));
          expect(result[1][0]).toEqual('k'.charCodeAt(0));
          expect(result[2][0]).toEqual('m'.charCodeAt(0));
          expect(result[3][0]).toEqual('r'.charCodeAt(0));
        })
        .then(done)
        .catch(done.fail);
  });

  it('Reads chunks of expected sizes', done => {
    setupFetchMock();
    const readStreamPromise =
        new ShardedURLDataSource(url, 5, '', 1, {}, {
          chunkSize: 10
        }).getStream();
    readStreamPromise.then(readStream => readStream.collectRemaining())
        .then(result => {
          expect(result[0].length).toEqual(10);
          expect(result[1].length).toEqual(2);
          expect(result[2].length).toEqual(5);
          expect(result[3].length).toEqual(9);
        })
        .then(done)
        .catch(done.fail);
  });
});
