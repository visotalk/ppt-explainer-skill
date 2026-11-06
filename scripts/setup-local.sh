#!/usr/bin/env bash
# Workspace-local Debian amd64 setup. No system directories are modified.
set -euo pipefail
SKILL_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_ROOT="${EXPLAINER_TOOLS:-/workspace/.local/slides-explainer}"
APT_ROOT="${EXPLAINER_APT_CACHE:-/workspace/.local/apt}"
VENV_ROOT="${EXPLAINER_VENV:-/workspace/.local/slides-explainer-venv}"
for command_name in node npm python3 ffmpeg ffprobe chromium apt-get dpkg-deb; do
  command -v "$command_name" >/dev/null || { echo "Missing prerequisite: $command_name" >&2; exit 1; }
done
test "$(dpkg --print-architecture)" = amd64 || { echo 'Local package bootstrap currently supports Debian amd64 only.' >&2; exit 1; }
if [[ ! -x "$TOOLS_ROOT/usr/lib/libreoffice/program/soffice" || ! -x "$TOOLS_ROOT/usr/bin/espeak-ng" ]]; then
  mkdir -p "$APT_ROOT/lists/partial" "$APT_ROOT/archives/partial" "$TOOLS_ROOT"
  . /etc/os-release
  [[ "${ID:-}" = debian && -n "${VERSION_CODENAME:-}" ]] || { echo 'Debian release metadata is required.' >&2; exit 1; }
  printf 'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian %s main\n' "$VERSION_CODENAME" > "$APT_ROOT/sources.list"
  apt_args=(-o Debug::NoLocking=true -o "Dir::Etc::sourcelist=$APT_ROOT/sources.list" -o Dir::Etc::sourceparts=- -o "Dir::State::lists=$APT_ROOT/lists" -o "Dir::Cache::archives=$APT_ROOT/archives" -o "APT::Sandbox::User=$(id -un)")
  apt-get "${apt_args[@]}" update
  apt-get "${apt_args[@]}" --download-only --no-install-recommends -y install libreoffice-impress espeak-ng
  for package_path in "$APT_ROOT"/archives/*.deb; do dpkg-deb -x "$package_path" "$TOOLS_ROOT"; done
  sha256sum "$APT_ROOT"/archives/*.deb > "$TOOLS_ROOT/package-checksums.txt"
fi
# Debian's maintainer scripts normally create these bootstrap resources. Relocate
# only the extracted copy; preserve signed original .deb archives in the cache.
python3 - "$TOOLS_ROOT" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1]).resolve()
program = root / 'usr/lib/libreoffice/program'
lib = root / 'usr/lib/x86_64-linux-gnu'
for p in root.rglob('*'):
    if p.is_symlink():
        target = p.readlink()
        local = root / str(target).lstrip('/')
        if target.is_absolute() and not str(target).startswith(str(root)) and local.exists():
            p.unlink()
            p.symlink_to(local)
p = program / 'fundamentalrc'
p.write_text(p.read_text().replace('BRAND_BASE_DIR=file:///usr/lib/libreoffice', 'BRAND_BASE_DIR=' + program.parent.as_uri()))
(lib / 'unorc').write_text((program / 'unorc').read_text().replace('${ORIGIN}', program.as_uri()))
for p in program.glob('*.so'):
    q = lib / p.name
    if not q.exists():
        q.symlink_to(p)
p = program.parent / 'share/registry/main.xcd'
target = program.parent / 'share/.registry/main.xcd'
if not p.exists() and target.exists():
    p.unlink(missing_ok=True)
    p.symlink_to(target)
PY
if [[ ! -x "$VENV_ROOT/bin/python" ]]; then python3 -m venv "$VENV_ROOT"; fi
"$VENV_ROOT/bin/pip" install -r "$SKILL_ROOT/requirements.txt"
cd "$SKILL_ROOT"
npm ci --no-audit --no-fund
EXPLAINER_PYTHON="$VENV_ROOT/bin/python" EXPLAINER_TOOLS="$TOOLS_ROOT" node scripts/explainer.mjs doctor
