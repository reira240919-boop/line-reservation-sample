"use client";

import { useState } from "react";

export type MessageTab = {
  key: string;
  label: string;
  badge: string;
  content: React.ReactNode;
};

export default function MessageTabs({ tabs }: { tabs: MessageTab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <div className="mt-6">
      <div className="flex gap-1 overflow-x-auto border-b border-sand-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-bold ${
              tab.key === active?.key
                ? "border-sage-600 text-sage-800"
                : "border-transparent text-sand-500 hover:text-sand-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active && (
        <div
          key={active.key}
          className="rounded-b-lg border border-t-0 border-sand-200 bg-white p-5"
        >
          <span className="mb-4 inline-block rounded-full bg-sage-100 px-2 py-0.5 text-xs font-bold text-sage-700">
            {active.badge}
          </span>
          {active.content}
        </div>
      )}
    </div>
  );
}
