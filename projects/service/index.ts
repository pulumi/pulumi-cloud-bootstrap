import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
const image = config.require("image");
const port = config.requireNumber("port");

const org = pulumi.getOrganization();
const project = pulumi.getProject();
const stack = pulumi.getStack();
const base = new pulumi.StackReference("base", {
    name: `${org}/base/${stack}`,
});

const clusterId = base.getOutput("clusterId") as pulumi.Output<string>;

const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {});

const service = new awsx.ecs.FargateService(`${project}-${stack}`, {
    cluster: clusterId,
    assignPublicIp: true,
    taskDefinitionArgs: {
        container: {
            name: project,
            image: image,
            cpu: 128,
            memory: 512,
            essential: true,
            portMappings: [{
                containerPort: port,
                targetGroup: loadbalancer.defaultTargetGroup,
            }],
        },
    },
});

export const url = pulumi.interpolate`http://${loadbalancer.loadBalancer.dnsName}:${port}`;