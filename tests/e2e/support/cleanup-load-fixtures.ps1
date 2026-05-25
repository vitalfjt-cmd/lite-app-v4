param(
  [string]$Store = "",
  [switch]$DryRun
)

if ($Store) {
  $env:PW_CLEANUP_STORE = $Store
}

$args = @("tests/e2e/support/cleanup-load-fixtures.mjs")
if ($Store) {
  $args += "--store"
  $args += $Store
}
if ($DryRun) {
  $args += "--dry-run"
}

node @args
