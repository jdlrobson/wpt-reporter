/**
 * @fileoverview Collect the metrics from the WebPageTest JSON.
 * @author Peter Hedenskog
 * @copyright (c) 2015, Peter Hedenskog <peter@wikimedia.org>.
 * Released under the Apache 2.0 License.
 */

'use strict';


module.exports = {
    /**
     * Collect the metrics we want from the giant WebPageTest JSON. We always
     * collect values from the median run.
     * @param {object} wptJson The JSON returned from the WebPageTest API
     * @param {array} argv The input parameters for the run.
     */
    collect: function(wptJson, argv) {
        var self = this;
        var metricsToSend = {
            timings: {},
            requests: {},
            sizes: {}
        };
        var namespace = argv.namespace;

        var emulateMobile = argv.emulateMobile;
        var firstViewOnly = argv.first;
        var metricsToCollect = argv.metrics.split(',');

        var views = ['firstView'];
        if (!firstViewOnly) {
            views.push('repeatView');
        }

        views.forEach(function(view) {
            if (wptJson.data.median[view]) {
                // if we are missing browser info from WPT (happens when using MotoG at least)
                // use a normalized version of the location
                // the browser/location can then look like Dulles_MotoG_Motorola_G_Chrome
                // but since there are no standard of naming it should be ok to just use what we got
                var browser = wptJson.data.median[view].browser_name ?
                    wptJson.data.median[view].browser_name.replace(/ /g, '_') :
                    wptJson.data.location.replace(/[^A-Za-z_0-9]/g, '_').replace(/__+/g, '_');

                if (emulateMobile) {
                    browser += '-emulateMobile';
                }

                // the actual location is the first part of the location string
                // separated by either a : or _
                var location = wptJson.data.location.split(/:|_/)[0];

                var keyStart = namespace + '.' + location + '.' + browser + '.' + view + '.';

                metricsToCollect.forEach(function(metric) {
                metricsToSend.timings[keyStart + metric] = wptJson.data.median[view][metric];
            });

                if (wptJson.data.median[view].userTimes) {
                    Object.keys(wptJson.data.median[view].userTimes).forEach(function(userTiming) {
                    metricsToSend.timings[keyStart + userTiming] =
                        wptJson.data.median[view].userTimes[userTiming];
                });
                } else {
                    console.error('Missing user timing metrics for view ' + view);
                }

                // collect sizes & assets
                Object.keys(wptJson.data.median[view].breakdown).forEach(function(assetType) {
                metricsToSend.requests[keyStart +
                    assetType + '.requests'] = wptJson.data.median[view].breakdown[assetType].
                requests;
                metricsToSend.sizes[keyStart +
                    assetType + '.bytes'] = wptJson.data.median[view].breakdown[assetType].bytes;
            });
            } else {
                // When we get a result error 99998 from WebPageTest, the repeat view is left out
                // so then skip the data and log
                console.error('Missing view ' + view);
            }
        });

        return metricsToSend;
    }
};
