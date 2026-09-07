import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, webUrl } from '../src/settings.js';

const baseUrl = 'https://example.github.io/doctor_scheglova/';
const doctor = {
  name: 'Щеглова Светлана Вячеславовна',
  specialty: 'Врач — акушер-гинеколог',
  description: 'Приём взрослых пациентов',
  avatar: 'doctor.jpg',
};
const contacts = {
  phone: '+7 (999) 123-45-67',
  telegram: 'https://t.me/doctor_scheglova',
  telegramLabel: '@doctor_scheglova',
  whatsapp: 'https://wa.me/79991234567',
  email: 'hello@example.ru',
  bookingUrl: 'https://legacy.example.ru/appointment',
  address: 'Москва',
  bookingLinks: [{ label: 'Клиника', url: 'https://clinic.example.ru/appointment', description: 'Первичный приём' }],
};

test('empty and malformed configuration keeps every personal field optional', () => {
  for (const raw of [undefined, null, false, true, 42, 'text', [], {}, { doctor: null, contacts: null }, { doctor: 42, contacts: false }]) {
    const config = normalizeConfig(raw, baseUrl);
    assert.equal(config.brandName, 'О женском здоровье');
    assert.deepEqual(config.doctor, { name: '', specialty: '', description: '', avatar: '' });
    for (const key of ['phone', 'phoneHref', 'email', 'emailHref', 'telegram', 'whatsapp', 'bookingUrl', 'address', 'siteUrl', 'bookingHref']) {
      assert.equal(config[key], '', `${String(raw)}: ${key}`);
    }
    assert.equal(config.telegramLabel, 'Telegram');
    assert.deepEqual(config.bookingLinks, []);
  }
});

test('every combination of doctor and contact field omissions is safe', () => {
  const fields = [
    ...Object.keys(doctor).map(key => ['doctor', key]),
    ...Object.keys(contacts).map(key => ['contacts', key]),
  ];
  for (let mask = 0; mask < 2 ** fields.length; mask++) {
    const raw = { doctor: { ...doctor }, contacts: { ...contacts } };
    for (let i = 0; i < fields.length; i++) {
      if (mask & (1 << i)) delete raw[fields[i][0]][fields[i][1]];
    }
    const config = normalizeConfig(raw, baseUrl);
    for (const key of Object.keys(doctor)) {
      const expected = raw.doctor[key] ? key === 'avatar' ? `${baseUrl}doctor.jpg` : raw.doctor[key] : '';
      assert.equal(config.doctor[key], expected, `mask ${mask}: doctor.${key}`);
    }
    assert.equal(config.phone, raw.contacts.phone || '', `mask ${mask}: phone`);
    assert.equal(config.email, raw.contacts.email || '', `mask ${mask}: email`);
    assert.equal(config.address, raw.contacts.address || '', `mask ${mask}: address`);
    assert.equal(config.telegramLabel, raw.contacts.telegramLabel || 'Telegram', `mask ${mask}: telegramLabel`);
    for (const key of ['telegram', 'whatsapp', 'bookingUrl']) {
      assert.equal(config[key], raw.contacts[key] || '', `mask ${mask}: ${key}`);
    }
    const expectedBookings = Number(Boolean(raw.contacts.bookingLinks)) + Number(Boolean(raw.contacts.bookingUrl));
    assert.equal(config.bookingLinks.length, expectedBookings, `mask ${mask}: booking count`);
    const expectedHref = raw.contacts.bookingLinks?.[0].url || raw.contacts.bookingUrl
      || (raw.contacts.phone ? 'tel:+79991234567' : '') || raw.contacts.telegram
      || raw.contacts.whatsapp || (raw.contacts.email ? 'mailto:hello@example.ru' : '') || '';
    assert.equal(config.bookingHref, expectedHref, `mask ${mask}: bookingHref`);
  }
});

test('empty strings and invalid field types are treated as omitted values', () => {
  for (const value of ['', '   ', null, false, 12, {}, []]) {
    const config = normalizeConfig({
      brandName: value,
      doctor: Object.fromEntries(Object.keys(doctor).map(key => [key, value])),
      contacts: Object.fromEntries(Object.keys(contacts).map(key => [key, value])),
      siteUrl: value,
    }, baseUrl);
    assert.deepEqual(config.doctor, { name: '', specialty: '', description: '', avatar: '' });
    assert.deepEqual(config.bookingLinks, []);
    assert.equal(config.bookingHref, '');
    assert.equal(config.phoneHref, '');
    assert.equal(config.emailHref, '');
  }
});

