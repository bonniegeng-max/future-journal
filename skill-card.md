## Description:

Future Journal is a three-minute daily journaling skill. It ships a self-contained, offline
HTML journal page (49-day cycle, one theme per week) plus an original 49-prompt library and
a quality gate. Each day the user traces or types a guided sentence, then writes one thing
they want to happen **in the past tense**, and picks a mood word.

The included method and pacing are inspired by a published journaling practice book
(山田弘美 & 滨田真由美). This is **not an official product of that book** — no text from it
is used, and all 49 prompts are original.

This skill is ready for commercial/non-commercial use.

## Publisher:

[bonniegeng-max](https://clawhub.ai/user/bonniegeng-max)

### License/Terms of Use:

MIT

## Use Case:

Individuals and coaches use this skill to set up a low-friction daily writing habit that
shifts attention toward what the user wants to happen. Typical requests: "generate a fillable
journal page", "what sentence do I write today", "make a printable journal", or "add prompts
to the library".

## Deployment Geography for Use:

Global

## Known Risks and Mitigations:

Risk: A user may be confused into thinking this is the official companion to the referenced
book.

Mitigation: The non-official status is stated in SKILL.md, in the generated page itself
(in-product notice), in README.md, and on this card. The book title is used only to attribute
the method's origin.

Risk: The page can store personal journal entries in the browser's localStorage on the
user's own device.

Mitigation: No account and no network call are required — opened from `file://`, the page
sends zero requests. Entries never leave the device unless the user themselves pastes a sync
configuration string and sets an encryption password, in which case content is encrypted
end-to-end in the browser (PBKDF2 200k → AES-GCM-256) and only ciphertext is uploaded. The
page contains no hardcoded server address or key of any kind; the sync endpoint is always
supplied by the user. Local data can be exported as JSON at any time.

Risk: Journaling outputs are reflective and could be mistaken for therapeutic advice.

Mitigation: The skill does not diagnose, treat, or advise on mental health, and it does not
make decisions for the user. It only produces prompts and a writing surface.

## Reference(s):

- [ClawHub Skill Page](https://clawhub.ai/bonniegeng-max/skills/future-journal)
- [Design System & Accessibility Baseline](references/DESIGN.md)

## Skill Output:

**Output Type(s):** [html, markdown, local files]

**Output Format:** [A self-contained HTML journal page, plus plain-text answers and generated prompt data]

**Output Parameters:** [1D]

**Other Properties Related to Output:** [The HTML page is a single file whose core features need no network, is mobile-first, and is WCAG 2.2 AA compliant for text contrast, keyboard access and focus visibility. It can also be printed. Optional cloud sync is off by default and does not load any remote code until the user pastes their own backend config; when enabled it downloads one version-pinned, SRI-verified SDK and sends only client-side-encrypted ciphertext to the user's own backend (email and session token leave the device on login).]

## Skill Version(s):

1.0.3 (source: frontmatter, README.md)

## Ethical Considerations:

Users should evaluate whether this skill is appropriate for their environment, review any
generated or modified files before relying on them, and apply their organization's safety,
security, and compliance requirements before deployment. The bundled journal page is a
writing aid, not a substitute for professional mental-health support.
