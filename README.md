# Lanja & Kyle Wedding Website

An original Cloudflare Worker + Static Assets wedding site inspired by the information architecture of the reference Zola wedding page.

## Local preview

This is a static site. Serve the project root with any local static server, or use the Cloudflare CLI once configured.

## Schedule data

Edit [`public/data/schedule.csv`](public/data/schedule.csv) in GitHub. The browser fetches that CSV at runtime and renders the schedule cards.

## Cloudflare

`wrangler.jsonc` is the deployment config for the Worker named `lanjaandkyle`. Deploy from this directory with Wrangler after signing in. The currently created `workers.dev` Worker is a bootstrap deployment that fetches the GitHub `main` branch, so repo edits are visible without a manual upload. For production, connect this repository to Cloudflare Workers Builds and let the `wrangler.jsonc` Static Assets configuration perform the native asset deployment.

## Custom domain / DNS

The Worker can first be previewed on its `workers.dev` URL. To use a custom domain, add the domain to the same Cloudflare account, move the domain's authoritative nameservers from the current registrar/DNS host to Cloudflare, verify existing records, then attach the hostname to this Worker. Keep the old Zola redirect in place until the new hostname has been tested; after cutover, remove the redirect or update it to point at the new site.
