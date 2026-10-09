/** お客様がLINEから開ける「予約の確認・変更・キャンセル」ページのURLを組み立てる */
export function buildManageUrl(bookingId: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return "";
  return `https://liff.line.me/${liffId}/manage/${bookingId}`;
}
