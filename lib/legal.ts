/**
 * The version of the Terms of Service and Privacy Policy that people agree to when they sign up.
 *
 * When either document changes in a way that matters (not for typo fixes), update both values below.
 * New sign-ups are then recorded against the new version, and the effective date on both pages updates too.
 */
export const LEGAL_VERSION = '2026-10-01';

/** The date shown at the top of both documents. Keep it in step with LEGAL_VERSION. */
export const LEGAL_EFFECTIVE_DATE = 'October 1, 2026';

/** The documents a person agrees to when creating an account. */
export const LEGAL_DOCUMENTS = ['terms', 'privacy'] as const;
