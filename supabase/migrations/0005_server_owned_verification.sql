-- Verification flags are owned by Supabase Auth, never by the client.
-- Before this migration a signed-in user could run `update profiles set phone_verified = true` through the
-- "owner updates" policy. profiles.phone_verified is now a mirror of auth.users.phone_confirmed_at, written
-- only by the trigger below. Client roles can still edit their name, country and onboarding state.

create or replace function public.guard_profile_verification() returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.phone_verified then raise exception 'phone_verified is set by the server'; end if;
    if tg_op = 'UPDATE' and new.phone_verified is distinct from old.phone_verified then raise exception 'phone_verified is set by the server'; end if;
  end if;
  return new;
end $$;
create trigger guard_verification before insert or update on public.profiles
  for each row execute function public.guard_profile_verification();

-- Mirror the confirmed phone from auth.users. Runs as the function owner, so the guard above lets it through.
create or replace function public.sync_phone_verified() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set phone_verified = (new.phone_confirmed_at is not null), updated_at = now()
  where user_id = new.id and phone_verified is distinct from (new.phone_confirmed_at is not null);
  return new;
end $$;
revoke execute on function public.sync_phone_verified() from public, anon, authenticated;
create trigger on_auth_user_phone_confirmed after update of phone_confirmed_at on auth.users
  for each row execute function public.sync_phone_verified();

-- Backfill rows that existed before the trigger.
update public.profiles p set phone_verified = (u.phone_confirmed_at is not null)
from auth.users u where u.id = p.user_id and p.phone_verified is distinct from (u.phone_confirmed_at is not null);
