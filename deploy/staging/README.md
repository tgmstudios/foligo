# Foligo staging branch

`staging` is the integration branch for the private on-prem staging environment. It contains the launch-readiness feature work and the former `staging/onprem-snapshot` environment changes. That local snapshot branch is preserved as `staging-onprem-snapshot` because Git cannot store both `staging` and `staging/...` branch refs.

## Target

- Kubeconfig: `~/.kube/config`
- Context: `tgm-rke2-onprem`
- Namespace: `foligo-staging`
- Dashboard: `https://app-fstg.i.tgm.one`
- API: `https://api-fstg.i.tgm.one`
- Marketing: `https://fstg.i.tgm.one`
- Private staging-only image registry: `127.0.0.1:32551/foligo-staging` as seen by cluster nodes.

The application Deployment manifests pin the verified running image digests. API source is `c7babcff3761a5b4bb7029e30ce5c1178da42190`; dashboard source is `af85057219e4f211ca3080d50b41fbfe4a4136d3`; sites retain the prior verified staging-host build. A branch update alone does not deploy new code or update those image pins.

## CI and gated deployment

`.github/workflows/staging-ci.yml` runs only for pushes to `staging` (and manual dispatch), validates staging topology and builds all three amd64 images. Builds are intentionally not published while release prerequisites are pending. `workflow_dispatch` includes a `deploy` switch defaulting to false; selecting true currently fails closed and does not mutate the cluster.

The inherited `Build and Deploy` workflow remains restricted to `main`; production workflow and deployment path are unchanged. Do not enable a staging deploy implementation until the parent accepts the DB refresh/migration rehearsal, the CI runner can reach and authenticate to the staging-only registry, and an approved narrow staging deployment credential is available. The existing operator kubeconfig is not a GitHub Actions credential, and the staging registry service timed out from the current ARC runner; no RBAC, NetworkPolicy, or broad credentials were added.

After those gates are accepted, replace the failing `deployment-gate` job with a guarded staging-only release that publishes immutable SHA/digest images, runs `prisma migrate deploy` only after separate migration acceptance, captures rollback image refs, patches only the three application Deployments, and verifies rollout and private-host health. Never use the inherited west-cluster deployment path.

## Deployment safety

Deployment remains manual, with frozen source exports, unique amd64 images, migration rehearsal where required, rollback capture, and digest/behavior readback. Never auto-run snapshot refresh or apply all manifests as part of application release.

Do not blindly apply this directory as a release step: it also contains stateful infrastructure. Rebuild only changed application images, pin their new digests, and roll only the intended application Deployments against the explicit staging context and namespace. Preserve environment variables, Secret references, private ingress, and network policies.

## Private snapshot

Staging holds private snapshot data. Never commit dumps, fixture credentials, signing keys, populated Secrets, or environment files. Production snapshot refresh is a separate destructive operation, not an application deployment. Keep AI, SSO, external integrations and public signup disabled unless explicitly authorized. Snapshot/refresh scripts have additional guards; do not invoke them just to update code.

Full private operational evidence and rollback locations are maintained separately under `~/nextcloud/Projects/Foligo/launch-readiness/` and `~/.foligo-staging-private/` on the operator host.
