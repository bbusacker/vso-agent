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