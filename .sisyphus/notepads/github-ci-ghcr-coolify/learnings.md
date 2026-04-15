- April 15, 2026: The runtime container contract stays stateless when the final
  Docker stage uses `CMD ["pnpm", "start"]`; database migrations must run as a
  separate operational step instead of during container startup.
- April 15, 2026: A root `.dockerignore` can safely exclude local agent folders,
  test artifacts, docs, screenshots, and repo metadata for this app because the
  Docker build only needs application source, config, `public/`, and lockfiles;
  the resulting build context dropped to about 1.32 MB in verification.
