#!/usr/bin/env python3
"""
Fetches a PR diff, sends it to Claude for review, and posts the result as a PR comment.

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
        ["gh", "pr", "view", pr_number, "--json", "title,body,baseRefName"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def fetch_diff(pr_number: str, base_ref: str) -> str:
    # Try gh pr diff first, fall back to git diff
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


def build_prompt(pr_title: str, pr_body: str, diff: str) -> str:
    sections = [
        "You are a senior software engineer performing a pull-request code review.",
        "The project is a React 18 + TypeScript SPA (Vite, MUI v7, React Router v7).",
        "",
        f"**PR title:** {pr_title}",
        "**PR description:**",
        pr_body or "(no description)",
        "",
        "**Diff:**",
        "```diff",
        diff,
        "```",
        "",
        "Please provide a structured code review with these sections:",
        "",
        "## Overview",
        "Brief summary of what this PR does.",
        "",
        "## Code Quality",
        "TypeScript correctness, React patterns, component design, naming, readability.",
        "",
        "## Issues & Risks",
        "Any bugs, edge cases, security concerns, or performance problems.",
        "",
        "## Suggestions",
        "Concrete improvement ideas with short code examples where helpful.",
        "",
        "## Verdict",
        "One of: ✅ **Approve** | ⚠️ **Request Changes** | \U0001f4ac **Comment**",
        "One-sentence rationale.",
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


def post_comment(pr_number: str, body: str) -> None:
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
    meta     = fetch_pr_metadata(pr_number)
    pr_title = meta.get("title", "(no title)")
    pr_body  = (meta.get("body") or "").strip()
    base_ref = meta.get("baseRefName", "main")

    print(f"Fetching diff for PR #{pr_number}...")
    diff = truncate_diff(fetch_diff(pr_number, base_ref))

    print("Calling Claude API...")
    prompt = build_prompt(pr_title, pr_body, diff)
    review = call_claude(prompt, api_key)

    comment = (
        "## Claude Code Review \U0001f916\n\n"
        + review
        + f"\n\n---\n*Reviewed commit `{sha}` · Powered by [Claude](https://www.anthropic.com/claude)*"
    )

    print(f"Posting review comment to PR #{pr_number}...")
    post_comment(pr_number, comment)
    print(f"Done — review posted to PR #{pr_number}")


if __name__ == "__main__":
    main()
