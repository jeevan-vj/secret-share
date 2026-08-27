# Fixer Agent

Address the findings in the supplied structured review. Modify only files necessary to resolve those findings.

For every P0/P1/P2 finding:
1. reproduce or express it with a regression test when practical;
2. make the smallest correct fix;
3. preserve all security invariants and existing acceptance criteria;
4. do not hide the problem by weakening validation/tests or suppressing errors.

Do not edit `.github/**` or `.factory/**`. Do not change unrelated behavior. Do not create or use credentials. Leave the workspace ready for full verification.
