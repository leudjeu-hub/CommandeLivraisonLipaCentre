---
description:  GHIS - Debug a failure in the existing FastAPI project.
agent: plan
---

# Debug

Debug the reported failure: $ARGUMENTS

Work from evidence, not guesses. Do not change code until you can state the cause.

## Reproduce

1. Run the smallest command that shows the failure.
2. Run everything with cwd = `backend/` (AGENTS.md: absolute `app.*` imports need it).
3. Capture the full traceback, not just the last line.

## Known baseline failures

These are red on `main` and are NOT caused by your change:

- `test_settings.py::test_default_database_url` - asserts the old Postgres default.
- `test_settings.py::test_email_test_user` - `Settings.EMAIL_TEST_USER` never existed.
- `test_seller_service.py::test_create_seller` - order-dependent `KeyError: 'DATABASE_URL'`.
- `ruff format --check .` - 5 files unformatted.

Compare against this baseline before blaming your edit.

## Common traps

- `KeyError: 'DATABASE_URL'` - a test popped it from `os.environ`; test isolation is broken.
- Import error on `app.*` - wrong cwd, or `PYTHONPATH` pointing at the repo root.
- `ConnectionRefused` on `/auth` - `frontend/.env` missing, so `VITE_API_URL` is unset and
  Vite has no `server.proxy`.
- Table not created - the model is never imported, so it is absent from `SQLModel.metadata`.
  Verify: `uv run python -c "import app.main; from sqlmodel import SQLModel; print(sorted(SQLModel.metadata.tables))"`
- Stale column after a field rename - there are no migrations; delete `backend/fastship.db`.

## Narrow it down

1. Trace the failing frame to its caller.
2. Check the surrounding code for the assumption that is violated.
3. State the root cause in one sentence.

## Report

- exact reproduction command
- root cause
- evidence (traceback frame, file:line)
- smallest possible fix

Do not apply a fix unless explicitly asked.