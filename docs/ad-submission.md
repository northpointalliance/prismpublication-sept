# Ad submission: allowed categories and compliance

Operator guide for creatives in the Prism chat-ad catalog. The homepage sandbox uses a smaller static slice: fitness, sleep tools, productivity.

## Who this is for

Advertisers, agencies, and publishers wiring the SDK. If a category is not listed as allowed, treat it as blocked until review.

## Creative rules

- Label every card **Sponsored via Prism**. The assistant reply must still make sense if the card is removed.
- One offer per turn. Frequency is a publisher setting.
- Destination URLs are https. Amazon Associates links use tag `prismpublicat-20` and `rel="sponsored"`.
- Topic text describes the product. Do not encode a user demographic into tags.
- Daily and lifetime budgets are required. Exhausted ads leave the pool.

## Matching floors (quote these)

| Signal | Floor | Miss |
|---|---|---|
| Cosine similarity, prompt vs creative | 0.65 | `null` |
| Match latency | Under 120ms | Fail closed to `null` |

## Allowed categories (current)

| Category | Example prompt overlap | Notes |
|---|---|---|
| Fitness and training gear | protein, gym, running, bands | User is already talking about training or equipment. |
| Sleep tools | sleep, sound machine, mask | Practical product ask. Not a clinical claim. |
| Productivity software | notes, docs, workspace, AI writing | Developer and knowledge-work bots. |

## Brand safety (review queue)

Reject impersonation of the assistant, weapons, explosives, political campaigning, gambling in wellness bots, alcohol or adult products on bots that are not age-gated 18+, and medical or legal advice sold as a bot recommendation.

## Review path

1. Draft campaign and creative text.
2. Human review against this list.
3. Approve, reject with a reason, or request a rewrite.
4. Serve only while active, approved, inside budget, and above 0.65 cosine.

Questions: [info@prismpublication.com](mailto:info@prismpublication.com).
