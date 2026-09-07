import { normalizeConfig } from './settings.js';

export const config = normalizeConfig(window.SITE_CONFIG, document.baseURI);
export const bookingHref = config.bookingHref;
