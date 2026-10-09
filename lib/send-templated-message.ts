import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { pushMessage } from "./line";
import { renderTemplate, type TemplateValues } from "./message-template";

/**
 * message_templates に登録された文面を、指定したLINEユーザーへ送る。
 * テンプレートが無効化されている・宛先が無い場合は静かに送らない（呼び出し側の処理は止めない）。
 */
export async function sendTemplatedMessage({
  templateKey,
  to,
  values,
}: {
  templateKey: string;
  to: string | null | undefined;
  values: TemplateValues;
}): Promise<boolean> {
  if (!to) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data: template } = await supabase
      .from("message_templates")
      .select("body, enabled")
      .eq("key", templateKey)
      .maybeSingle();

    if (!template || !template.enabled || !template.body) return false;

    const text = renderTemplate(template.body, values);
    return await pushMessage(to, text);
  } catch (err) {
    console.error(`テンプレートメッセージの送信に失敗しました（${templateKey}）:`, err);
    return false;
  }
}
