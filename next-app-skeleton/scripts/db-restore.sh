#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${PROJECT_ROOT}/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env.local"
  set +a
fi

DUMP_PATH="${DB_DUMP_PATH:-${PROJECT_ROOT}/../backup/full_dump.sql}"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5433/bilsem_quiz}"

if [[ ! -f "${DUMP_PATH}" ]]; then
  echo "[db-restore] Dump dosyasi bulunamadi: ${DUMP_PATH}"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[db-restore] psql komutu bulunamadi. PostgreSQL client kurun."
  exit 1
fi

echo "[db-restore] Dump restore basliyor..."
echo "[db-restore] Source: ${DUMP_PATH}"
echo "[db-restore] Target: ${DATABASE_URL}"

echo "[db-restore] Not: psql surum uyumsuzlugu icin \\restrict/\\unrestrict satirlari filtreleniyor."
echo "[db-restore] Not: Supabase extension hatalari restore'u durdurmaz (best-effort)."
sed '/^\\restrict /d; /^\\unrestrict /d' "${DUMP_PATH}" | psql "${DATABASE_URL}" -v ON_ERROR_STOP=0

required_tables=(
  "public.profiles"
  "public.game_plays"
  "public.story"
  "public.story_questions"
  "public.exam_sessions"
  "public.packages"
)

missing_count=0
for table_name in "${required_tables[@]}"; do
  exists=$(psql "${DATABASE_URL}" -tAc "SELECT to_regclass('${table_name}') IS NOT NULL;")
  if [[ "${exists}" != "t" ]]; then
    echo "[db-restore] Eksik tablo: ${table_name}"
    missing_count=$((missing_count + 1))
  fi
done

if [[ ${missing_count} -gt 0 ]]; then
  echo "[db-restore] Kritik tablolar eksik. Restore basarisiz kabul edildi."
  exit 1
fi

echo "[db-restore] Tamamlandi. Kritik tablolar mevcut."
