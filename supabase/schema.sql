-- Chạy file này một lần trong Supabase: SQL Editor → New query → dán → Run.
-- Bảng lưu tiến độ học của từng tài khoản; mỗi người chỉ đọc/ghi được dòng của chính mình.

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "đọc tiến độ của mình" on public.user_progress;
create policy "đọc tiến độ của mình" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "thêm tiến độ của mình" on public.user_progress;
create policy "thêm tiến độ của mình" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "sửa tiến độ của mình" on public.user_progress;
create policy "sửa tiến độ của mình" on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "xoá tiến độ của mình" on public.user_progress;
create policy "xoá tiến độ của mình" on public.user_progress
  for delete using (auth.uid() = user_id);

-- ===== Quản trị =====
-- Danh sách email quản trị. Không mở chính sách nào nên không ai đọc/sửa được qua API;
-- chỉ thêm/bớt bằng SQL Editor hoặc qua hàm admin_set_admin (chỉ quản trị viên gọi được).
create table if not exists public.app_admins (
  email text primary key
);
alter table public.app_admins enable row level security;

insert into public.app_admins (email) values ('hoangvantrung24102k@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Danh sách người dùng kèm tiến độ học, chỉ quản trị viên xem được.
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, name text, created_at timestamptz, last_sign_in_at timestamptz,
  confirmed boolean, is_admin boolean, progress jsonb, progress_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Không có quyền quản trị';
  end if;
  return query
    select u.id, u.email::text, coalesce(u.raw_user_meta_data ->> 'name', ''), u.created_at, u.last_sign_in_at,
           u.email_confirmed_at is not null,
           exists (select 1 from public.app_admins a where lower(a.email) = lower(u.email)),
           p.data, p.updated_at
    from auth.users u
    left join public.user_progress p on p.user_id = u.id
    order by u.created_at desc;
end;
$$;

-- Cấp hoặc gỡ quyền quản trị cho một email. Không tự gỡ quyền của chính mình.
create or replace function public.admin_set_admin(target_email text, make boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Không có quyền quản trị';
  end if;
  if make then
    insert into public.app_admins (email) values (lower(target_email)) on conflict do nothing;
  else
    if lower(target_email) = lower(auth.jwt() ->> 'email') then
      raise exception 'Không thể tự gỡ quyền của chính mình';
    end if;
    delete from public.app_admins where lower(email) = lower(target_email);
  end if;
end;
$$;

revoke execute on function public.is_admin() from anon, public;
revoke execute on function public.admin_list_users() from anon, public;
revoke execute on function public.admin_set_admin(text, boolean) from anon, public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_admin(text, boolean) to authenticated;
