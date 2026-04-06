#!/usr/bin/env python3
"""
CineBlock Terminal CLI
Search for movies from your terminal using your CineBlock token.

Usage:
    python cineblock-cli.py
    CINEBLOCK_TOKEN=cb_... python cineblock-cli.py
"""

import sys
import os
import json

try:
    import urllib.request
    import urllib.error
except ImportError:
    print("Python 3.4+ required.")
    sys.exit(1)

BASE_URL = os.environ.get("CINEBLOCK_URL", "https://cineblock.in")
TOKEN_FILE = os.path.join(os.path.expanduser("~"), ".cineblock_token")


def api_post(path: str, token: str, body: dict | None = None) -> dict:
    url = f"{BASE_URL}{path}"
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"ok": False, "error": f"HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def load_saved_token() -> str:
    if os.path.isfile(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            return f.read().strip()
    return ""


def save_token(token: str) -> None:
    with open(TOKEN_FILE, "w") as f:
        f.write(token)


def print_movies(movies: list) -> None:
    if not movies:
        print("  No results found.")
        return
    for i, m in enumerate(movies, 1):
        year = m.get("year", "?")
        rating = m.get("rating", "N/A")
        title = m.get("title", "Unknown")
        overview = m.get("overview", "")
        print(f"\n  {i}. {title} ({year})  ★ {rating}")
        if overview:
            # Word-wrap at 72 chars
            words = overview.split()
            line = "     "
            for word in words:
                if len(line) + len(word) + 1 > 72:
                    print(line)
                    line = "     " + word
                else:
                    line += (" " if line.strip() else "") + word
            if line.strip():
                print(line)


def main() -> None:
    print()
    print("  ╔══════════════════════════════════════╗")
    print("  ║       CineBlock Terminal CLI         ║")
    print("  ╚══════════════════════════════════════╝")
    print()

    # Resolve token: env var → saved file → prompt
    token = (
        os.environ.get("CINEBLOCK_TOKEN", "").strip()
        or load_saved_token()
    )

    if not token:
        print("  Paste your CineBlock token from your profile page.")
        print(f"  (Get it at {BASE_URL}/profile)")
        print()
        try:
            token = input("  Token: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n  Bye!")
            sys.exit(0)

    if not token:
        print("  No token provided. Exiting.")
        sys.exit(1)

    # Validate token (no query = ping mode)
    print("\n  Validating token...", end=" ", flush=True)
    result = api_post("/api/cli", token)

    if not result.get("ok"):
        error = result.get("error", "Unknown error")
        print(f"FAILED\n\n  Error: {error}")
        if error == "Invalid token" or error == "Invalid token format":
            print("  → Make sure you copied the full token from your profile page.")
        sys.exit(1)

    name = result.get("name", "User")
    remaining = result.get("searchesRemaining", "?")
    print(f"OK")
    print(f"\n  Welcome, {name}!  ({remaining} searches left today)")

    # Save valid token for next time
    save_token(token)

    print("\n  Type a movie title to search. Type 'quit' to exit.")
    print("  ─────────────────────────────────────────────────")

    while True:
        print()
        try:
            query = input("  Search > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\n  Bye!")
            break

        if not query:
            continue
        if query.lower() in ("quit", "exit", "q"):
            print("\n  Bye!")
            break

        print("  Searching...", end=" ", flush=True)
        res = api_post("/api/cli", token, {"query": query})

        if not res.get("ok"):
            error = res.get("error", "Unknown error")
            print(f"FAILED\n  Error: {error}")
            if error in ("Daily limit reached",):
                print("  → You've used all 15 searches for today. Resets at midnight UTC.")
                break
            continue

        movies = res.get("movies", [])
        remaining = res.get("searchesRemaining", "?")
        print(f"done  ({remaining} searches left)")
        print_movies(movies)


if __name__ == "__main__":
    main()
