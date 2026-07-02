#!/usr/bin/env bash

# Auto-merge small, conflict‑free pull requests in the LC‑Tracker repository.
# This script lists open PRs, filters them based on size thresholds, and merges
# those that are mergeable without conflicts. Adjust thresholds before use.

# Configuration – adjust as needed
MAX_ADDITIONS=200   # maximum lines added (extended)
MAX_DELETIONS=200   # maximum lines removed (extended)
MAX_CHANGED_FILES=10 # maximum number of files changed (extended)

log(){
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log "Fetching open pull requests…"
pr_json=$(gh pr list --state open --json number,title,additions,deletions,changedFiles,mergeable,mergeStateStatus,author -q '.')

if [[ -z "$pr_json" || "$pr_json" == "[]" ]]; then
  log "No open pull requests found."
  exit 0
fi

echo "$pr_json" | jq -c '.[]' | while read -r pr; do
  number=$(echo "$pr" | jq -r '.number')
  title=$(echo "$pr" | jq -r '.title')
  additions=$(echo "$pr" | jq -r '.additions')
  deletions=$(echo "$pr" | jq -r '.deletions')
  changed_files=$(echo "$pr" | jq -r '.changedFiles')
  mergeable=$(echo "$pr" | jq -r '.mergeable')
  author=$(echo "$pr" | jq -r '.author.login')

  log "Evaluating PR #$number – $title (by $author)"
  log "  Additions: $additions, Deletions: $deletions, Files: $changed_files, Mergeable: $mergeable"

  if (( additions > MAX_ADDITIONS )) || (( deletions > MAX_DELETIONS )) || (( changed_files > MAX_CHANGED_FILES )); then
    log "  Skipping – exceeds size thresholds."
    continue
  fi

  if [[ "$mergeable" != "true" ]]; then
    # Fallback to mergeStateStatus when mergeable is null
    merge_state=$(echo "$pr" | jq -r '.mergeStateStatus')
    if [[ "$merge_state" != "MERGEABLE" && "$merge_state" != "CLEAN" ]]; then
      log "  Skipping – not mergeable (state: $mergeable / $merge_state)."
      continue
    fi
  fi

  log "  Merging PR #$number..."
  gh pr merge "$number" --squash --admin --delete-branch --body "Auto-merged by maintenance script."
  if [[ $? -eq 0 ]]; then
    log "  Successfully merged PR #$number."
  else
    log "  Failed to merge PR #$number. Review manually."
  fi
done

log "Auto‑merge run complete."
