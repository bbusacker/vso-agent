import releaseIfm = require('../lib/interfaces');
import context = require('../../../context');
import http = require("http");

export interface AgentArtifactDefinition {
    name: string;
    version: string;
    artifactType: string;
    details: string;
}

export enum AgentArtifactType {
    xamlBuild,
    build,
    jenkins,
    fileShare,
    nuget,
    tfsOnPrem
}

export interface AgentJenkinsArtifactDetails{
    RelativePath: string;
    ConnectionName: string;
    JobName: string;
}

export interface IArtifact {
    download(context: context.JobContext, agentArtifactDefinition: releaseIfm.AgentArtifactDefinition, artifactsFolder: string, asyncCallback): void;
}

export interface IReleaseApi {
    getReleaseArtifactsDefinition(projectId: string, releaseId: number, onResult: (err: any, statusCode: number, agentArtifactDefinitions: AgentArtifactDefinition[]) => void): void;
}

export interface IJenkinsApi {
    downloadJenkinsArtifacts(requestUrl: string, destination: NodeJS.WritableStream, headers: any, onResult: (err: any, res: http.ClientResponse) => void): void;
}

export interface IQReleaseApi {
    getReleaseArtifactsDefinition(projectId: string, releaseId: number): Q.Promise<AgentArtifactDefinition[]>;
}