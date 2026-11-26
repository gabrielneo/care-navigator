// 9.7: where reports of a wrong figure or an accessibility problem go (the owner's address, published on purpose).
export const REPORT_EMAIL = "neoyikai3@gmail.com";

/** A mailto link; encodeURIComponent, not URLSearchParams, so mail apps show spaces rather than "+". */
export const mailto = (subject: string, body = "") =>
  `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
