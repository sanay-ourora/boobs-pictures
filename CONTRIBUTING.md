# Contributing to boobs.pictures

Thanks for helping build a joyful, useful home for booby seabird sightings.

## Before you start

- Search existing issues before opening a new one.
- Use an issue to discuss substantial features or changes in direction before investing significant time.
- Keep pull requests focused on one improvement.
- Do not include copyrighted photographs, private location data, credentials, or other people's personal information.
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Local development

This is a static HTML, CSS, and JavaScript project with no build step.

```sh
git clone https://github.com/sanay-ourora/boobs-pictures.git
cd boobs-pictures
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173` in a browser.

## Making a contribution

1. Fork the repository.
2. Create a branch from `main`, such as `feature/species-filter`.
3. Make and test your change on desktop and mobile.
4. Respect `prefers-reduced-motion` for new animation.
5. Commit with a concise description.
6. Open a pull request and explain the motivation, behavior, and visual impact.

Screenshots or short recordings are strongly encouraged for interface changes.

## Content and wildlife data

- Use common and scientific names accurately.
- Cite a reliable source when adding biological facts or distribution claims.
- Do not publish precise locations for sensitive nests or threatened wildlife.
- Never add a photograph unless its licensing and attribution are clear.

## Review and deployment

Maintainers review and merge pull requests. Hostinger automatically deploys commits merged into the protected `main` branch. Only maintainers can merge pull requests or change the hosting and domain configuration.
