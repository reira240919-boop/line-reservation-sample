-- 予約管理ツール（サンプル）: 初期テーブル作成
-- Supabaseダッシュボード → SQL Editor に貼り付けて実行してください

create extension if not exists "pgcrypto";

create table if not exists therapists (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- 受付期間（今日から何日先まで予約を受け付けるか）
alter table therapists add column if not exists booking_window_days integer not null default 60;

-- 当日の予約は、開始の何分前まで受け付けるか
alter table therapists add column if not exists min_booking_lead_minutes integer not null default 60;

-- 当日ご案内するZoomのURL（毎回同じURLを使う運用）
alter table therapists add column if not exists zoom_url text;

-- 予約が入ったときの通知先（管理者自身のLINEユーザーID）
alter table therapists add column if not exists notify_line_user_id text;

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null unique check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text
);

create table if not exists time_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  unique (date, start_time)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  client_name text not null,
  client_contact text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 相談したい悩み（複数選択）とコメント
alter table bookings add column if not exists concerns text[] not null default '{}';
alter table bookings add column if not exists comment text;

-- 予約者のLINEユーザーID（LIFF経由の予約で取得。自動送信の宛先に使う）
alter table bookings add column if not exists line_user_id text;

-- 相談済み一覧: 契約成立チェックとメモ
alter table bookings add column if not exists contracted boolean not null default false;
alter table bookings add column if not exists memo text;

-- 予約の変更・キャンセル履歴（誰がいつ操作したか）
alter table bookings add column if not exists updated_at timestamptz;
alter table bookings add column if not exists changed_by text check (changed_by in ('client', 'therapist'));

-- お客様自身による日程変更は1回まで（何度も変更されるのを防ぐ）
alter table bookings add column if not exists client_reschedule_used boolean not null default false;

-- リマインド・当日案内の二重送信を防ぐための送信済み記録
alter table bookings add column if not exists reminder_sent_at timestamptz;
alter table bookings add column if not exists zoom_link_sent_at timestamptz;

-- 同じ日時への二重予約（確定済み同士）を防ぐ
create unique index if not exists bookings_date_start_confirmed_uidx
  on bookings (date, start_time)
  where status = 'confirmed';

-- LINEの友だち（メッセージの送り先）
create table if not exists line_users (
  line_user_id text primary key,
  display_name text,
  followed_at timestamptz not null default now(),
  unfollowed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- LINEへ自動送信するメッセージの文面
create table if not exists message_templates (
  key text primary key,
  body text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- リマインド用の送信条件（予約完了メッセージでは使わないため NULL 可）
alter table message_templates add column if not exists send_days_before integer;
alter table message_templates add column if not exists min_lead_days integer;

-- 当日案内用（相談開始の何時間前に送るか）
alter table message_templates add column if not exists send_hours_before integer;

insert into message_templates (key, body)
values (
  'booking_confirmed',
  E'{お名前}様\n\nこのたびは無料相談のご予約ありがとうございます。\n下記の日程で承りました。\n\n▼ ご予約日時\n{日付} {開始時間}〜{終了時間}\n\n当日はオンライン（Zoom）で実施いたします。\nURLは当日改めてお送りいたしますので、少々お待ちください。\n\n※ 3日前までは、こちらのページからご自身で日程の変更・キャンセルができます。それ以降の変更・キャンセルは、お手数ですがLINEでご連絡ください。\n{管理用URL}\n\nどうぞよろしくお願いいたします。'
)
on conflict (key) do nothing;

insert into message_templates (key, body)
values (
  'booking_rescheduled',
  E'{お名前}様\n\nご予約日時を変更いたしました。\n\n▼ 変更前\n{変更前日付} {変更前開始時間}〜{変更前終了時間}\n\n▼ 変更後\n{日付} {開始時間}〜{終了時間}\n\n当日はオンライン（Zoom）で実施いたします。\nURLは当日改めてお送りいたします。\n\nどうぞよろしくお願いいたします。'
)
on conflict (key) do nothing;

insert into message_templates (key, body)
values (
  'booking_cancelled_by_client',
  E'{お名前}様\n\n下記のご予約をキャンセルいたしました。\n\n{日付} {開始時間}〜{終了時間}\n\nまたのご利用を心よりお待ちしております。'
)
on conflict (key) do nothing;

insert into message_templates (key, body)
values (
  'booking_cancelled_by_therapist',
  E'{お名前}様\n\n大変恐れ入りますが、都合により下記のご予約をキャンセルさせていただきました。\n\n{日付} {開始時間}〜{終了時間}\n\nご迷惑をおかけし申し訳ございません。改めてご都合の良い日程をお選びいただけますと幸いです。'
)
on conflict (key) do nothing;

insert into message_templates (key, body, send_hours_before)
values (
  'booking_zoom_link',
  E'{お名前}様\n\n本日はどうぞよろしくお願いいたします。\nお時間になりましたら、下記のURLからご参加ください。\n\n▼ 本日のご相談\n{日付} {開始時間}〜{終了時間}\n\n▼ 参加用URL\n{ZoomのURL}\n\n・5分ほど前から入室いただけます\n・入室後、こちらが承認するまで少しお待ちいただく場合があります\n・お顔出しは任意です。音声のみでもかまいません\n・つながらない場合は、このトークからお知らせください\n\nそれでは、後ほどお会いできるのを楽しみにしております。',
  1
)
on conflict (key) do nothing;

insert into message_templates (key, body, send_days_before, min_lead_days)
values (
  'booking_reminder',
  E'{お名前}様\n\nいよいよ明後日、無料相談の日となりました。\n下記の日程でお待ちしております。\n\n▼ ご予約日時\n{日付} {開始時間}〜{終了時間}\n\n当日のZoomのURLは、開始前にあらためてお送りいたします。\nどうぞよろしくお願いいたします。',
  2,
  5
)
on conflict (key) do nothing;

-- 初期の受付時間（毎日 10:00-21:00）。day_of_week: 0=日, 1=月, ... 6=土
insert into availability (day_of_week, start_time, end_time)
values (0, '10:00', '21:00'),
       (1, '10:00', '21:00'),
       (2, '10:00', '21:00'),
       (3, '10:00', '21:00'),
       (4, '10:00', '21:00'),
       (5, '10:00', '21:00'),
       (6, '10:00', '21:00')
on conflict (day_of_week) do nothing;
