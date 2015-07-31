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
import releaseInterfaces = require('./lib/interfaces');
import interfaces = require('../../api/interfaces');
var shell = require("shelljs");
var fs = require('fs');
import utilm = require('../../utilities');
var unzip = require('unzip');


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
     
    //Dirty code begins

    var httpcli = new httpclient.HttpClient('vso-build-api', [context.jobInfo.systemAuthHandler, new apivm.ApiVersionHandler('2.0-preview')]);
    var restCli = new restclient.RestClient(context.job.environment.variables[common.sysVars.collectionUri], httpcli);

    var callback1: (message: any) => void = (definiton: releaseInterfaces.AgentArtifactDefinition) => {
        //console.log('artifactname:' + definiton.Name);
    }

    var artifacrDefinition: releaseInterfaces.AgentArtifactDefinition[];
    try {
        restCli.getJsonWrappedArray(teamProjectId + "/_apis/ReleaseManagement/releases/" + releaseId.toString() + "/agentartifacts", (err: any, statusCode: number, artifactDefinition: releaseInterfaces.AgentArtifactDefinition[]) => {
            console.log('error in rest call:' + err);
            console.log('result of rest call:' + statusCode);
            artifactDefinition.forEach((definition: releaseInterfaces.AgentArtifactDefinition) => {
                if (definition.artifactType.toString() === 'jenkins')
                {
                    var jenkinsDetails: releaseInterfaces.AgentJenkinsArtifactDetails = JSON.parse(definition.details);
                    var jenkinsEndpoint: interfaces.JobEndpoint;
                    context.job.environment.endpoints.some((endpoint: interfaces.JobEndpoint) => {
                        if (endpoint.name === jenkinsDetails.ConnectionName)
                        {
                            jenkinsEndpoint = endpoint;
                            return true;
                        }
                    });

                    var artifactDonwloadFolder: string = path.join(artifactsFolder, definition.name);
                    console.log('artifactsFolder:' + artifactDonwloadFolder);
                    utilm.ensurePathExists(artifactDonwloadFolder).then(() => {

                        //var fileStream = fs.createWriteStream(path.join(artifactDonwloadFolder, 'download.zip'));
                        var fileStream = unzip.Extract({ path: artifactDonwloadFolder });
                        var headers = {};
                        headers['Authorization'] = 'Basic ' + new Buffer(jenkinsEndpoint.authorization['parameters']['Username'] + ':' + jenkinsEndpoint.authorization['parameters']['Password']).toString('base64');
                        var httpClient = new httpclient.HttpClient('vso-build-api', []);
                        httpClient.getFile('http://ashrat-test:8080//job/' + jenkinsDetails.JobName + '/' + definition.version.toString() + '/artifact/' + jenkinsDetails.RelativePath + '/*zip*/', fileStream, headers, function (err, res) {
                            if (err) {
                                console.log('some error while downloading:' + err.statusCode);
                                shell.rm('-rf', 'File does not exist on teh server');
                                //onResult(err, err.statusCode);
                            }
                            else if (res.statusCode > 299) {
                                console.log('unable to download file : ' + res.statusCode);
                                shell.rm('-rf', 'some file path');
                                //onResult(new Error('Unable to download file'), res.statusCode);
                            }
                            else {
                                console.log('successfully donwloaded file');
                                //onResult(null, res.statusCode);
                            }
                        });

                    })
                }
            });

            return;
        });
    }
    catch (error) {
        console.log('Excpetion thrown:' + error);

    }

    // Dirty code ends

    if (skipArtifactDownload) {
        context.info('Skipping artifact download based on the setting specified.')
        callback();
        return;
    }

    
    //
        console.log('ctx:job.environment.variables:' + context.job.environment.variables);

    callback();
    return;
    context.info('Leaving artifact downloads');
}
