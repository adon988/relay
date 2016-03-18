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

require('configureForRelayOSS');

jest.dontMock('RelayRenderer');

const React = require('React');
const ReactDOM = require('ReactDOM');
const Relay = require('Relay');
const RelayEnvironment = require('RelayEnvironment');
const RelayQueryConfig = require('RelayQueryConfig');
const RelayRenderer = require('RelayRenderer');
const RelayTestUtils = require('RelayTestUtils');

describe('RelayRenderer.renderArgs', () => {
  let MockContainer;

  let queryConfig;
  let environment;
  let render;

  beforeEach(() => {
    jest.resetModuleRegistry();

    const MockComponent = React.createClass({render: () => <div />});
    MockContainer = Relay.createContainer(MockComponent, {
      fragments: {},
    });

    const container = document.createElement('div');
    queryConfig = RelayQueryConfig.genMockInstance();
    environment = new RelayEnvironment();

    render = jest.genMockFunction();
    ReactDOM.render(
      <RelayRenderer
        Container={MockContainer}
        queryConfig={queryConfig}
        environment={environment}
        render={render}
      />,
      container
    );
    jasmine.addMatchers(RelayTestUtils.matchers);
    jasmine.addMatchers({
      toRenderWithArgs() {
        return {
          compare(actual, expected) {
            // Assume that if `forceFetch` requests exist, they were last.
            const requests = environment.forceFetch.mock.requests.length > 0 ?
              environment.forceFetch.mock.requests :
              environment.primeCache.mock.requests;
            actual(requests[requests.length - 1]);
            const renders = render.mock.calls;
            const renderArgs = renders[renders.length - 1][0];
            return {
              pass: Object.keys(expected).every(argName => {
                expect(renderArgs[argName]).toEqual(expected[argName]);
                return true;
              }),
            };
          },
        };
      },
    });
  });

  it('has default values before request is sent', () => {
    expect(() => {
      // Nothing.
    }).toRenderWithArgs({
      done: false,
      error: null,
      props: null,
      stale: false,
    });
  });

  it('is not `done` until request succeeds', () => {
    expect(request => request.block()).toRenderWithArgs({
      done: false,
      error: null,
      props: null,
      stale: false,
    });
    expect(request => request.succeed()).toRenderWithArgs({
      done: true,
      error: null,
      props: {},
      stale: false,
    });
  });

  it('has `error` when request fails before request is sent', () => {
    const error = new Error('Expected error.');
    expect(request => request.fail(error)).toRenderWithArgs({
      done: false,
      error,
      props: null,
      stale: false,
    });
  });

  it('has a `retry` function that retries the request', () => {
    const error = new Error('Expected error.');
    expect(request => request.fail(error)).toRenderWithArgs({error});

    const {retry} = render.mock.calls[1][0];
    expect(typeof retry).toBe('function');
    expect(environment.primeCache.mock.calls.length).toBe(1);
    retry();
    expect(environment.primeCache.mock.calls.length).toBe(2);
  });

  it('has a `retry` function that throws if called without failure', () => {
    expect(request => request.block()).toRenderWithArgs({error: null});

    const {retry} = render.mock.calls[1][0];
    expect(typeof retry).toBe('function');
    expect(() => retry()).toFailInvariant(
      'RelayRenderer: You tried to call `retry`, but the last request did ' +
      'not fail. You can only call this when the last request has failed.'
    );
  });
});
