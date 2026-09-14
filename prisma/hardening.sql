alter table public."User" enable row level security;
alter table public."Shift" enable row level security;
alter table public."Community" enable row level security;
alter table public."CommunityMember" enable row level security;
alter table public."CommunityRole" enable row level security;
alter table public."CommunityMemberRole" enable row level security;
alter table public."ShiftRequestTarget" enable row level security;

revoke all on table public."User" from anon, authenticated;
revoke all on table public."Shift" from anon, authenticated;
revoke all on table public."Community" from anon, authenticated;
revoke all on table public."CommunityMember" from anon, authenticated;
revoke all on table public."CommunityRole" from anon, authenticated;
revoke all on table public."CommunityMemberRole" from anon, authenticated;
revoke all on table public."ShiftRequestTarget" from anon, authenticated;
