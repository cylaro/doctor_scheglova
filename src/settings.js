const clean = (value) => typeof value === 'string' ? value.trim() : '';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function webUrl(value) {
  try {
    const url = new URL(clean(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function normalizeConfig(input, baseUrl = 'http://localhost/') {
  const raw = object(input);
  const doctor = object(raw.doctor);
  const contacts = object(raw.contacts);
  const phone = clean(contacts.phone);
  const phoneDigits = phone.replace(/[^\d+]/g, '');
  const email = clean(contacts.email);
  const avatar = clean(doctor.avatar);
  let avatarUrl = webUrl(avatar);
  if (avatar && !/^(?:[a-z]+:|\/\/)/i.test(avatar) && !avatar.includes('..')) {
    try { avatarUrl = new URL(avatar.replace(/^\//, ''), baseUrl).href; } catch { /* Invalid base: omit image. */ }
  }

  const bookingUrl = webUrl(contacts.bookingUrl);
  const candidates = [...(Array.isArray(contacts.bookingLinks) ? contacts.bookingLinks : [])];
  if (bookingUrl) candidates.push({ url: bookingUrl });
  const seen = new Set();
  const bookingLinks = candidates.flatMap((candidate) => {
    const item = typeof candidate === 'string' ? { url: candidate } : object(candidate);
    const url = webUrl(item.url);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{
      url,
      label: clean(item.label) || new URL(url).hostname.replace(/^www\./, ''),
      description: clean(item.description),
    }];
  });

  const config = {
    brandName: clean(raw.brandName) || 'О женском здоровье',
    doctor: {
      name: clean(doctor.name),
      specialty: clean(doctor.specialty),
      description: clean(doctor.description),
      avatar: avatarUrl,
    },
    phone,
    phoneHref: /^\+?\d{7,15}$/.test(phoneDigits) ? `tel:${phoneDigits}` : '',
    email,
    emailHref: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : '',
    telegram: webUrl(contacts.telegram),
    telegramLabel: clean(contacts.telegramLabel) || 'Telegram',
    whatsapp: webUrl(contacts.whatsapp),
    bookingUrl,
    bookingLinks,
    address: clean(contacts.address),
    siteUrl: webUrl(raw.siteUrl),
  };
  config.bookingHref = bookingLinks[0]?.url || config.phoneHref || config.telegram || config.whatsapp || config.emailHref;
  return config;
}
