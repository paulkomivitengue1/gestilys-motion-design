#!/usr/bin/env bash
# Génère localement une nappe musicale originale (aucun sample ou morceau tiers).
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/make-score.mjs
