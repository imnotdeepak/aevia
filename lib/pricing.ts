/**
 * The subscription price for new customers, in one place. It is shown on the landing page, the subscribe
 * page and in the Terms, and it is what checkout charges.
 *
 * To raise the price for new customers:
 *   1. Change PRICE_CENTS below.
 *   2. If STRIPE_PRICE_ID is set, create a new Price in Stripe with the new amount and update that variable.
 *      (Checkout refuses to start if the Stripe price and PRICE_CENTS disagree.)
 * Existing subscribers stay on the price they signed up at: Stripe keeps each subscription on its own Price.
 * Never change or migrate existing subscriptions to the new price.
 */
export const PRICE_CENTS = 200;

const dollars = PRICE_CENTS / 100;

/** For example "$2", or "$2.50" when the price is not a whole number of dollars. */
export const PRICE_LABEL = Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;

/** For example "$2 a month". */
export const PRICE_PER_MONTH = `${PRICE_LABEL} a month`;
