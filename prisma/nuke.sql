/*
  Destructive database reset for CoverMe.

  This removes all application rows while keeping the tables, indexes,
  constraints, policies, triggers, functions, and Prisma migration history.

  To run intentionally, set the confirmation value for this session first:

    set app.confirm_nuke = 'NUKE';
    \i prisma/nuke.sql

  Or with psql from PowerShell:

    $env:PGOPTIONS = "-c app.confirm_nuke=NUKE"
    psql $env:DIRECT_URL -v ON_ERROR_STOP=1 -f prisma/nuke.sql
    Remove-Item Env:\PGOPTIONS

  Or with psql from a POSIX shell:

    PGOPTIONS="-c app.confirm_nuke=NUKE" psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f prisma/nuke.sql

  This intentionally does not truncate _prisma_migrations. That table tracks
  which migrations Prisma has already applied, and keeping it avoids confusing
  future Prisma migrate commands.
*/

begin;

do $$
begin
  if current_setting('app.confirm_nuke', true) is distinct from 'NUKE' then
    raise exception
      'Refusing to nuke database. Run: set app.confirm_nuke = ''NUKE''; then execute this script again.';
  end if;
end
$$;

truncate table
  public."CancellationRequest",
  public."PushSubscription",
  public."ShiftRequestTarget",
  public."CommunityMemberRole",
  public."CommunityMember",
  public."Shift",
  public."CommunityRole",
  public."Community",
  public."User"
restart identity cascade;

commit;
