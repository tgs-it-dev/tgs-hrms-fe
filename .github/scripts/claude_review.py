#!/usr/bin/env python3
"""
Fetches a PR diff, sends it to Claude for review, and posts the result as a PR comment.

Claude is explicitly instructed to review ONLY the lines changed in the diff —
it will not flag issues in unchanged code, pre-existing patterns, or the wider repo.

Required environment variables:
  GH_TOKEN           - GitHub token (for gh CLI)
  ANTHROPIC_API_KEY  - Anthropic API key
  PR_NUMBER          - Pull request number
  GITHUB_SHA         - Current commit SHA (provided automatically by Actions)
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request


def get_env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def fetch_pr_metadata(pr_number: str) -> dict:
    result = subprocess.run(
        ["gh", "pr", "view", pr_number, "--json", "title,body,baseRefName,additions,deletions,changedFiles,files"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def fetch_diff(pr_number: str, base_ref: str) -> str:
    """Fetch only the PR diff — not the full repo state."""
    try:
        result = subprocess.run(
            ["gh", "pr", "diff", pr_number],
            capture_output=True, text=True, check=True,
        )
        return result.stdout
    except subprocess.CalledProcessError:
        result = subprocess.run(
            ["git", "diff", f"origin/{base_ref}...HEAD"],
            capture_output=True, text=True, check=True,
        )
        return result.stdout


def truncate_diff(diff: str, max_bytes: int = 80_000) -> str:
    encoded = diff.encode("utf-8")
    if len(encoded) <= max_bytes:
        return diff
    truncated = encoded[:max_bytes].decode("utf-8", errors="replace")
    return truncated + "\n\n... [diff truncated — too large to display in full] ..."


def build_prompt(pr_title: str, pr_body: str, diff: str, changed_files: list[str]) -> str:
    files_list = "\n".join(f"  - {f}" for f in changed_files) if changed_files else "  (unavailable)"

    sections = [
        "You are a senior software engineer performing a pull-request code review.",
        "The project is a React 18 + TypeScript SPA (Vite, MUI v7, React Router v7).",
        "",
        "## CRITICAL CONSTRAINT — Scope of review",
        "You MUST review ONLY the lines that appear in the diff below.",
        "Do NOT comment on, flag, or suggest changes to:",
        "  - Code that is unchanged (context lines starting with a space in the diff)",
        "  - Files not listed in the changed files list",
        "  - Pre-existing patterns in the wider codebase",
        "  - Issues that existed before this PR",
        "If you spot a problem in unchanged context lines, ignore it — it is out of scope.",
        "Every issue you raise must be traceable to a `+` (added) or `-` (removed) line in the diff.",
        "",
        f"**PR title:** {pr_title}",
        "**PR description:**",
        pr_body or "(no description)",
        "",
        "**Changed files in this PR:**",
        files_list,
        "",
        "**Diff (only these changes are in scope for review):**",
        "```diff",
        diff,
        "```",
        "",
        "Please provide a structured code review with these sections:",
        "",
        "## Overview",
        "Brief summary of what this PR does (1–3 sentences).",
        "",
        "## Code Quality",
        "TypeScript correctness, React patterns, component design, naming, readability.",
        "Only flag issues introduced by lines marked `+` in the diff.",
        "",
        "## Issues & Risks",
        "Bugs, edge cases, security concerns, or performance problems introduced by this PR.",
        "For each issue include: severity (🔴 High / 🟡 Medium / 🟠 Low), the file and approximate line, and the problem.",
        "Omit this section entirely if there are no issues in the diff.",
        "",
        "## Suggestions",
        "Concrete improvements for the changed code with short code examples where helpful.",
        "Only suggest changes to lines that appear in this diff.",
        "",
        "## Verdict",
        "One of: ✅ **Approve** | ⚠️ **Request Changes** | 💬 **Comment**",
        "One-sentence rationale based solely on the diff.",
        "",
        "Keep the review concise and actionable. Use GitHub-flavoured markdown.",
    ]
    return "\n".join(sections)


def call_claude(prompt: str, api_key: str) -> str:
    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            response = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(body).get("error", {}).get("message", body)
        except Exception:
            detail = body
        return f"⚠️ Claude API returned HTTP {e.code}: {detail}"
    except urllib.error.URLError as e:
        return f"⚠️ Could not reach Claude API: {e.reason}"

    if "error" in response:
        err = response["error"]
        return f"⚠️ Claude API error: **{err.get('type', 'unknown')}** — {err.get('message', 'no message')}"

    if response.get("content"):
        return response["content"][0].get("text", "_(empty response)_")

    return "_(Claude returned an unexpected response format)_"


def find_existing_review_comment(pr_number: str, marker: str) -> str | None:
    """Return the comment ID if a previous Claude review comment exists, else None."""
    result = subprocess.run(
        ["gh", "pr", "comment", pr_number, "--list", "--json", "id,body"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return None
    try:
        comments = json.loads(result.stdout)
        for c in comments:
            if marker in c.get("body", ""):
                return str(c["id"])
    except Exception:
        pass
    return None


def post_or_update_comment(pr_number: str, body: str) -> None:
    """Post a new review comment. Each push gets a fresh comment (gh doesn't support edit via CLI easily)."""
    result = subprocess.run(
        ["gh", "pr", "comment", pr_number, "--body", body],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"gh pr comment stderr: {result.stderr}", file=sys.stderr)
        result.check_returncode()


def main() -> None:
    pr_number = get_env("PR_NUMBER")
    api_key   = get_env("ANTHROPIC_API_KEY")
    sha       = get_env("GITHUB_SHA", "")[:7]

    if not pr_number:
        sys.exit("PR_NUMBER is required")
    if not api_key:
        print("ANTHROPIC_API_KEY is not set — skipping Claude review", file=sys.stderr)
        sys.exit(0)

    print(f"Fetching PR metadata for #{pr_number}...")
    meta          = fetch_pr_metadata(pr_number)
    pr_title      = meta.get("title", "(no title)")
    pr_body       = (meta.get("body") or "").strip()
    base_ref      = meta.get("baseRefName", "main")
    additions     = meta.get("additions", 0)
    deletions     = meta.get("deletions", 0)
    changed_files = meta.get("changedFiles", 0)

    print(f"PR stats: +{additions} -{deletions} across {changed_files} file(s)")

    file_list = [f["path"] for f in meta.get("files", []) if f.get("path")]
    print(f"Changed files: {len(file_list)}")

    print(f"Fetching diff for PR #{pr_number} (base: {base_ref})...")
    raw_diff = fetch_diff(pr_number, base_ref)
    diff     = truncate_diff(raw_diff)

    print("Calling Claude API (diff-scoped review)...")
    prompt = build_prompt(pr_title, pr_body, diff, file_list)
    review = call_claude(prompt, api_key)

    comment = (
        "## Claude Code Review 🤖\n\n"
        + f"> Reviewing **{len(file_list)} changed file(s)** · `+{additions}` `−{deletions}` · commit `{sha}`\n\n"
        + review
        + "\n\n---\n"
        + "*Scope: this review covers only lines changed in this PR · "
        + "[Claude](https://www.anthropic.com/claude)*"
    )

    print(f"Posting review comment to PR #{pr_number}...")
    post_or_update_comment(pr_number, comment)
    print(f"Done — diff-scoped review posted to PR #{pr_number}")


if __name__ == "__main__":
    main()
