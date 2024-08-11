import * as pulumi from "@pulumi/pulumi";
import * as pulumiservice from "@pulumi/pulumiservice";

const boostrapProject = pulumi.getProject();
const bootstrapStack = pulumi.getStack();
const orgName = pulumi.getOrganization();

const devAccessTeam = new pulumiservice.Team("dev", {
    organizationName: orgName,
    teamType: "pulumi",
    members: [
        // TODO: Invite users and add them here.   
    ],
});

const productionAccessTeam = new pulumiservice.Team("production", {
    organizationName: orgName,
    teamType: "pulumi",
    members: [
        // TODO: Add yoruself and other admins here.
    ],
});

const prodAccessToken = new pulumiservice.TeamAccessToken("production", {
    name: "production",
    organizationName: orgName,
    teamName: productionAccessTeam.id.apply(id => id!), 
});

// Give the production team access to the bootstrap stack
new pulumiservice.TeamStackPermission("boostrap-prod", {
    organization: orgName,
    project: boostrapProject,
    stack: bootstrapStack,
    team: devAccessTeam.id,
    permission: pulumiservice.TeamStackPermissionScope.Admin,
});

// TODO:
// * Set up templates (environment, app)
// * Create two instances of the environment (dev, prod)
// * Create ESC environments 

for (const env of ["dev" /*, "prod" */]) {
    const baseDevStack = new pulumiservice.Stack(`base-${env}`, {
        organizationName: orgName,
        projectName: "base",
        stackName: env,
    });
    
    const baseDevStackDeploymentSetting = new pulumiservice.DeploymentSettings(`base-${env}`, {
        organization: orgName,
        project: "base",
        stack: env,
        sourceContext: {},
        github: {
            repository: "lukehoban/",

        },
    });
}






// if(awsProductionRole) {
//     const productionEnv = new pulumiservice.Environment("aws-production", {
//         organization: orgName,
//         name: "aws-production",
//         yaml: new pulumi.asset.StringAsset(`\
//     values:
//         aws:
//             login:
//                 fn::open::aws-login:
//                     oidc:
//                         duration: 1h
//                         roleArn: ${awsProductionRole}
//                         sessionName: pulumi-environments-session
//                         subjectAttributes:
//                             - currentEnvironment.name
//                             - pulumi.user.login
//         environmentVariables:
//             AWS_ACCESS_KEY_ID: \${aws.login.accessKeyId}
//             AWS_SECRET_ACCESS_KEY: \${aws.login.secretAccessKey}
//             AWS_SESSION_TOKEN: \${aws.login.sessionToken}`)
//     });
//     const productionEnvPermission = new pulumiservice.TeamEnvironmentPermission("aws-production", {
//         organization: orgName,
//         environment: productionEnv.id,
//         permission: pulumiservice.EnvironmentPermission.Admin,
//         team: productionAccessTeam.id,
//     });
// }

// // for (const env of ["dev", "stage", "prod"]) {
// //     const stack = new pulumiservice.Stack("networking-production", {
// //         project: "networking",
// //         stack: "production",
// //         config: {
    
// //         },
// //     });


// // const settings = new pulumiservice.DeploymentSettings("production", {
// //     organization: orgName,
// //     project: stack.projec,
// //     stack: stack.stack,
// //     sourceContext: {
// //         git: {
// //             repoUrl: "https://github.com/demo/networking"
// //         },
// //     },
// //     github: {

// //     }
// // })

// // }

