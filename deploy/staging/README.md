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

## Deployment safety

The inherited `Build and Deploy` workflow is restricted to `main` on this branch. Its historical staging path targets the wrong west cluster and production image names; it is intentionally not triggered by staging pushes. Automatic on-prem staging deployment is not configured. Deployment remains manual, with frozen source exports, unique amd64 images, migration rehearsal where required, rollback capture, and digest/behavior readback.

Do not blindly apply this directory as a release step: it also contains stateful infrastructure. Rebuild only changed application images, pin their new digests, and roll only the intended application Deployments against the explicit staging context and namespace. Preserve environment variables, Secret references, private ingress, and network policies.

## Private snapshot

Staging holds private snapshot data. Never commit dumps, fixture credentials, signing keys, populated Secrets, or environment files. Production snapshot refresh is a separate destructive operation, not an application deployment. Keep AI, SSO, external integrations and public signup disabled unless explicitly authorized. Snapshot/refresh scripts have additional guards; do not invoke them just to update code.

Full private operational evidence and rollback locations are maintained separately under `~/nextcloud/Projects/Foligo/launch-readiness/` and `~/.foligo-staging-private/` on the operator host.
