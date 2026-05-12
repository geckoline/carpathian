# Carpathian

## Expert Data Decision

As of May 9, 2026, the refactored app uses `Tier 2: Scholar + manual enrichment` as the target expert-profile workflow.

- Google Scholar is treated as the primary import source for academic profile scaffolding.
- Scholar-derived data can prefill fields such as `name`, `affiliation`, `profile image` when available, `research interests`, and publication/citation-oriented metrics.
- Manual enrichment remains required for fields that Scholar does not reliably expose, such as `country`, `degree`, `bio`, `email`, `ORCID`, `LinkedIn`, `Scopus`, and other curated profile actions.
- Expert cards therefore need to degrade gracefully when only a Scholar-level profile is available.
- Local portraits are served from `public/profile-pictures/{expert.id}.jpg`; for the current dummy dataset, those files are seeded locally so dev and production use the same asset contract.

This decision is intentionally reflected in the flipcard refactor: the expert-card UI must support strong partial profiles first, then improve as manual enrichment is added.
