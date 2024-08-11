import * as pulumi from "@pulumi/pulumi";

interface StackInputs {
    org: string;
    project: string;
    stack: string;
    preventNonEmptyDelete: boolean;
}

class StackProvider implements pulumi.dynamic.ResourceProvider {
    async create(inputs: StackInputs): Promise<pulumi.dynamic.CreateResult<any>> {
        const resp = await fetch(`https://api/pulumi.com/api/stacks/${inputs.org}/${inputs.project}`, {
            method: "POST",
            body: JSON.stringify({
                stackName: inputs.stack,
            }),
            headers: {
                "Authorization": `token pul-40176a9a423c44949bee43777e5f968d9bc319ac`,
                "Accept": "application/vnd.pulumi+8",
                "Content-Type": "application/json",
            },
        });
        await resp.text();
        return {
            id: `${inputs.org}/${inputs.project}/${inputs.stack}`,
        };
    }
    async delete(id: string, inputs: StackInputs): Promise<void> {
        let url = `https://api/pulumi.com/api/stacks/${inputs.org}/${inputs.project}/${inputs.stack}`;
        if (!inputs.preventNonEmptyDelete) {
            url += "?force=true";
        }
        const resp = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `token pul-40176a9a423c44949bee43777e5f968d9bc319ac`,
                "Accept": "application/vnd.pulumi+8",
                "Content-Type": "application/json",
            },
        });
        await resp.text();
        return;
    }
}

export class Stack extends pulumi.dynamic.Resource {
    constructor() {
        super(new StackProvider()provider: ResourceProvider, name: string, props: Inputs, opts?: resource.CustomResourceOptions, module?: string, type?: string);
    }
}