// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path = require('path');
var async = require('async');
import context = require('../../context');
import releaseConstants = require('./releaseConstants');
import common = require('../../common');

import httpclient = require('../../api/httpclient');
import restclient = require('../../api/restclient');
import apivm = require('../../api/handlers/apiversion');
import releaseIfm = require('./lib/interfaces');
import ifm = require('../../api/interfaces');
var shell = require("shelljs");
var fs = require('fs');
import utilm = require('../../utilities');
var unzip = require('unzip');
import releaseApi = require('./api/releaseapi');
import releaseVars = require('./lib/common');
import artifactResolver = require('./artifact/artifactResolver');


export function pluginName() {
    return "Download artifacts";
}

// what shows in progress view
export function pluginTitle() {
    return "pluginTitle: Downloading artifacts";
}

export function beforeJob(context: context.JobContext, callback) {
    context.info('Download artifacts initialized.');

    var skipArtifactDownload = context.job.environment.variables[releaseConstants.releaseVars.skipArtifactsDownload] === 'true';
    var releaseId = +context.job.environment.variables[releaseConstants.releaseVars.releaseId];
    var teamProjectId = context.job.environment.variables[common.sysVars.teamProjectId];
    var artifactsFolder = context.job.environment.variables[common.agentVars.buildDirectory];
    console.log(context.job.environment.variables);

    if (skipArtifactDownload) {
        context.info('Skipping artifact download based on the setting specified.')
        callback();
        return;
    }

    cleanUpArtifactsDirectory(context, artifactsFolder);

    var releaseClient = new releaseApi.QReleaseApi(context.service.collectionUrl, [context.jobInfo.systemAuthHandler, new apivm.ApiVersionHandler('2.0-preview')]);
    releaseClient.getReleaseArtifactsDefinition(teamProjectId, releaseId).then((agentArtifactDefinitions: releaseIfm.AgentArtifactDefinition[]) =>
    {
        async.forEach(agentArtifactDefinitions, function (agentArtifactDefinition, asyncCallback) {
            new artifactResolver.ArtifactResolver().download(context, agentArtifactDefinition, artifactsFolder, asyncCallback);
        }, function (err) {
                if (err) {
                    callback(err);
                    return;
                }

                context.job.environment.variables[releaseVars.releaseVars.agentReleaseDirectory] = artifactsFolder;
                context.job.environment.variables[releaseVars.releaseVars.systemArtifactsDirectory] = artifactsFolder;
                callback();
                return;
            });
    });
}

function cleanUpArtifactsDirectory(context: context.JobContext, artifactsFolder: string): void {
    shell.cd(context.workingDirectory);
    shell.rm('-rf', artifactsFolder);
    shell.mkdir('-p', artifactsFolder);
}


