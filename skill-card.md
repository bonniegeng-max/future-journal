## Description:

Creates an offline, single-file daily journal with a 49-day prompt cycle, printable pages, and optional encrypted cross-device sync.

This skill is ready for commercial/non-commercial use.

## Publisher:

[bonniegeng-max](https://clawhub.ai/user/bonniegeng-max)

### License/Terms of Use:

MIT

## Use Case:

Individuals and agents use this skill to provide a fillable or printable daily journal, select today's guided sentence, and support a 49-day reflective writing cycle. It is not a mental-health intervention or a task-management tool.

### Deployment Geography for Use:

Global

## Known Risks and Mitigations:

Risk: Clearing browser storage or changing browsers can erase locally saved entries.

Mitigation: Export and keep a backup of the journal before clearing storage or switching devices.

Risk: Enabling sync sends login details and encrypted journal data to the configured backend; an untrusted configuration could expose private account information.

Mitigation: Use only a backend configuration you control and understand; leave sync disabled when it is not needed.

Risk: Losing the sync password prevents recovery of the cloud copy, and access to the browser profile may expose local journal data.

Mitigation: Safeguard the sync password, protect the browser profile, and retain a separate backup.

## Reference(s):

- [Future Journal ClawHub release](https://clawhub.ai/bonniegeng-max/skills/future-journal)
- [Publisher profile](https://clawhub.ai/user/bonniegeng-max)
- [Journal design and accessibility reference](references/DESIGN.md)

## Skill Output:

**Output Type(s):** [Code, Text, Shell commands, Configuration instructions]

**Output Format:** [Single-file HTML journal and plain-text guidance]

**Output Parameters:** [1D]

**Other Properties Related to Output:** [Offline by default; optional encrypted sync requires a user-configured backend.]

## Skill Version(s):

1.0.4 (source: skill frontmatter and server-resolved release)

## Ethical Considerations:

Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment.
