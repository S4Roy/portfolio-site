import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

export const alt = "Subhankar Roy, Senior Full Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0a0f1a", color: "#e8edf5", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#4ade80" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#4ade80" }} />
          {profile.availability}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>{profile.name}</div>
          <div style={{ fontSize: 52, color: "#7aa2ff", marginTop: 8 }}>{profile.title}</div>
          <div style={{ fontSize: 30, color: "#a0abbd", marginTop: 28 }}>{profile.primaryStack.join("  ·  ")}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a0abbd" }}>
          <span>4+ years · Kolkata, India</span>
          <span>subhankarroy.in</span>
        </div>
      </div>
    ),
    size,
  );
}
