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

export let baseStacks: Record<string, pulumi.Output<string>> = {};

for (const env of ["dev" , "prod" ]) {

    const team = new pulumiservice.Team(env, {
        organizationName: orgName,
        name: env,
        teamType: "pulumi",
        description: `The ${env} team.`,
        members: [
            // TODO: Invite users and add them here.   
            "luke-pulumi-corp"
        ],
    });

    const baseStack = new pulumiservice.Stack(`base-${env}`, {
        organizationName: orgName,
        projectName: projectName,
        stackName: env,
    });

    const baseStackPermission = new pulumiservice.TeamStackPermission(`base-${env}`, {
        organization: orgName,
        project: projectName,
        stack: env,
        team: team.name.apply(name => name!),
        permission: pulumiservice.TeamStackPermissionScope.Admin,
    });
    
    const baseStackTag = new pulumiservice.StackTag(`base-${env}`, {
        organization: orgName,
        project: baseStack.projectName,
        stack: baseStack.stackName,
        name: "environment",
        value: env,
    });

    const github = getGitHubConfig();
    
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
    const baseDeployment = new command.local.Command(`deploy-base-${env}`, {       
        create: pulumi.interpolate`pulumi deployment run update --stack ${orgName}/${baseStack.projectName}/${baseStack.stackName} --suppress-stream-logs=false`,
        delete: pulumi.interpolate`pulumi deployment run destroy --stack ${orgName}/${baseStack.projectName}/${baseStack.stackName} --suppress-stream-logs=false`,
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
                environmentName: \${stack.base.environmentName}`));
    // TODO: The above hard codes the outputs of the `base-yaml` stack. It will need to be made general.

    const baseESCEnv = new pulumiservice.Environment(`base-${env}`, {
        organization: orgName,
        name: `base-${env}`,
        yaml: envYaml,
    });

    baseStacks[env] = pulumi.interpolate`https://app.pulumi.com/${orgName}/${baseStack.projectName}/${baseStack.stackName}`;
}

const templates = new pulumiservice.TemplateSource("templates", {
    organizationName: orgName,
    sourceName: "apps",
    sourceURL: remoteOriginUrl(),
    destination: {
        url: remoteOriginUrl(),
    }
});

async function getGitHubConfig() {
    const url = await remoteOriginUrl();
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
        paths: [baseProjectPath+"/**"],
        deployCommits: true,
        previewPullRequests: true,
    };
};

/**
const policyGroup = new pulumiservice.PolicyGroup("production", {

});

for (const stack in productionStacks) {
    new pulumiservice.PolicyGroupStack(stack, {
        policyGroup: policyGroup.name,
        stack: stack,
    });
}

for (const policy of ["soc2" , "pci-dss" ]) {
    const policyPack = new pulumiservice.PolicyPack({
        name: policy,
        source: new pulumi.asset.FileArchive("../policy/"+policy),
    });
    new pulumiservice.PolicyGroupPolicyPack(policy, {
        policyGroup: policyGroup.name,
        policyPack: policyPack.name,
    });

}
 */