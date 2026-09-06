const raw = window.SITE_CONFIG ?? {};
const clean = (value) => typeof value === 'string' ? value.trim() : '';

export function webUrl(value) {
  try {
    const url = new URL(clean(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

const doctor = raw.doctor ?? {};
const contacts = raw.contacts ?? {};
const phone = clean(contacts.phone);
const phoneDigits = phone.replace(/[^\d+]/g, '');
const email = clean(contacts.email);
const avatar = clean(doctor.avatar);

export const config = {
  brandName: clean(raw.brandName) || 'О женском здоровье',
  doctor: {
    name: clean(doctor.name),
    specialty: clean(doctor.specialty),
    description: clean(doctor.description),
    avatar: avatar && !/^(?:[a-z]+:|\/\/)/i.test(avatar) && !avatar.includes('..')
      ? new URL(avatar.replace(/^\//, ''), document.baseURI).href : webUrl(avatar),
  },
  phone,
  phoneHref: /^\+?\d{7,15}$/.test(phoneDigits) ? `tel:${phoneDigits}` : '',
  email,
  emailHref: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : '',
  telegram: webUrl(contacts.telegram),
  telegramLabel: clean(contacts.telegramLabel) || 'Telegram',
  whatsapp: webUrl(contacts.whatsapp),
  bookingUrl: webUrl(contacts.bookingUrl),
  address: clean(contacts.address),
  siteUrl: webUrl(raw.siteUrl),
};

export const bookingHref = config.bookingUrl || config.phoneHref || config.telegram || config.whatsapp || config.emailHref;
