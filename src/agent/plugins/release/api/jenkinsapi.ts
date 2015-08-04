import ifm = require('../../../api/interfaces');
import httpm = require('../../../api/httpclient');
import restm = require('../../../api/restclient');
import releaseIfm = require('../lib/interfaces');
import http = require("http");
import Q = require("q");

export class JenkinsApi implements releaseIfm.IJenkinsApi {
    httpClient: httpm.HttpClient;

    constructor(handlers: ifm.IRequestHandler[]) {
        this.httpClient = new httpm.HttpClient('vso-build-api', handlers);
    }

    public downloadJenkinsArtifacts(requestUrl: string, destination: NodeJS.WritableStream, headers: any, onResult: (err: any, res: http.ClientResponse) => void): void {
        this.httpClient.getFile(requestUrl, destination, headers, onResult);
    }
}