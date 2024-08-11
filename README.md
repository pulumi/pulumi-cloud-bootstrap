# Pulumi Cloud Bootstrap

A prototype for bootstrapping a Pulumi Cloud account with all of the core capabilities for a standard Platform Team.

## Setup

Pre-requisites:
1. A Pulumi Organization
2. GitHub app configured for that org to connect to a GtiHub organization
3. This repo cloned into the same GitHub orgnanization
4. `cd bootstrap`
5. `pulumi stack init org`
6. `pulumi up`

Future: Ideally `pulumi new <this-template>` can be used to do step 3-6.