import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const stack = pulumi.getStack();

const network = new awsx.ec2.Vpc(`vpc-${stack}`);
const cluster = new aws.ecs.Cluster(`cluster-${stack}`);

export const vpcId = network.vpcId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;
export const clusterId = cluster.id;
