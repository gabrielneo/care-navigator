"use client";
// Holds the space for the 3D picture so nothing shifts, shows the brand mark until it's ready, and loads the 3D code
// (three.js, about 200 KB) only when the browser is idle after the page has shown. With reduced motion, no WebGL, or
// an error, the brand mark simply stays.
import { Component, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

class Fallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

const webgl = () => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } };

export function Hero3D() {
  const box = useRef<HTMLDivElement>(null);
  const [Scene, setScene] = useState<ComponentType<{ paused: boolean; source?: HTMLElement | null }> | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !webgl()) return;
    const load = () => import("./HomeScene").then((m) => setScene(() => m.HomeScene)).catch(() => {});
    // After the page has fully loaded and the browser is idle, so the 3D code never competes with the text or the button.
    const ric = "requestIdleCallback" in window;
    let id = 0;
    const later = () => { id = ric ? requestIdleCallback(load, { timeout: 4000 }) : window.setTimeout(load, 600); };
    if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
    const seen = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    if (box.current) seen.observe(box.current);
    return () => { window.removeEventListener("load", later); if (ric) cancelIdleCallback(id); else clearTimeout(id); seen.disconnect(); };
  }, []);

  return (
    <div className="hero-3d" ref={box} aria-hidden="true">
      <svg className="mark" viewBox="0 0 64 64"><path d="M42 22.5a13 13 0 1 0 0 19" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /><circle cx="45" cy="32" r="4" fill="currentColor" /></svg>
      {Scene && <Fallback><Scene paused={!visible} source={box.current?.closest<HTMLElement>(".hero")} /></Fallback>}
    </div>
  );
}
