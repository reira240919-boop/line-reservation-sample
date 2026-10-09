const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "日程選択" },
  { n: 2, label: "情報入力" },
  { n: 3, label: "予約完了" },
];

export default function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-0.5 rounded-full border border-sand-200 p-1">
      {STEPS.map((s) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div
            key={s.n}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-xs font-bold ${
              active ? "bg-sage-100 text-sage-800" : done ? "text-sage-700" : "text-sand-400"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                done || active ? "bg-sage-600 text-white" : "bg-sand-100 text-sand-400"
              }`}
            >
              {done ? "✓" : s.n}
            </span>
            {s.label}
          </div>
        );
      })}
    </div>
  );
}
