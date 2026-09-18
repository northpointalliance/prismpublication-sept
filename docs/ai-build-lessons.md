# Lessons for building with AI agents/tools across repos

Portable. Drop this file into any repo's `docs/` folder and have whichever
agent works on it read this first. Nothing below is specific to this
project -- it is a compressed record of mistakes made and patterns that
actually prevented repeat mistakes, across a long, multi-tool build
session. Update it in place as new lessons show up; do not let it go
stale the way a status doc does, since a wrong lesson here is worse than
no lesson.

## 1. File sprawl from "vibe coding" is the single most expensive failure mode

Agentic coding tools (Cursor and similar) that generate freely without a
duplication check produce thousands of near-duplicate files over time:
`-v2`, `-copy`, `-new`, `-backup` variants, and worse, silent duplicates
with slightly different names that nothing ever cleans up. Left alone,
this also produces **ghost files** -- code that nothing imports or links
to anymore, but that still sits in the repo looking load-bearing, and
that a future agent (or human) wastes time editing under the belief it
does something.

Prevention, in order of leverage:

- **Search before creating.** Before writing any new file, grep the repo
  for similar names, similar purpose, or the same route/page/component.
  Treat "no existing file found" as a claim to verify, not an assumption.
- **Edit in place, never generate a parallel variant.** If you want to try
  something risky, use a git branch or commit, not a `-copy` file sitting
  next to the original. Git already gives you the undo button; a spare
  file in the working tree does not, it just accumulates.
- **Keep one current-state memory file per repo**, read first by every
  session before any other file. It should describe what's actually true
  right now: what's locked, what's rejected, what's open, key decisions
  and why. Update it the moment something changes, not at the end of a
  session -- a memory file that's one session behind is actively worse
  than no memory file, because it gets trusted anyway.
- **Periodically audit for orphaned files** (nothing references or
  imports them). Delete them or write down explicitly why they're kept.
  Do this as a standing task, not a one-time cleanup.

## 2. Static-hosting platforms silently reinterpret project type, and that produces broken deploys

Platforms like Cloudflare have more than one deployment model living
under similar tooling (for Cloudflare specifically: Pages, which deploys
static files plus optional serverless functions via a Git-connected
dashboard build, versus Workers, a single script deployed with its own
CLI command). An agent that doesn't know which model a project uses can
silently push it toward the other one -- adding a Worker-style entry
point to a config file meant for Pages, or running a Workers-style deploy
command on a project that's supposed to deploy only via Git push. The
result is a deploy that succeeds on the surface but breaks bindings,
serves the wrong thing, or fails outright, and it's confusing to debug
because both models look similar in the CLI and the dashboard.

Prevention: **pin the deployment model explicitly, in a file the agent
reads before touching any config or deploy command**, not something
inferred from context each session. State plainly: which platform,
which specific product/mode within it, which command is the *only*
correct deploy path, and which commands or config changes would silently
switch the project to a different mode. Treat any accidental drift
toward the wrong mode as a regression to fix immediately, not a
config choice to reconsider.

## 3. Byte-level file safety: never trust text-mode read/write on a repo with mixed line endings

A repo can have some files as CRLF, some as LF, sometimes mixed within a
single file, often from different tools/OSes touching it over time.
Scripting bulk edits (a Python script, a codemod, anything beyond a
single-file text-editor edit) using ordinary text-mode file I/O will
silently normalize every line ending in the file to whatever the
scripting language's default is. This turns a one-line intended change
into a diff touching the entire file, which is easy to miss if you only
glance at "files changed" and not the actual diff size.

Prevention: for any scripted, multi-file, or bulk edit, open files in
binary mode, detect the file's own line-ending convention, and preserve
it exactly, touching only the bytes you mean to change. After every
scripted edit, check the diff size before committing -- a diff far
larger than the intended change is a signal to stop and inspect, not to
proceed.

## 4. A related, sneakier bug: don't build strings by inserting raw binary/bytes objects into a template string

In Python specifically, `f"{some_bytes_object}"` renders as the literal
`repr()` of that object (e.g. `b'          '`), not its decoded content.
This is easy to miss because the diff still looks plausible at a glance
and the file still "changes" -- the corruption only becomes visible by
actually reading the rendered output, not by trusting line-count or
diff-shape checks alone. Whenever mixing byte-level and string-level
operations, decode explicitly and verify by reading real output, not
just by checking that *something* changed where expected.

## 5. Verify against live/production state, don't trust memory or docs

Status docs, memory files, and even your own prior turns in the same
session can describe a state that's already stale, sometimes in exactly
the wrong direction (claiming something is broken when it was already
fixed, or the reverse). Before asserting what's currently true about
behavior, data, or deployed state, check the actual source: the real
file content, the real database, the real production endpoint, the real
build log -- not a description of it. This mattered repeatedly: a local
git branch that looked current was actually stale relative to the
remote; a memory file confidently described a homepage layout that had
already been replaced; a claimed bug fix was verified by querying the
actual production database instead of re-reading the code and assuming.

## 6. When multiple tools/agents work the same repo without shared visibility, assume drift and say so

If a person uses more than one AI tool or session against the same
project, each one's plan is only as current as its last look at the
repo. A plan drafted in one tool can directly contradict work another
tool already shipped, and neither tool will know unless it's told or it
re-checks. When you find this kind of conflict, **flag it explicitly and
ask which version wins**, rather than silently picking one or blending
them. A later correction from the person can also arrive *after* an
earlier instruction was already executed and shipped -- check whether it
already happened before assuming "undo" is even still needed, and say so
either way.

## 7. Match UI/copy priority to the stated audience, not just the wording

Fixing the words on a page ("test your ad" instead of "draft an ad") while
leaving the old *hierarchy* in place (the AI-draft button still visually
primary, still listed first) is still wrong. Button order, which action
is styled as primary vs. secondary, and which link comes first in a list
all carry as much meaning to a user as the copy itself. When a stated
business priority changes, audit layout/ordering, not only text.

## 8. Ground external or business claims in real sources, every time

Never invent numbers, pricing, statistics, or business facts to fill a
gap in copy or documentation. When real data is needed (industry
pricing, a competitor's numbers, a measured stat) and the answer isn't
already known to be true internally, search for real current sources and
cite them with appropriate hedging ("reported," "commonly cited") rather
than presenting one source's number as settled fact. If the real answer
genuinely isn't knowable, say so and ask, rather than guessing
confidently.

## 9. Before a hard-to-reverse action, re-verify the precondition, don't assume it still holds

Before merging a branch, deploying to production, or deleting something,
re-check the thing you're relying on (a clean fast-forward, an empty
target, a confirmed backup) at that moment, not from a check done earlier
in the session -- state can have changed underneath you, especially if
anyone else, human or automated, can also touch the same repo or
environment.

## 10. Fragmented instructions arrive in pieces; don't act on a piece before the thought is finished

A person typing quickly, especially mid-task while other work is running,
will sometimes send a multi-part thought as several short messages in a
row. Recognize an obviously-incomplete sentence or trailing clause as
unfinished, keep working on whatever's already fully specified in the
meantime, and only synthesize a plan once the thought actually completes
-- guessing at the ending wastes more time than waiting a moment does.
