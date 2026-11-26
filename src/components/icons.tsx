import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const s = { width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ArrowRight = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const ArrowUpRight = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const Download = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>);
export const Mail = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
export const Lock = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const Chevron = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="m6 9 6 6 6-6" /></svg>);
export const Check = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="m5 12 5 5 9-10" /></svg>);
export const MapPin = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>);
export const LinkedIn = (p: P) => (<svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden {...p}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.91 1.3-1.91 2.63V21h-4V9.75Z" /></svg>);
export const GitHub = (p: P) => (<svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden {...p}><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>);
export const Sun = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const Moon = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>);
export const Menu = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const Close = (p: P) => (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
