# Cursor Google Style Skills

Google [style guide](https://google.github.io/styleguide/) rules as **Cursor Agent Skills** — one short skill and one detailed skill per language.

## What's included

**17 languages**, **34 skills** total:

| Language | Short skill | Detailed skill |
|----------|-------------|----------------|
| AngularJS | `google-angularjs-style` | `google-angularjs-style-detailed` |
| Common Lisp | `google-common-lisp-style` | `google-common-lisp-style-detailed` |
| C++ | `google-cpp-style` | `google-cpp-style-detailed` |
| C# | `google-csharp-style` | `google-csharp-style-detailed` |
| Go | `google-go-style` | `google-go-style-detailed` |
| HTML/CSS | `google-html-css-style` | `google-html-css-style-detailed` |
| JavaScript | `google-javascript-style` | `google-javascript-style-detailed` |
| Java | `google-java-style` | `google-java-style-detailed` |
| JSON | `google-json-style` | `google-json-style-detailed` |
| Markdown | `google-markdown-style` | `google-markdown-style-detailed` |
| Objective-C | `google-objective-c-style` | `google-objective-c-style-detailed` |
| Python | `google-python-style` | `google-python-style-detailed` |
| R | `google-r-style` | `google-r-style-detailed` |
| Shell | `google-shell-style` | `google-shell-style-detailed` |
| TypeScript | `google-typescript-style` | `google-typescript-style-detailed` |
| Vim script | `google-vimscript-style` | `google-vimscript-style-detailed` |
| XML | `google-xml-style` | `google-xml-style-detailed` |

- **Short skills** auto-invoke when you work in that language.
- **Detailed skills** load on demand; each short skill links to its detailed pair.

## First-time publish to GitHub

This environment cannot create the GitHub repo for you. Do this once:

1. Open [github.com/new](https://github.com/new)
2. Repository name: `cursor-google-style-skills`
3. **Do not** add a README, `.gitignore`, or license (repo must be empty)
4. Create the repository
5. Push from a machine with access:

```bash
cd cursor-google-style-skills
chmod +x scripts/publish.sh
./scripts/publish.sh https://github.com/YOUR_USERNAME/cursor-google-style-skills.git
```

Or manually:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cursor-google-style-skills.git
git branch -M main
git push -u origin main
```

## Install on your laptop

### 1. Clone this repo

```bash
git clone https://github.com/peterish8/cursor-google-style-skills.git
cd cursor-google-style-skills
```

### 2. Run the install script

**Copy** (recommended — skills live in `~/.cursor/skills/`):

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

**Symlink** (skills stay linked to the repo; `git pull` updates them):

```bash
./scripts/install.sh --symlink
```

### 3. Verify in Cursor

1. Restart Cursor (or open a new agent chat).
2. Go to **Settings → Rules → Agent Skills**.
3. You should see skills like `google-python-style`.

### Manual install

Copy skill folders into your personal skills directory:

```bash
mkdir -p ~/.cursor/skills
cp -R skills/* ~/.cursor/skills/
```

On Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\skills"
Copy-Item -Recurse -Force skills\* "$env:USERPROFILE\.cursor\skills\"
```

## Repo layout

```
cursor-google-style-skills/
├── README.md
├── skills/
│   ├── google-python-style/
│   │   └── SKILL.md
│   ├── google-python-style-detailed/
│   │   ├── SKILL.md
│   │   └── reference.md
│   └── ...
└── scripts/
    ├── install.sh
    └── generate_google_style_skills.py
```

## Regenerate from upstream

To refresh skills from [google/styleguide](https://github.com/google/styleguide):

```bash
git clone --depth 1 https://github.com/google/styleguide.git /tmp/google-styleguide
python3 scripts/generate_google_style_skills.py
./scripts/install.sh   # re-install locally
```

Update `OUTPUT_ROOT` in the generator to point at `./skills` before running (or run from repo root after adjusting the script).

## License

Skill content is derived from Google's style guides ([CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/)).
