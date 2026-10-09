/**
 * フォーム保存の結果を表す型。
 * "use server" のファイルからは関数しか export できないため、型と初期値はここに分けている。
 */
export type SaveState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_SAVE_STATE: SaveState = { status: "idle" };
