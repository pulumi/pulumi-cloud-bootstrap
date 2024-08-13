import * as pulumi from "@pulumi/pulumi";
import * as pulumiservice from "@pulumi/pulumiservice";
import * as command from "@pulumi/command";
import remoteOriginUrl from "git-remote-origin-url";

const boostrapProject = pulumi.getProject();
const bootstrapStack = pulumi.getStack();
const orgName = pulumi.getOrganization();

const config = new pulumi.Config();
const baseProject = config.get("baseProject") || "base-yaml";
const baseProjectPath = `projects/${baseProject}`;

// Map the selected project to the Pulumi project name.
// TODO: We could read this from the filesystem instead of hadcoding it here.
const projectName = {
    "base-yaml": "base",
    "service": "service",
    "base": "base",
}[baseProject];
if (!projectName) {
    throw new Error(`The project ${baseProject} does not exist in this repository`)
}

const devAccessTeam = new pulumiservice.Team("dev", {
    organizationName: orgName,
    name: "dev",
    teamType: "pulumi",
    members: [
        // TODO: Invite users and add them here.   
        "luke-pulumi-corp"
    ],
});

const productionAccessTeam = new pulumiservice.Team("production", {
    organizationName: orgName,
    name: "production",
    teamType: "pulumi",
    members: [
        // TODO: Add yoruself and other admins here.
        "luke-pulumi-corp",
    ],
});

const prodAccessToken = new pulumiservice.TeamAccessToken("production", {
    name: "production2",
    organizationName: orgName,
    description: "Access token for the production team",
    teamName: productionAccessTeam.name.apply(name => name!), 
}, { deleteBeforeReplace: true });

// Give the production team access to the bootstrap stack
new pulumiservice.TeamStackPermission("boostrap-prod", {
    organization: orgName,
    project: boostrapProject,
    stack: bootstrapStack,
    team: productionAccessTeam.name.apply(name => name!),
    permission: pulumiservice.TeamStackPermissionScope.Admin,
});

// TODO:
// * Set up templates (environment, app)

export let baseStacks: Record<string, pulumi.Output<string>> = {};

for (const env of ["dev" , "prod" ]) {
    const baseStack = new pulumiservice.Stack(`base-${env}`, {
        organizationName: orgName,
        projectName: projectName,
        stackName: env,
    });

    const baseStackTag = new pulumiservice.StackTag(`base-${env}`, {
        organization: orgName,
        project: baseStack.projectName,
        stack: baseStack.stackName,
        name: "environment",
        value: env,
    });

    const github = remoteOriginUrl().then(url => {
        if (!url) {
            throw new Error("Bootstrap project requires being run within a Git repository with a remote origin.")
        }
        const regexp = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git/;
        const match = url.match(regexp);
        if (!match) {
            return {};
        }
        return {
            repository: `${match[1]}/${match[2]}`,
            paths: [baseProjectPath],
            deployCommits: true,
            previewPullRequests: true,
        };
    });
    
    const baseStackDeploymentSetting = new pulumiservice.DeploymentSettings(`base-${env}`, {
        organization: orgName,
        project: baseStack.projectName,
        stack: baseStack.stackName,
        sourceContext: {
            git: {
                repoDir: baseProjectPath,
                // TODO: Should this use different branches for deploying to dev and prod environments?
                branch: "main", 
            },
        },
        github: github,
    });

    // Trigger a deployment when the stack or deployment settings change
    // TODO: Should this be part of the `Stack` or `DeploymentSetting` resource to trigger this 
    // automatically on updates?
    const deployment = new command.local.Command(`deploy-base-${env}`, {       
        create: pulumi.interpolate`pulumi deployment run update --stack ${orgName}/${baseStack.projectName}/${baseStack.stackName}`,
        dir: baseStackDeploymentSetting.sourceContext.apply(source => `../${source.git!.repoDir}`),
        triggers: [baseStackDeploymentSetting.id, baseStack.id],
    });

    const envYaml = baseStack.stackName.apply(stackName => new pulumi.asset.StringAsset(`\
        values:
            stack:
                fn::open::pulumi-stacks:
                    stacks:
                        base:
                            stack: base/${stackName}
            pulumiConfig:
                baseEnvironmentName: \${stack.base.environmentName}`));

    const baseESCEnv = new pulumiservice.Environment(`base-${env}`, {
        organization: orgName,
        name: `base-${env}`,
        yaml: envYaml,
    });
    baseStacks[env] = pulumi.interpolate`https://app.pulumi.com/${orgName}/${baseStack.projectName}/${baseStack.stackName}`;
}

export const productionAccessToken = prodAccessToken.value;


