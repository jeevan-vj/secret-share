# Cursor Automations wiring

These prompts are the version-controlled contracts for Cursor Automations.
Configure them at [cursor.com/automations](https://cursor.com/automations) (or `/automate`).

Prefer the **GitHub Actions + Cursor Agents API** path in `.github/workflows/factory.yml`
when `CURSOR_API_KEY` is set — that path is reliable today for issue intake.
Automations remain useful for PR review / CI fix loops and as a no-secret fallback.

## Recommended automations

| Name | Trigger | Prompt file | Tools |
| --- | --- | --- | --- |
| Factory implement | Issue comment containing `@cursor`, or webhook from Actions | `implement.md` | Open PR |
| Factory review | PR opened / ready for review (same-repo, linked factory issue) | `review.md` | Comment on PR |
| Factory fix | PR review submitted (changes requested) or CI failed on factory PR | `fix.md` | Open/update PR |

## Label state machine

`factory:ready` → `factory:delegated` → `factory:implementing` → `factory:review` → `factory:complete`

Escalation: `factory:needs-human`

## Trust boundary

- Cursor agents implement/review/fix only.
- GitHub Actions owns deterministic verify + risk classify + eligible auto-merge
  (`factory-controller.yml` on the default branch).
- Never put Cloudflare / auth / production secrets in the Cursor environment.
