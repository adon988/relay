/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+relay
 */

'use strict';

const Relay = require('Relay');
const RelayFBNodeInterface = require('RelayOSSNodeInterface');
const RelayTestUtils = require('RelayTestUtils');

describe('RelayOSSNodeInterface', () => {
  let RelayRecordStore;

  const {getNode, getVerbatimNode} = RelayTestUtils;

  beforeEach(() => {
    jest.resetModuleRegistry();

    RelayRecordStore = require('RelayRecordStore');
  });

  it('creates results for argument-less custom root calls with an id', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        me {
          id
        }
      }`
    );
    const payload = {
      me: {
        id: '1055790163',
      },
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: '1055790163',
      result: payload.me,
      rootCallInfo: {storageKey: 'me', identifyingArgKey: null},
    }]);
  });

  it('creates results for argument-less custom root calls without an id', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        viewer {
          actor {
            id
          }
        }
      }
    `);
    const payload = {
      viewer: {
        actor: {
          id: '123',
       },
     },
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: 'client:1',
      result: payload.viewer,
      rootCallInfo: {storageKey: 'viewer', identifyingArgKey: null},
    }]);
  });

  it('creates results for custom root calls with an id', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        username(name:"yuzhi") {
          id
        }
      }
    `);
    const payload = {
      username: {
        id: '1055790163',
      },
    };

    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: '1055790163',
      result: payload.username,
      rootCallInfo: {storageKey: 'username', identifyingArgKey: 'yuzhi'},
    }]);
  });

  it('creates results for custom root calls without an id', () => {
    const store = new RelayRecordStore({});
    const query = getVerbatimNode(Relay.QL`
      query {
        username(name:"yuzhi") {
          name
        }
      }
    `);
    // no `id` value is present, so the root ID is autogenerated
    const payload = {
      username: {
        name: 'Yuzhi Zheng',
      },
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: 'client:1',
      result: payload.username,
      rootCallInfo: {storageKey: 'username', identifyingArgKey: 'yuzhi'},
    }]);
  });

  it('reuses ids for custom root calls without an id', () => {
    const store = new RelayRecordStore({});
    store.getDataID = jest.genMockFunction().mockReturnValue('client:12345');

    const query = getNode(Relay.QL`
      query {
        viewer {
          actor {
            id
          }
        }
      }
    `);
    const payload = {
      viewer: {
        actor: {
          id: '123',
        },
      },
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: 'client:12345',
      result: payload.viewer,
      rootCallInfo: {storageKey: 'viewer', identifyingArgKey: null},
    }]);
  });

  it('creates results for single identifying argument', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        node(id:"123") {
          id
        }
      }
    `);
    const payload = {
      node: {
        id: '123',
      },
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: '123',
      result: payload.node,
      rootCallInfo: {storageKey: 'node', identifyingArgKey: '123'},
    }]);
  });

  it('creates results for plural identifying arguments', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        nodes(ids: ["123","456"]) {
          id
        }
      }
    `);
    const payload = {
      nodes: [
        {
          id: '123',
        },
        {
          id: '456',
        },
      ],
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([
      {
        dataID: '123',
        result: payload.nodes[0],
        rootCallInfo: {storageKey: 'nodes', identifyingArgKey: '123'},
     },
      {
        dataID: '456',
        result: payload.nodes[1],
        rootCallInfo: {storageKey: 'nodes', identifyingArgKey: '456'},
     },
    ]);
  });

  it('creates results for null response', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        me {
          id
        }
      }`
    );
    const payload = {
      me: null,
    };
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: 'client:1',
      result: null,
      rootCallInfo: {storageKey: 'me', identifyingArgKey: null},
    }]);
  });

  it('creates results for undefined response', () => {
    const store = new RelayRecordStore({});
    const query = getNode(Relay.QL`
      query {
        me {
          id
        }
      }`
    );
    const payload = {};
    const result = RelayFBNodeInterface.getResultsFromPayload(
      store,
      query,
      payload
    );

    expect(result).toEqual([{
      dataID: 'client:1',
      result: null,
      rootCallInfo: {storageKey: 'me', identifyingArgKey: null},
    }]);
  });
});
