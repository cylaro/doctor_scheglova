// Личные данные меняются ТОЛЬКО ЗДЕСЬ — и обновляются на всём сайте.
// После npm run build этот же файл лежит в dist/site-config.js.
// Пустые контакты скрываются. Не указывайте здесь пароли или секретные ключи.
window.SITE_CONFIG = {
  brandName: 'О женском здоровье',

  doctor: {
    name: 'Щеглова Светлана Вячеславовна',                       // Например: 'Анна Иванова'
    specialty: 'Врач — акушер-гинеколог',                  // Например: 'Врач — акушер-гинеколог'
    description: '',                // Только ваши реальные квалификация и опыт
    avatar: 'doctor.jpg',            // Фото лежит в public/doctor.jpg; префикс public/ здесь не нужен
  },

  contacts: {
    phone: '',                      // Например: '+7 (999) 123-45-67'
    telegram: 'https://t.me/doctor_scheglova',                   // Например: 'https://t.me/your_username'
    telegramLabel: 'Telegram',      // Можно заменить на '@your_username'
    whatsapp: '',                   // Например: 'https://wa.me/79991234567'
    email: '',                      // Например: 'hello@example.ru'
    bookingUrl: 'https://ogni.clinic/doctors/shcheglova_svetlana_vyacheslavovna',                 // Полная https-ссылка на запись; иначе используется телефон
    address: '',                    // Адрес клиники, если нужен
  },

  // Необязательно: полный публичный адрес сайта без #, для «Поделиться» и метаданных.
  siteUrl: 'https://cylaro.github.io/doctor_scheglova/',
};
