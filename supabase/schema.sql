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
