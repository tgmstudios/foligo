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

`.github/workflows/staging-ci.yml` validates staging topology and builds all three amd64 images on pushes to `staging`. Manual dispatch defaults both `deploy` and `db_refresh_accepted` to false. The deploy job only runs when both are true; it publishes immutable SHA-tagged images, captures registry digests, runs a one-off `prisma migrate deploy` Job using only the staging `DATABASE_URL` Secret key, patches just the `api`, `dashboard`, and `sites` container images, waits for rollouts, and checks the three private hosts. It never runs snapshot refresh, `db push`, or migration-history resolution.

`deploy/staging/scripts/release.sh` is the executable implementation. It verifies the on-prem context/namespace identity, rejects stale staging refs, uses digest-qualified images, records the prior image refs before mutation, and rolls application images back if a later step fails. Migration DDL is forward-only; application rollback does not reverse migrations. The script expects the runner's preconfigured Docker auth and an authorized kubeconfig; it does not consume credentials from GitHub secrets or workflow environment variables. The mock boundary regression test is `deploy/staging/scripts/test-release.sh`.

The production `Build and Deploy` workflow remains main-only and unchanged. Although migration rehearsal against a fresh production clone succeeded (six pending migrations applied; status and schema diff clean), the DB worker still owns the final staging restore/AI re-encryption/SSO handoff. Do not check `db_refresh_accepted` or `deploy` until that final state is verified and accepted.

Runtime access remains unfit for CI: from the exact live `tgmstudios-runners` pod, TCP to registry Service `10.43.33.191:5000` timed out and `127.0.0.1:32551` refused. The live runner service account impersonates as unrestricted `*.*` access (including Secret and workload create/patch/delete), far broader than acceptable, and must not be reused for release mutations. Required approval before activation: (1) provide runner-to-registry routing and push-only authentication scoped to `foligo-staging/*`; (2) provision a dedicated staging kubeconfig/identity, not the operator or current runner identity; (3) authorize only read/status and image patch for named application Deployments, plus migration execution through a constrained Job mechanism. Plain Kubernetes RBAC cannot constrain `create jobs` to a safe command, and `patch deployments` can alter more than just images; use a trusted release controller or admission policy enforcing the exact allowed Job template and image-only Deployment patch. The migration Job references only `DATABASE_URL` via `secretKeyRef`; the CI identity does not need Secret read access. No RBAC, NetworkPolicy, or routing changes were made.

## Deployment safety

Deployment remains manual, with frozen source exports, unique amd64 images, migration rehearsal where required, rollback capture, and digest/behavior readback. Never auto-run snapshot refresh or apply all manifests as part of application release.

Do not blindly apply this directory as a release step: it also contains stateful infrastructure. Rebuild only changed application images, pin their new digests, and roll only the intended application Deployments against the explicit staging context and namespace. Preserve environment variables, Secret references, private ingress, and network policies.

## Private snapshot

Staging holds private snapshot data. Never commit dumps, fixture credentials, signing keys, populated Secrets, or environment files. Production snapshot refresh is a separate destructive operation, not an application deployment. Keep AI, SSO, external integrations and public signup disabled unless explicitly authorized. Snapshot/refresh scripts have additional guards; do not invoke them just to update code.

Full private operational evidence and rollback locations are maintained separately under `~/nextcloud/Projects/Foligo/launch-readiness/` and `~/.foligo-staging-private/` on the operator host.
