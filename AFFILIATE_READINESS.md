# Affiliate readiness

Reviewed: October 2, 2026

AvantLink application status: **Submitted October 2, 2026 — awaiting ownership verification and compliance review.**

Ownership verification: AvantLink's exact legacy HTTP verification script was added to `index.html` locally; deployment and dashboard confirmation are still pending. Remove it after AvantLink confirms ownership.

## Current position

- Live site: `https://survival-nexus.com/`
- Commercial hub: `shop.html`
- Buyer guide: `gear-buyers-guide.html`
- Research comparison: `72-hour-gear-comparisons.html`
- Policies: `disclosure.html` and `privacy.html`
- Amazon links use `target="_blank"` and `rel="sponsored nofollow noopener"` and are visibly labeled as paid links.
- Run `node scripts/check-affiliate-links.mjs` whenever retailer links change.

## Comparison-page Amazon inventory

### Product links supplied in chat

- **Katadyn BeFree 1L** — [Amazon product page with Associates tracking](https://www.amazon.com/Katadyn-BeFree-Filter-Bottle-Its-Kind/dp/B0DT9J7MBC?th=1&linkCode=ll2&tag=survivalnexus-20&linkId=3d4ac0061dd64fc8d43449cf3bd1d4eb&language=en_US&ref_=as_li_ss_tl) — ASIN `B0DT9J7MBC`; implemented.
- **Katadyn BeFree 1L share link** — [Amazon share link](https://link.amazon/A04aTyVwO) — product verified, but not used because affiliate tracking was not detected.
- **Midland ER310** — [Amazon product page with Associates tracking](https://www.amazon.com/Midland-Emergency-Multiple-Flashlight-Ultrasonic/dp/B015QIC1PW?th=1&linkCode=ll2&tag=survivalnexus-20&linkId=090074fa30539bec89a159ef9a262309&language=en_US&ref_=as_li_ss_tl) — ASIN `B015QIC1PW`; the existing `amzn.to` link is used on the site because it is shorter and reaches the same product.
- **Nitecore NB10000 Gen4 share link** — [Amazon share link](https://link.amazon/B0fqpQTEF) — exact product and ASIN `B0H61KHJ1X` verified, but not used because affiliate tracking was not detected.

Exact affiliate destinations already available and now used on the comparison page:

- Sawyer Squeeze SP129: `https://amzn.to/3TuTplJ`
- Katadyn BeFree 1.0L: ASIN `B0DT9J7MBC`, full SiteStripe Associates link supplied and implemented
- Midland ER310: `https://amzn.to/4pPGDu8`

Exact affiliate destinations still needed before buttons can be added:

- MSR Guardian Purifier — [open exact-model Amazon search](https://www.amazon.com/s?k=MSR+Guardian+Purifier)
- Midland ER310PRO — [open exact-model Amazon search](https://www.amazon.com/s?k=Midland+ER310PRO)
- Nitecore NB10000 Gen4 — [open exact-model Amazon search](https://www.amazon.com/s?k=Nitecore+NB10000+Gen4) (do not reuse the existing Gen II link)
- Anker Zolo 10K 30W, model A1688 — [open exact-model Amazon search](https://www.amazon.com/s?k=Anker+Zolo+10K+30W+A1688)
- Goal Zero Venture 35 — [open exact-model Amazon search](https://www.amazon.com/s?k=Goal+Zero+Venture+35)

For each missing item, open the search while signed into the approved Amazon Associates account, select the exact product, and use **SiteStripe → Get Link → Text → Short Link**. Confirm the product title/model at the destination before copying the `amzn.to` URL. Do not substitute a nearby model merely to create a paid link.

Paste the resulting links into this table before implementation:

| Exact product | SiteStripe short link |
| --- | --- |
| Katadyn BeFree 1.0L | Implemented — ASIN `B0DT9J7MBC`, full SiteStripe link with `survivalnexus-20` tag |
| MSR Guardian Purifier | Pending |
| Midland ER210 | Intentionally omitted — retained for specification comparison; ER310 is the current retailer option |
| Midland ER310PRO | Pending |
| Nitecore NB10000 Gen4 | Pending — exact ASIN `B0H61KHJ1X` verified; supplied `link.amazon` share URL was not an Associates link |
| Anker Zolo 10K 30W (A1688) | Pending |
| Goal Zero Venture 35 | Pending |

## AvantLink application brief

Recommended application type: **Traditional publisher/affiliate**.

Website URL: `https://survival-nexus.com/`

Marketing name: `Survival Nexus`

Suggested promotional-method description:

> Survival Nexus publishes original, research-informed emergency preparedness, outdoor safety, and adaptive-readiness guides. Product coverage starts with practical use cases and compares manufacturer-documented specifications, limitations, maintenance needs, accessibility, and failure modes. Commercial pages are separated from safety education; paid links are clearly disclosed near each link, and researched products are not described as personally tested unless the test is documented.

Application strengths:

- Established custom-domain site with substantial original content.
- Clear outdoor, preparedness, and adaptive-equipment focus.
- Dedicated About, Contact, Privacy, and Affiliate Disclosure pages.
- Manufacturer-sourced comparison content and explicit evidence boundaries.
- Mobile-responsive pages and a repeatable affiliate-link compliance check.

User-supplied details required for submission:

- Legal first and last name
- Business/legal name or DBA, if any
- Email address
- Country and full mailing address
- Phone number
- Acceptance of AvantLink's current Terms of Use
- Any traffic/community metrics that accurately support the application

After submission, watch for AvantLink's ownership-verification email and complete its requested site-authentication step. If accepted, apply only to merchants relevant to existing content, then replace or supplement retailer links with exact product links generated inside AvantLink.

### Post-submission checklist

- [ ] Complete the ownership-verification instructions sent by AvantLink.
- [ ] Confirm the application status changes from pending to approved.
- [ ] Add tax and payment information only inside the authenticated AvantLink dashboard.
- [ ] Apply to relevant outdoor, emergency-preparedness, accessibility, and equipment merchants.
- [ ] Record each approved merchant, commission terms, attribution window, and prohibited promotional methods.
- [ ] Generate exact product links inside AvantLink rather than manually adding tracking parameters.
- [ ] Update the on-page disclosure to name AvantLink only after an active tracked link is published.
- [ ] Test every redirect and rerun `node scripts/check-affiliate-links.mjs` before deployment.
