# Deployment

The production website is deployed by Hostinger from the `main` branch of this repository.

## Release flow

1. Create a branch and open a pull request.
2. Review and merge the pull request into the protected `main` branch.
3. Hostinger automatically deploys the merged commit to `public_html`.
4. Verify the result at [boobs.pictures](https://boobs.pictures).

Direct pushes, force-pushes, and deletion of `main` are blocked. Hosting credentials and connection settings belong in Hostinger or GitHub settings, never in this repository.
