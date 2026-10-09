import LiffBridge from "@/components/LiffBridge";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LiffBridge />
      {children}
    </>
  );
}
