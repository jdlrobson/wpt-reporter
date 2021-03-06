#!/usr/bin/env node

/**
 * @fileoverview The bin file to run.
 * @author Peter Hedenskog
 * @copyright (c) 2015, Peter Hedenskog <peter@wikimedia.org>.
 * Released under the Apache 2.0 License.
 */

'use strict';
var minimist = require('minimist');
var cli = require('../lib/cli');
var wpt = require('../lib/index');
var Promise = require('bluebird');

var argv = cli.getMinimistArgv(process.argv.slice(2));

if (argv.help) {
    cli.help();
    process.exit(0);
}

if (!cli.validateArgs(argv)) {
    process.exit(1);
}


if (argv.batch) {
    Promise.settle(wpt.runBatch(argv)).then(function(results) {
        var ok = 0;
        var failed = 0;
        results.forEach(function(result) {
            if (result.isFulfilled()) {
                ok++;
            } else {
                console.error('Failing test:', result.reason());
                failed++;
            }
        })
        console.log('We got ' + ok + ' working tests and ' + failed + ' failing tests');
        if (failed > 0) {
            process.exit(1);
        }
    })

} else {
    wpt.runTest(argv).catch(function(err) {
        console.error('Failing test:', err);
        process.exit(1);
    });
}
