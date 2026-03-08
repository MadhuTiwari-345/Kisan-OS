"use client";

export function LandingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,204,179,0.24),transparent_34%),radial-gradient(circle_at_top_right,rgba(167,175,49,0.24),transparent_38%),linear-gradient(135deg,#071714_0%,#163226_42%,#40410f_74%,#1e230f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.32))]" />
    </div>
  );
}
