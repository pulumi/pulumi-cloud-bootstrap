# Pulumi Cloud Bootstrap

A prototype for bootstrapping a Pulumi Cloud account with all of the core capabilities for a standard Platform Team.

The goal is to provide a starting point in Pulumi Cloud where "most" core Pulumi Cloud features are used, to piece together a working "platform team" setup.

There are three layers:
* Pulumi Cloud infrastructure (teams, access tokens, policy, orgtemplates, etc.)
* Shared base infrastructure per "environment" (Stack, DeploymentSettings, Environment, ReviewStacks)
* Per-app-team infrastructure ()



## Setup

Pre-requisites:
1. A Pulumi Organization
2. GitHub app configured for that org to connect to a GtiHub organization
3. This repo cloned into the same GitHub orgnanization
4. `cd bootstrap`
5. `pulumi stack init org`
6. `pulumi up`

Future: Ideally `pulumi new <this-template>` can be used to do step 3-6.

TODO:
- [ ] Policy
- [ ] Org Templates (Iaro)
- [ ] AWS EKS + Kubernetes version of base (Rob)
- [ ] Workload org templates
- [ ] Ability to deploy via NPW
- [ ] A nice first-class UX in Pulumi Cloud to deploy this without NPW
