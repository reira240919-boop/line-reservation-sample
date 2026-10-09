import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "..", "supabase", "schema.sql");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL が設定されていません（.env.local を確認してください）");
  process.exit(1);
}

const ssl = { rejectUnauthorized: false };

/**
 * 直接接続（db.*.supabase.co）は IPv6 専用のため、IPv6 が使えない回線では繋がらない。
 * その場合は IPv4 で到達できる Connection Pooler にフォールバックする。
 */
function poolerConfig() {
  const url = new URL(connectionString);
  const ref = url.hostname.replace(/^db\./, "").replace(/\.supabase\.co$/, "");
  if (!/^db\./.test(url.hostname) || !ref) return null;

  return {
    host: "aws-0-ap-northeast-1.pooler.supabase.com",
    port: 5432,
    user: `postgres.${ref}`,
    password: decodeURIComponent(url.password),
    database: "postgres",
    ssl,
  };
}

async function connect() {
  try {
    const direct = new Client({ connectionString, ssl, connectionTimeoutMillis: 8000 });
    await direct.connect();
    return direct;
  } catch (err) {
    const fallback = poolerConfig();
    if (!fallback) throw err;

    console.log("直接接続できないため Connection Pooler 経由で接続します…");
    const pooled = new Client({ ...fallback, connectionTimeoutMillis: 8000 });
    await pooled.connect();
    return pooled;
  }
}

let client;
try {
  client = await connect();
  await client.query(readFileSync(sqlPath, "utf-8"));
  console.log("✓ schema.sql の適用が完了しました");
} catch (err) {
  console.error("✗ 適用に失敗しました:", err.message);
  process.exitCode = 1;
} finally {
  await client?.end();
}
