-- 0005: generic triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','customers','services','appointments','gallery',
    'reviews','business_settings'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------------
-- Auto-create a profile row when a new auth user is created (magic-link
-- sign-in creates the auth.users row automatically). Default role = customer.
-- Also links/creates the matching public.customers row by email.
-- ------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  insert into public.profiles (id, role, email, full_name)
  values (new.id, 'customer', new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  -- Link to an existing customer record with the same email, if any; else create one.
  select id into v_customer_id from public.customers where lower(email) = lower(new.email) and profile_id is null limit 1;
  if v_customer_id is not null then
    update public.customers set profile_id = new.id where id = v_customer_id;
  else
    insert into public.customers (profile_id, full_name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
