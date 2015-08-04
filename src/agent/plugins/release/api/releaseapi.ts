import ifm = require('../../../api/interfaces');
import httpm = require('../../../api/httpclient');
import restm = require('../../../api/restclient');
import releaseIfm = require('../lib/interfaces');
import Q = require("q");

export class ReleaseApi implements releaseIfm.IReleaseApi {
    collectionUrl: string;
    httpClient: httpm.HttpClient;
    restClient: restm.RestClient;

    constructor(collectionUrl: string, handlers: ifm.IRequestHandler[]) {
        this.collectionUrl = collectionUrl;
        this.httpClient = new httpm.HttpClient('vso-build-api', handlers);
        this.restClient = new restm.RestClient(collectionUrl, this.httpClient);
    }

    //
    // TODO: do options request to avoid path math
    //       or replace this with the auto-generated typescript client
    //
    public getReleaseArtifactsDefinition(projectId: string, releaseId: number, onResult: (err: any, statusCode: number, agentArtifactDefinitions: releaseIfm.AgentArtifactDefinition[]) => void): void {
        this.restClient.getJsonWrappedArray(projectId + "/_apis/ReleaseManagement/releases/" + releaseId + "/agentartifacts", onResult);
    }

}

export class QReleaseApi {
    _releaseApi: ReleaseApi;

    constructor(collectionUrl: string, handlers: ifm.IRequestHandler[]) {
        this._releaseApi = new ReleaseApi(collectionUrl, handlers);
    }

    public getReleaseArtifactsDefinition(projectId: string, releaseId: number): Q.Promise<releaseIfm.AgentArtifactDefinition[]> {
        var deferred = Q.defer<releaseIfm.AgentArtifactDefinition[]>();

        this._releaseApi.getReleaseArtifactsDefinition(projectId, releaseId, (err: any, statusCode: number, agentArtifactDefinitions: releaseIfm.AgentArtifactDefinition[]) => {
            if (err) {
                err.statusCode = statusCode;
                deferred.reject(err);
            }
            else {
                deferred.resolve(agentArtifactDefinitions)
            }
        });

        return deferred.promise;
    }
}