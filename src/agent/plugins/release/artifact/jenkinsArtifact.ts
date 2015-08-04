// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import releaseIfm = require('../lib/interfaces');
import context = require('../../../context');
import ifm = require('../../../api/interfaces');
import utilm = require('../../../utilities');
//var unzip = require('unzip');
import httpclient = require('../../../api/httpclient');
import path = require('path');
var shell = require('shelljs');
import jenkinsapi = require('../api/jenkinsapi');
import fs = require('fs');
var zip = require('adm-zip');

export class JenkinsArtifact implements releaseIfm.IArtifact {
    public download(context: context.JobContext, agentArtifactDefinition: releaseIfm.AgentArtifactDefinition, artifactsFolder: string, asyncCallback): void {
        try {
            var jenkinsDetails: releaseIfm.AgentJenkinsArtifactDetails = JSON.parse(agentArtifactDefinition.details);
            var jenkinsEndpoint: ifm.JobEndpoint;
            context.job.environment.endpoints.some((endpoint: ifm.JobEndpoint) => {
                if (endpoint.name === jenkinsDetails.ConnectionName) {
                    jenkinsEndpoint = endpoint;
                    return true;
                }
            });

            if (jenkinsEndpoint === null) {
                asyncCallback('No ednpoint found in the job that corresponds to the jenkins connection:' + jenkinsDetails.ConnectionName);
            }

            var artifactDonwloadFolder: string = path.join(artifactsFolder, agentArtifactDefinition.name);
            console.log('artifactsFolder:' + artifactDonwloadFolder);
            utilm.ensurePathExists(artifactDonwloadFolder).then(() => {

                var zipSource = path.join(artifactDonwloadFolder, 'download.zip');
                var fileStream = fs.createWriteStream(zipSource);
                //var fileStream = unzip.Extract({ path: artifactDonwloadFolder });
                var headers = {};
                var username = this.getAuthParameter(jenkinsEndpoint, 'Username') || 'not supplied';
                var password = this.getAuthParameter(jenkinsEndpoint, 'Password') || 'not supplied';
                headers['Authorization'] = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
                var requestUrl = jenkinsEndpoint.url + '/job/' + jenkinsDetails.JobName + '/' + agentArtifactDefinition.version.toString() + '/artifact/' + jenkinsDetails.RelativePath + '/*zip*/';

                var JenkinsApi = new jenkinsapi.JenkinsApi([]);
                JenkinsApi.downloadJenkinsArtifacts(requestUrl, fileStream, headers, function (err, res) {
                    if (err) {
                        console.log('some error while downloading:' + err.statusCode);
                        asyncCallback('Error downloading the artifact:' + err);
                    }
                    else if (res.statusCode > 299) {
                        console.log('unable to download file : ' + res.statusCode);
                        asyncCallback("Unable to download the artifact");
                    }
                    else {
                        console.log('successfully donwloaded file');

                        try {
                            var file = new zip(zipSource);
                            file.extractAllTo(artifactDonwloadFolder, true);
                            shell.mv('-f', artifactDonwloadFolder + '\\archive\\*', artifactDonwloadFolder);
                            shell.rm('-rf', zipSource, artifactDonwloadFolder + '\\archive');

                            console.log('Sucessfully extracted file');
                            asyncCallback();
                        } catch (err) {
                            asyncCallback('Failed to extract zip: ' + zipSource);
                        }
                    }
                });

            })

        }
        catch (error) {
            asyncCallback(error);
        }
    }

    public getAuthParameter(endpoint: ifm.JobEndpoint, paramName: string) {
        var paramValue = null;

        if (endpoint && endpoint.authorization && endpoint.authorization['parameters']) {
            paramValue = endpoint.authorization['parameters'][paramName];
        }

        return paramValue;
    }

}