import type { ReactNode } from "react";

/** Pet strip: fully transparent page chrome for Electron alwaysOnTop */
export default function PetLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-transparent"
      style={{ background: "transparent" }}
    >
      <style>{`
        html, body { background: transparent !important; }
      `}</style>
      {children}
    </div>
  );
}
