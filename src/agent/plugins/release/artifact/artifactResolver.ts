// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import releaseIfm = require('../lib/interfaces');
import context = require('../../../context');
import ifm = require('../../../api/interfaces');
import utilm = require('../../../utilities');
var unzip = require('unzip');
import httpclient = require('../../../api/httpclient');
import path = require('path');
var shell = require('shelljs');
import jenkinsArtifact = require('./jenkinsArtifact');

export class ArtifactResolver {
    constructor() {
    }

    public download(context: context.JobContext, agentArtifactDefinition: releaseIfm.AgentArtifactDefinition, artifactsFolder: string, asyncCallback): void {
        if (agentArtifactDefinition.artifactType === 'jenkins') {
            new jenkinsArtifact.JenkinsArtifact().download(context, agentArtifactDefinition, artifactsFolder, asyncCallback);
        }
    }
}