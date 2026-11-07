# Affiliate readiness

Reviewed: October 14, 2026

## Current position

- Live site: `https://survival-nexus.com/`
- The custom domain is configured in `CNAME`. Canonical, social, structured-data, sitemap, and robots URLs should all use this domain, not the GitHub Pages project URL.
- Commercial hub: `shop.html`
- Buyer guide: `gear-buyers-guide.html`
- Research comparison: `72-hour-gear-comparisons.html`
- Policies: `disclosure.html` and `privacy.html`
- Amazon links use `target="_blank"` and `rel="sponsored nofollow noopener"` and are visibly labeled as paid links.
- Run `node scripts/check-affiliate-links.mjs` whenever retailer links change.

## Comparison-page Amazon inventory

### Product links supplied in chat

- **Katadyn BeFree 1L**: [Amazon product page with Associates tracking](https://www.amazon.com/Katadyn-BeFree-Filter-Bottle-Its-Kind/dp/B0DT9J7MBC?th=1&linkCode=ll2&tag=survivalnexus-20&linkId=3d4ac0061dd64fc8d43449cf3bd1d4eb&language=en_US&ref_=as_li_ss_tl): ASIN `B0DT9J7MBC`; implemented.
- **Katadyn BeFree 1L share link**: [Amazon share link](https://link.amazon/A04aTyVwO): product verified, but not used because affiliate tracking was not detected.
- **Midland ER310**: [Amazon product page with Associates tracking](https://www.amazon.com/Midland-Emergency-Multiple-Flashlight-Ultrasonic/dp/B015QIC1PW?th=1&linkCode=ll2&tag=survivalnexus-20&linkId=090074fa30539bec89a159ef9a262309&language=en_US&ref_=as_li_ss_tl): ASIN `B015QIC1PW`; the existing `amzn.to` link is used on the site because it is shorter and reaches the same product.
- **Nitecore NB10000 Gen4 share link**: [Amazon share link](https://link.amazon/B0fqpQTEF): exact product and ASIN `B0H61KHJ1X` verified, but not used because affiliate tracking was not detected.

Exact affiliate destinations already available and now used on the comparison page:

- Sawyer Squeeze SP129: `https://amzn.to/3TuTplJ`
- Katadyn BeFree 1.0L: ASIN `B0DT9J7MBC`, full SiteStripe Associates link supplied and implemented
- Midland ER310: `https://amzn.to/4pPGDu8`

Exact affiliate destinations still needed before buttons can be added:

- MSR Guardian Purifier: [open exact-model Amazon search](https://www.amazon.com/s?k=MSR+Guardian+Purifier)
- Midland ER310PRO: [open exact-model Amazon search](https://www.amazon.com/s?k=Midland+ER310PRO)
- Nitecore NB10000 Gen4: [open exact-model Amazon search](https://www.amazon.com/s?k=Nitecore+NB10000+Gen4) (do not reuse the existing Gen II link)
- Anker Zolo 10K 30W, model A1688: [open exact-model Amazon search](https://www.amazon.com/s?k=Anker+Zolo+10K+30W+A1688)
- Goal Zero Venture 35: [open exact-model Amazon search](https://www.amazon.com/s?k=Goal+Zero+Venture+35)

For each missing item, open the search while signed into the approved Amazon Associates account, select the exact product, and use **SiteStripe → Get Link → Text → Short Link**. Confirm the product title/model at the destination before copying the `amzn.to` URL. Do not substitute a nearby model merely to create a paid link.

Paste the resulting links into this table before implementation:

| Exact product | SiteStripe short link |
| --- | --- |
| Katadyn BeFree 1.0L | Implemented: ASIN `B0DT9J7MBC`, full SiteStripe link with `survivalnexus-20` tag |
| MSR Guardian Purifier | Pending |
| Midland ER210 | Intentionally omitted: retained for specification comparison; ER310 is the current retailer option |
| Midland ER310PRO | Pending |
| Nitecore NB10000 Gen4 | Pending: exact ASIN `B0H61KHJ1X` verified; supplied `link.amazon` share URL was not an Associates link |
| Anker Zolo 10K 30W (A1688) | Pending |
| Goal Zero Venture 35 | Pending |