test('multiple booking links preserve order, normalize, deduplicate and append legacy links', () => {
  const config = normalizeConfig({ contacts: {
    bookingLinks: [
      null, false, 12, {}, { url: 'javascript:alert(1)' },
      { label: '  Клиника № 1  ', url: '  https://www.example.ru  ', description: '  По записи  ' },
      { label: 'Повтор', url: 'https://www.example.ru/' },
      'https://second.example.ru/book',
      { url: 'https://third.example.ru/', description: 42 },
    ],
    bookingUrl: 'https://legacy.example.ru/book',
  } }, baseUrl);
  assert.deepEqual(config.bookingLinks, [
    { label: 'Клиника № 1', url: 'https://www.example.ru/', description: 'По записи' },
    { label: 'second.example.ru', url: 'https://second.example.ru/book', description: '' },
    { label: 'third.example.ru', url: 'https://third.example.ru/', description: '' },
    { label: 'legacy.example.ru', url: 'https://legacy.example.ru/book', description: '' },
  ]);
  assert.equal(config.bookingHref, 'https://www.example.ru/');
});

test('legacy booking URL works without a phone and does not duplicate an existing link', () => {
  const legacy = normalizeConfig({ contacts: { bookingUrl: 'https://clinic.example.ru', phone: '' } });
  assert.equal(legacy.bookingHref, 'https://clinic.example.ru/');
  assert.equal(legacy.bookingUrl, 'https://clinic.example.ru/');
  assert.equal(legacy.bookingLinks.length, 1);
  const duplicate = normalizeConfig({ contacts: {
    bookingLinks: [{ label: 'Клиника', url: 'https://clinic.example.ru/' }],
    bookingUrl: 'https://clinic.example.ru',
  } });
  assert.equal(duplicate.bookingLinks.length, 1);
  assert.equal(duplicate.bookingLinks[0].label, 'Клиника');
});

test('booking action follows the available contact fallback order', () => {
  const values = { phone: contacts.phone, telegram: contacts.telegram, whatsapp: contacts.whatsapp, email: contacts.email };
  const expected = ['tel:+79991234567', contacts.telegram, contacts.whatsapp, 'mailto:hello@example.ru'];
  for (const [index, key] of Object.keys(values).entries()) {
    assert.equal(normalizeConfig({ contacts: values }).bookingHref, expected[index]);
    delete values[key];
  }
  assert.equal(normalizeConfig({ contacts: values }).bookingHref, '');
  const invalid = normalizeConfig({ contacts: { phone: '123', email: 'invalid', bookingUrl: 'javascript:alert(1)', telegram: contacts.telegram } });
  assert.equal(invalid.phoneHref, '');
  assert.equal(invalid.emailHref, '');
  assert.equal(invalid.bookingHref, contacts.telegram);
});

test('web URLs accept only absolute HTTP(S) links', () => {
  assert.equal(webUrl('  https://EXAMPLE.com  '), 'https://example.com/');
  assert.equal(webUrl('http://example.com/path?q=1#details'), 'http://example.com/path?q=1#details');
  for (const value of [undefined, null, {}, [], 123, '', 'example.com', '/booking', '//example.com', 'javascript:alert(1)', 'data:text/html,test', 'mailto:hello@example.com', 'ftp://example.com', 'https://']) {
    assert.equal(webUrl(value), '', String(value));
  }
});

test('avatar paths work beneath a GitHub Pages project and unsafe paths are ignored', () => {
  for (const [avatar, expected] of [
    ['doctor.jpg', `${baseUrl}doctor.jpg`],
    ['assets/doctor.jpg', `${baseUrl}assets/doctor.jpg`],
    ['  doctor.jpg  ', `${baseUrl}doctor.jpg`],
    ['https://images.example.ru/doctor.jpg', 'https://images.example.ru/doctor.jpg'],
    ['http://images.example.ru/doctor.jpg', 'http://images.example.ru/doctor.jpg'],
    ['../doctor.jpg', ''],
    ['assets/../../doctor.jpg', ''],
    ['javascript:alert(1)', ''],
    ['data:image/png;base64,AAAA', ''],
  ]) {
    assert.equal(normalizeConfig({ doctor: { avatar } }, baseUrl).doctor.avatar, expected, avatar);
  }
  assert.equal(normalizeConfig({ doctor: { avatar: 'doctor.jpg' } }).doctor.avatar, 'http://localhost/doctor.jpg');
});

test('normalization trims text without changing the supplied configuration', () => {
  const raw = {
    brandName: '  О здоровье  ',
    doctor: { ...doctor, name: '  Светлана Щеглова  ' },
    contacts: { ...contacts, bookingLinks: [{ label: '  Клиника  ', url: 'https://example.ru', description: '  Запись  ' }] },
    siteUrl: '  https://example.github.io/doctor_scheglova/  ',
  };
  const original = structuredClone(raw);
  const freeze = object => {
    for (const value of Object.values(object)) if (value && typeof value === 'object') freeze(value);
    return Object.freeze(object);
  };
  freeze(raw);
  const config = normalizeConfig(raw, baseUrl);
  assert.equal(config.brandName, 'О здоровье');
  assert.equal(config.doctor.name, 'Светлана Щеглова');
  assert.equal(config.siteUrl, baseUrl);
  assert.deepEqual(raw, original);
});
