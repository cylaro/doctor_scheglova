// Личные данные меняются ТОЛЬКО ЗДЕСЬ — и обновляются на всём сайте.
// После npm run build этот же файл лежит в dist/site-config.js.
// Любое поле можно удалить целиком или оставить пустым ('').
// Блоки doctor и contacts тоже можно удалить. Соблюдайте запятые и скобки JavaScript.
// Пустые данные скрываются. Не указывайте здесь пароли или секретные ключи.
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
    // Каждый блок {...} в списке — отдельное место записи.
    // label — название, url — обычная https-ссылка, description — необязательная подпись.
    // Можно удалить любой блок, отдельные поля или весь список.
    bookingLinks: [
      {
        label: 'Клиника «Огни»',
        url: 'https://ogni.clinic/doctors/shcheglova_svetlana_vyacheslavovna',
        description: '',
      },
      // Для второго места скопируйте блок выше и поменяйте название и ссылку.
    ],
    address: '',                    // Адрес клиники, если нужен
  },

  // Необязательно: полный публичный адрес сайта без #, для «Поделиться» и метаданных.
  siteUrl: 'https://cylaro.github.io/doctor_scheglova/',
};
