
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');

// Replace with your bot token from @BotFather
const token = '7607176972:AAEfs8YyjDREnZkzjWIY4Fm8-QWooD6oYAE';
const bot = new TelegramBot(token, { polling: true });

// Admin configuration
const ADMIN_ID = 6975750288;

// Admin data storage
const adminData = {
  stats: {
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    dailyUsers: new Set(),
    lastReset: new Date().toDateString()
  },
  blockedUsers: new Set(),
  broadcastMessage: '',
  maintenanceMode: false,
  customCommands: new Map(),
  premiumUsers: new Set()
};

// User data storage with persistence
const userData = new Map();
const userLanguages = new Map();

// Load saved data (in production, this would be from a database)
const savedUserData = {};
const savedLanguages = {};

// Language translations
const translations = {
  de: {
    welcome: '🎉 Hallo %name%! Willkommen beim Özge Post Creator Bot!\n\n🚀 Ich bin dein kreativer Assistent für Social Media Inhalte. Ich helfe dir dabei:\n\n✨ Atemberaubende visuelle Posts mit HD-Bildern zu erstellen\n📊 Interaktive Umfragen und Erhebungen zu gestalten\n🎨 Auf Premium-Emoji-Sammlungen zuzugreifen\n📧 Inhalte über mehrere Plattformen zu teilen\n🌍 In 5 Sprachen zu kommunizieren\n📱 Posts in verschiedenen Formaten zu exportieren\n\n💬 Brauchst du Hilfe? Kontaktiere unser Support-Team!',
    main_menu: '📋 Hauptmenü',
    help_menu: '❓ Hilfe-Menü',
    language_settings: '🌐 Spracheinstellungen',
    communication: '💬 Kommunikation & Support',
    create_post: '✍️ Post erstellen',
    upload_image: '📷 Bild hochladen',
    create_poll: '📊 Umfrage erstellen',
    premium_emojis: '✨ Premium Emojis',
    share_via_email: '📧 Per E-Mail teilen',
    help_text: `🆘 Hilfe-Menü\n\n📷 Bilder für deine Posts hochladen\n✍️ Ansprechende Post-Inhalte schreiben\n📊 Interaktive Umfragen erstellen\n✨ Premium-Emojis verwenden\n📧 Posts per E-Mail teilen\n🌐 Spracheinstellungen ändern\n💬 Support erhalten und uns kontaktieren\n\nBefehle:\n/start - Hauptmenü\n/help - Dieses Hilfe-Menü\n/language - Spracheinstellungen\n/contact - Support kontaktieren`,
    choose_language: 'Wähle deine Sprache:',
    language_changed: 'Sprache erfolgreich geändert! 🎉',
    communication_menu: '💬 Kommunikation & Support\n\n📞 Brauchst du Hilfe oder hast Vorschläge?\n\n📱 Kontaktiere unser Support-Team über Telegram:\n👤 @emine9104\n\n🕐 Support-Zeiten: 24/7\n🌍 Sprachen: Englisch, Spanisch, Französisch, Türkisch, Deutsch\n\n💡 Wir würden gerne dein Feedback und deine Vorschläge zur Verbesserung des Bots hören!',
    contact_success: '✅ Kontaktinformationen oben angezeigt!\n\nZögere nicht, uns jederzeit zu kontaktieren!',
    post_creation: 'Post-Erstellungsmodus 📝\n\nSende mir Text für deinen Post, oder verwende die Schaltflächen unten:',
    send_image: 'Bitte sende mir ein Bild zum Hochladen:',
    image_received: 'Bild erhalten! 📷\nJetzt sende mir die Bildunterschrift für deinen Post:',
    poll_creation: 'Umfrage-Erstellung 📊\n\nSende mir die Umfrage-Frage:',
    poll_question_received: 'Großartig! Jetzt sende mir die Umfrage-Optionen (eine pro Zeile):',
    poll_created: 'Umfrage erfolgreich erstellt! 🎉',
    premium_emoji_menu: '✨ Premium Emojis\n\nWähle aus unserer Premium-Emoji-Sammlung:',
    post_preview: '📋 Post-Vorschau:\n\n',
    publish_post: '🚀 Post veröffentlichen',
    edit_post: '✏️ Post bearbeiten',
    add_emoji: '✨ Emoji hinzufügen',
    back_to_menu: '🔙 Zurück zum Menü',
    email_prompt: 'Bitte gib die E-Mail-Adresse ein, um diesen Post zu teilen:',
    email_sent: 'Post erfolgreich per E-Mail geteilt! 📧',
    invalid_email: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    share_success: 'Post erfolgreich veröffentlicht! 🎉',
    content_added: 'Inhalt zu deinem Post hinzugefügt! ✅'
  },
  ar: {
    welcome: '🎉 مرحباً %name%! مرحباً بك في بوت منشئ المنشورات المتطور!\n\n🚀 أنا مساعدك الإبداعي لمحتوى وسائل التواصل الاجتماعي. أساعدك في:\n\n✨ إنشاء منشورات بصرية مذهلة بصور عالية الدقة\n📊 تصميم استطلاعات ومسوحات تفاعلية\n🎨 الوصول إلى مجموعات الرموز التعبيرية المميزة\n📧 مشاركة المحتوى عبر منصات متعددة\n🌍 التواصل بـ 5 لغات\n📱 تصدير المنشورات بصيغ مختلفة\n\n💬 تحتاج مساعدة؟ تواصل مع فريق الدعم!',
    main_menu: '📋 القائمة الرئيسية',
    help_menu: '❓ قائمة المساعدة',
    language_settings: '🌐 إعدادات اللغة',
    communication: '💬 التواصل والدعم',
    create_post: '✍️ إنشاء منشور',
    upload_image: '📷 رفع صورة',
    create_poll: '📊 إنشاء استطلاع',
    premium_emojis: '✨ رموز تعبيرية مميزة',
    share_via_email: '📧 مشاركة عبر البريد الإلكتروني',
    help_text: `🆘 قائمة المساعدة\n\n📷 رفع صور لمنشوراتك\n✍️ كتابة محتوى جذاب\n📊 إنشاء استطلاعات تفاعلية\n✨ استخدام رموز تعبيرية مميزة\n📧 مشاركة المنشورات عبر البريد الإلكتروني\n🌐 تغيير إعدادات اللغة\n💬 الحصول على الدعم والتواصل معنا\n\nالأوامر:\n/start - القائمة الرئيسية\n/help - قائمة المساعدة\n/language - إعدادات اللغة\n/contact - التواصل مع الدعم`,
    choose_language: 'اختر لغتك:',
    language_changed: 'تم تغيير اللغة بنجاح! 🎉',
    communication_menu: '💬 التواصل والدعم\n\n📞 تحتاج مساعدة أو لديك اقتراحات؟\n\n📱 تواصل مع فريق الدعم عبر تيليجرام:\n👤 @emine9104\n\n🕐 ساعات الدعم: 24/7\n🌍 اللغات: الإنجليزية، الإسبانية، الفرنسية، التركية، الألمانية، العربية\n\n💡 نود سماع ملاحظاتك واقتراحاتك لتحسين البوت!',
    contact_success: '✅ تم عرض معلومات التواصل أعلاه!\n\nلا تتردد في التواصل معنا في أي وقت!',
    post_creation: 'وضع إنشاء المنشور 📝\n\nأرسل لي نصاً لمنشورك، أو استخدم الأزرار أدناه:',
    send_image: 'يرجى إرسال صورة للرفع:',
    image_received: 'تم استلام الصورة! 📷\nالآن أرسل لي التسمية التوضيحية لمنشورك:',
    poll_creation: 'إنشاء استطلاع 📊\n\nأرسل لي سؤال الاستطلاع:',
    poll_question_received: 'رائع! الآن أرسل لي خيارات الاستطلاع (خيار واحد في كل سطر):',
    poll_created: 'تم إنشاء الاستطلاع بنجاح! 🎉',
    premium_emoji_menu: '✨ رموز تعبيرية مميزة\n\nاختر من مجموعة الرموز التعبيرية المميزة:',
    post_preview: '📋 معاينة المنشور:\n\n',
    publish_post: '🚀 نشر المنشور',
    edit_post: '✏️ تحرير المنشور',
    add_emoji: '✨ إضافة رمز تعبيري',
    back_to_menu: '🔙 العودة للقائمة',
    email_prompt: 'يرجى إدخال عنوان البريد الإلكتروني لمشاركة هذا المنشور:',
    email_sent: 'تمت مشاركة المنشور عبر البريد الإلكتروني بنجاح! 📧',
    invalid_email: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    share_success: 'تم نشر المنشور بنجاح! 🎉',
    content_added: 'تم إضافة المحتوى لمنشورك! ✅'
  },
  en: {
    welcome: '🎉 Hello %name%! Welcome to the Özge Post Creator Bot!\n\n🚀 I\'m your creative assistant for social media content. I help you:\n\n✨ Create stunning visual posts with HD images\n📊 Design interactive polls & surveys\n🎨 Access premium emoji collections\n📧 Share content via multiple platforms\n🌍 Communicate in 4 languages\n📱 Export posts in various formats\n\n💬 Need help? Contact our support team!',
    main_menu: '📋 Main Menu',
    help_menu: '❓ Help Menu',
    language_settings: '🌐 Language Settings',
    communication: '💬 Communication & Support',
    create_post: '✍️ Create Post',
    upload_image: '📷 Upload Image',
    create_poll: '📊 Create Poll',
    premium_emojis: '✨ Premium Emojis',
    share_via_email: '📧 Share via Email',
    help_text: `🆘 Help Menu\n\n📷 Upload images for your posts\n✍️ Write engaging post content\n📊 Create interactive polls\n✨ Use premium emojis\n📧 Share posts via email\n🌐 Change language settings\n💬 Get support and contact us\n\nCommands:\n/start - Main menu\n/help - This help menu\n/language - Language settings\n/contact - Contact support`,
    choose_language: 'Choose your language:',
    language_changed: 'Language changed successfully! 🎉',
    communication_menu: '💬 Communication & Support\n\n📞 Need help or have suggestions?\n\n📱 Contact our support team via Telegram:\n👤 @emine9104\n\n🕐 Support Hours: 24/7\n🌍 Languages: English, Spanish, French, Turkish, German, Arabic\n\n💡 We\'d love to hear your feedback and suggestions for improving the bot!',
    contact_success: '✅ Contact information displayed above!\n\nFeel free to reach out anytime!',
    post_creation: 'Post Creation Mode 📝\n\nSend me text for your post, or use the buttons below:',
    send_image: 'Please send me an image to upload:',
    image_received: 'Image received! 📷\nNow send me the caption for your post:',
    poll_creation: 'Poll Creation 📊\n\nSend me the poll question:',
    poll_question_received: 'Great! Now send me the poll options (one per line):',
    poll_created: 'Poll created successfully! 🎉',
    premium_emoji_menu: '✨ Premium Emojis\n\nChoose from our premium emoji collection:',
    post_preview: '📋 Post Preview:\n\n',
    publish_post: '🚀 Publish Post',
    edit_post: '✏️ Edit Post',
    add_emoji: '✨ Add Emoji',
    back_to_menu: '🔙 Back to Menu',
    email_prompt: 'Please enter the email address to share this post:',
    email_sent: 'Post shared via email successfully! 📧',
    invalid_email: 'Please enter a valid email address.',
    share_success: '🎉 Post published successfully!',
    content_added: '✅ Content added to your post!'
  },
  es: {
    welcome: '🎉 ¡Hola %name%! ¡Bienvenido al Bot Creador de Posts Ultimate!\n\n🚀 Soy tu asistente creativo para contenido de redes sociales. Te ayudo a:\n\n✨ Crear posts visuales impresionantes con imágenes HD\n📊 Diseñar encuestas y sondeos interactivos\n🎨 Acceder a colecciones premium de emojis\n📧 Compartir contenido en múltiples plataformas\n🌍 Comunicarte en 4 idiomas\n📱 Exportar posts en varios formatos\n\n💬 ¿Necesitas ayuda? ¡Contacta nuestro equipo de soporte!',
    main_menu: '📋 Menú Principal',
    help_menu: '❓ Menú de Ayuda',
    language_settings: '🌐 Configuración de Idioma',
    communication: '💬 Comunicación y Soporte',
    create_post: '✍️ Crear Post',
    upload_image: '📷 Subir Imagen',
    create_poll: '📊 Crear Encuesta',
    premium_emojis: '✨ Emojis Premium',
    share_via_email: '📧 Compartir por Email',
    help_text: `🆘 Menú de Ayuda\n\n📷 Sube imágenes para tus posts\n✍️ Escribe contenido atractivo\n📊 Crea encuestas interactivas\n✨ Usa emojis premium\n📧 Comparte posts por email\n🌐 Cambia configuración de idioma\n💬 Obtén soporte y contáctanos\n\nComandos:\n/start - Menú principal\n/help - Este menú de ayuda\n/language - Configuración de idioma\n/contact - Contactar soporte`,
    choose_language: 'Elige tu idioma:',
    language_changed: '¡Idioma cambiado exitosamente! 🎉',
    communication_menu: '💬 Comunicación y Soporte\n\n📞 ¿Necesitas ayuda o tienes sugerencias?\n\n📱 Contacta nuestro equipo de soporte vía Telegram:\n👤 @emine9104\n\n🕐 Horario de Soporte: 24/7\n🌍 Idiomas: Inglés, Español, Francés, Turco, Alemán, Árabe\n\n💡 ¡Nos encantaría escuchar tus comentarios y sugerencias para mejorar el bot!',
    contact_success: '✅ ¡Información de contacto mostrada arriba!\n\n¡No dudes en contactarnos en cualquier momento!',
    post_creation: 'Modo Creación de Post 📝\n\nEnvíame texto para tu post, o usa los botones de abajo:',
    send_image: 'Por favor envíame una imagen para subir:',
    image_received: '¡Imagen recibida! 📷\nAhora envíame la descripción para tu post:',
    poll_creation: 'Creación de Encuesta 📊\n\nEnvíame la pregunta de la encuesta:',
    poll_question_received: '¡Genial! Ahora envíame las opciones de la encuesta (una por línea):',
    poll_created: '¡Encuesta creada exitosamente! 🎉',
    premium_emoji_menu: '✨ Emojis Premium\n\nElige de nuestra colección de emojis premium:',
    post_preview: '📋 Vista Previa del Post:\n\n',
    publish_post: '🚀 Publicar Post',
    edit_post: '✏️ Editar Post',
    add_emoji: '✨ Agregar Emoji',
    back_to_menu: '🔙 Volver al Menú',
    email_prompt: 'Por favor ingresa la dirección de email para compartir este post:',
    email_sent: '¡Post compartido por email exitosamente! 📧',
    invalid_email: 'Por favor ingresa una dirección de email válida.',
    share_success: '¡Post publicado exitosamente! 🎉',
    content_added: '¡Contenido agregado a tu post! ✅'
  },
  fr: {
    welcome: '🎉 Bonjour %name%! Bienur dans le Bot Créateur de Posts Özge!\n\n🚀 Je suis votre assistant créatif pour le contenu des réseaux sociaux. Je vous aide à:\n\n✨ Créer des posts visuels époustouflants avec des images HD\n📊 Concevoir des sondages et enquêtes interactifs\n🎨 Accéder aux collections premium d\'emojis\n📧 Partager du contenu sur plusieurs plateformes\n🌍 Communiquer en 4 langues\n📱 Exporter des posts en divers formats\n\n💬 Besoin d\'aide? Contactez notre équipe de support!',
    main_menu: '📋 Menu Principal',
    help_menu: '❓ Menu d\'Aide',
    language_settings: '🌐 Paramètres de Langue',
    communication: '💬 Communication et Support',
    create_post: '✍️ Créer un Post',
    upload_image: '📷 Télécharger une Image',
    create_poll: '📊 Créer un Sondage',
    premium_emojis: '✨ Emojis Premium',
    share_via_email: '📧 Partager par Email',
    help_text: `🆘 Menu d'Aide\n\n📷 Téléchargez des images pour vos posts\n✍️ Écrivez du contenu engageant\n📊 Créez des sondages interactifs\n✨ Utilisez des emojis premium\n📧 Partagez des posts par email\n🌐 Changez les paramètres de langue\n💬 Obtenez du support et contactez-nous\n\nCommandes:\n/start - Menu principal\n/help - Ce menu d'aide\n/language - Paramètres de langue\n/contact - Contacter le support`,
    choose_language: 'Choisissez votre langue:',
    language_changed: 'Langue changée avec succès! 🎉',
    communication_menu: '💬 Communication et Support\n\n📞 Besoin d\'aide ou avez-vous des suggestions?\n\n📱 Contactez notre équipe de support via Telegram:\n👤 @emine9104\n\n🕐 Heures de Support: 24/7\n🌍 Langues: Anglais, Espagnol, Français, Turc, Allemand, Arabe\n\n💡 Nous aimerions entendre vos commentaires et suggestions pour améliorer le bot!',
    contact_success: '✅ Informations de contact affichées ci-dessus!\n\nN\'hésitez pas à nous contacter à tout moment!',
    post_creation: 'Mode Création de Post 📝\n\nEnvoyez-moi du texte pour votre post, ou utilisez les boutons ci-dessous:',
    send_image: 'Veuillez m\'envoyer une image à télécharger:',
    image_received: 'Image reçue! 📷\nMaintenant envoyez-moi la description pour votre post:',
    poll_creation: 'Création de Sondage 📊\n\nEnvoyez-moi la question du sondage:',
    poll_question_received: 'Parfait! Maintenant envoyez-moi les options du sondage (une par ligne):',
    poll_created: 'Sondage créé avec succès! 🎉',
    premium_emoji_menu: '✨ Emojis Premium\n\nChoisissez dans notre collection d\'emojis premium:',
    post_preview: '📋 Aperçu du Post:\n\n',
    publish_post: '🚀 Publier le Post',
    edit_post: '✏️ Modifier le Post',
    add_emoji: '✨ Ajouter un Emoji',
    back_to_menu: '🔙 Retour au Menu',
    email_prompt: 'Veuillez entrer l\'adresse email pour partager ce post:',
    email_sent: 'Post partagé par email avec succès! 📧',
    invalid_email: 'Veuillez entrer une adresse email valide.',
    share_success: 'Post publié avec succès! 🎉',
    content_added: 'Contenu ajouté à votre post! ✅'
  },
  tr: {
    welcome: '🎉 Merhaba %name%! Özge Post Oluşturucu Bot\'a hoş geldin!\n\n🚀 Sosyal medya içeriklerin için yaratıcı asistanınım. Sana yardım ettiğim konular:\n\n✨ HD görsellerle muhteşem görseller oluşturmak\n📊 İnteraktif anketler ve araştırmalar tasarlamak\n🎨 Premium emoji koleksiyonlarına erişim\n📧 İçeriği birden fazla platformda paylaşmak\n🌍 4 dilde iletişim kurmak\n📱 Postları çeşitli formatlarda dışa aktarmak\n\n💬 Yardıma mı ihtiyacın var? Destek ekibimizle iletişime geç!',
    main_menu: '📋 Ana Menü',
    help_menu: '❓ Yardım Menüsü',
    language_settings: '🌐 Dil Ayarları',
    communication: '💬 İletişim ve Destek',
    create_post: '✍️ Post Oluştur',
    upload_image: '📷 Resim Yükle',
    create_poll: '📊 Anket Oluştur',
    premium_emojis: '✨ Premium Emojiler',
    share_via_email: '📧 Email ile Paylaş',
    help_text: `🆘 Yardım Menüsü\n\n📷 Postların için resim yükle\n✍️ Etkileyici post içeriği yaz\n📊 İnteraktif anketler oluştur\n✨ Premium emojiler kullan\n📧 Postları email ile paylaş\n🌐 Dil ayarlarını değiştir\n💬 Destek al ve bizimle iletişime geç\n\nKomutlar:\n/start - Ana menü\n/help - Bu yardım menüsü\n/language - Dil ayarları\n/contact - Destek ile iletişim`,
    choose_language: 'Dilini seç:',
    language_changed: 'Dil başarıyla değiştirildi! 🎉',
    communication_menu: '💬 İletişim ve Destek\n\n📞 Yardıma mı ihtiyacın var veya önerilerin mi var?\n\n📱 Telegram üzerinden destek ekibimizle iletişime geç:\n👤 @emine9104\n\n🕐 Destek Saatleri: 7/24\n🌍 Diller: İngilizce, İspanyolca, Fransızca, Türkçe, Almanca, Arapça\n\n💡 Geri bildirimlerini ve botu geliştirmek için önerilerini duymayı çok isteriz!',
    contact_success: '✅ İletişim bilgileri yukarıda gösterildi!\n\nİstediğin zaman bize ulaşabilirsin!',
    post_creation: 'Post Oluşturma Modu 📝\n\nBana postun için metin gönder veya aşağıdaki butonları kullan:',
    send_image: 'Lütfen yüklemek için bir resim gönder:',
    image_received: 'Resim alındı! 📷\nŞimdi bana postun için açıklama gönder:',
    poll_creation: 'Anket Oluşturma 📊\n\nBana anket sorusunu gönder:',
    poll_question_received: 'Harika! Şimdi bana anket seçeneklerini gönder (her satıra bir tane):',
    poll_created: 'Anket başarıyla oluşturuldu! 🎉',
    premium_emoji_menu: '✨ Premium Emojiler\n\nPremium emoji koleksiyonumuzdan seç:',
    post_preview: '📋 Post Önizlemesi:\n\n',
    publish_post: '🚀 Postu Yayınla',
    edit_post: '✏️ Postu Düzenle',
    add_emoji: '✨ Emoji Ekle',
    back_to_menu: '🔙 Menüye Dön',
    email_prompt: 'Bu postu paylaşmak için lütfen email adresini gir:',
    email_sent: 'Post email ile başarıyla paylaşıldı! 📧',
    invalid_email: 'Lütfen geçerli bir email adresi gir.',
    share_success: 'Post başarıyla yayınlandı! 🎉',
    content_added: 'İçerik postuna eklendi! ✅'
  }
};

// Premium emoji collections
const premiumEmojis = {
  hearts: ['💖', '💝', '💗', '💓', '💕', '💘', '❤️‍🔥', '❤️‍🩹', '💟', '💐', '🌹', '💋'],
  stars: ['⭐', '🌟', '✨', '💫', '🌠', '🔆', '💥', '🎇', '🎆', '⚡', '🌟', '💎'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌵', '🦋', '🐝', '🌳'],
  special: ['🎭', '🎪', '🎨', '🎬', '🎵', '🎶', '🎤', '🎸', '🎹', '🎯', '🎲', '🎊'],
  crown: ['👑', '💎', '🏆', '🥇', '🏅', '🎖️', '🎗️', '🏵️', '🎀', '💍', '👸', '🤴'],
  fire: ['🔥', '💯', '⚡', '🌈', '☄️', '🌊', '🌙', '☀️', '🌅', '🌈', '❄️', '🌪️'],
  tech: ['💻', '📱', '⌚', '🎮', '📺', '📷', '🎧', '🖥️', '⌨️', '🖱️', '💾', '📀'],
  travel: ['✈️', '🚗', '🚢', '🏰', '🗽', '🎡', '🎢', '🏖️', '🏔️', '🗻', '🏕️', '🌍']
};

// User states
const userStates = {
  MAIN_MENU: 'main_menu',
  POST_CREATION: 'post_creation',
  WAITING_FOR_IMAGE: 'waiting_for_image',
  WAITING_FOR_CAPTION: 'waiting_for_caption',
  POLL_CREATION: 'poll_creation',
  WAITING_FOR_POLL_QUESTION: 'waiting_for_poll_question',
  WAITING_FOR_POLL_OPTIONS: 'waiting_for_poll_options',
  WAITING_FOR_EMAIL: 'waiting_for_email',
  // Admin states
  ADMIN_PANEL: 'admin_panel',
  ADMIN_BROADCAST: 'admin_broadcast',
  ADMIN_ADD_COMMAND: 'admin_add_command',
  ADMIN_WAITING_COMMAND_NAME: 'admin_waiting_command_name',
  ADMIN_WAITING_COMMAND_RESPONSE: 'admin_waiting_command_response'
};

// Admin helper functions
function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function updateStats(userId) {
  adminData.stats.totalMessages++;
  
  // Reset daily stats if new day
  const today = new Date().toDateString();
  if (adminData.stats.lastReset !== today) {
    adminData.stats.dailyUsers.clear();
    adminData.stats.lastReset = today;
  }
  
  adminData.stats.dailyUsers.add(userId);
}

function getAdminKeyboard() {
  return {
    keyboard: [
      ['📊 Statistics', '👥 User Management'],
      ['📢 Broadcast', '⚙️ Bot Settings'],
      ['🛠️ Custom Commands', '🔧 Maintenance'],
      ['💎 Premium Users', '🔙 Exit Admin']
    ],
    resize_keyboard: true
  };
}

function getUserManagementKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🚫 Block User', callback_data: 'admin_block_user' }],
      [{ text: '✅ Unblock User', callback_data: 'admin_unblock_user' }],
      [{ text: '📋 View All Users', callback_data: 'admin_view_users' }],
      [{ text: '🔙 Back', callback_data: 'admin_back' }]
    ]
  };
}

function getBotSettingsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: adminData.maintenanceMode ? '✅ Maintenance ON' : '❌ Maintenance OFF', callback_data: 'admin_toggle_maintenance' }],
      [{ text: '🌐 Add Language', callback_data: 'admin_add_language' }],
      [{ text: '✨ Manage Emojis', callback_data: 'admin_manage_emojis' }],
      [{ text: '🔙 Back', callback_data: 'admin_back' }]
    ]
  };
}

// Helper function to get user language with persistence
function getUserLanguage(userId) {
  // Check in memory first
  if (userLanguages.has(userId)) {
    return userLanguages.get(userId);
  }
  // Check saved data
  if (savedLanguages[userId]) {
    userLanguages.set(userId, savedLanguages[userId]);
    return savedLanguages[userId];
  }
  // Default to Turkish
  return 'tr';
}

// Save user language preference
function saveUserLanguage(userId, language) {
  userLanguages.set(userId, language);
  savedLanguages[userId] = language;
}

// Helper function to get translation
function t(userId, key) {
  const lang = getUserLanguage(userId);
  return translations[lang][key] || translations.en[key];
}

// Initialize user data
function initUser(userId) {
  if (!userData.has(userId)) {
    userData.set(userId, {
      state: userStates.MAIN_MENU,
      currentPost: {
        text: '',
        images: [],
        poll: null
      },
      pollData: {}
    });
  }
}

// Create main menu keyboard
function getMainMenuKeyboard(userId) {
  return {
    keyboard: [
      [t(userId, 'create_post'), t(userId, 'upload_image')],
      [t(userId, 'create_poll'), t(userId, 'premium_emojis')],
      [t(userId, 'share_via_email'), '📊 İstatistikler'],
      [t(userId, 'communication'), '🎨 Tema Seçici'],
      [t(userId, 'help_menu'), t(userId, 'language_settings')]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Create language selection keyboard
function getLanguageKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🇹🇷 Türkçe', callback_data: 'lang_tr' }],
      [{ text: '🇺🇸 English', callback_data: 'lang_en' }],
      [{ text: '🇪🇸 Español', callback_data: 'lang_es' }],
      [{ text: '🇫🇷 Français', callback_data: 'lang_fr' }],
      [{ text: '🇩🇪 Deutsch', callback_data: 'lang_de' }],
      [{ text: '🇸🇦 العربية', callback_data: 'lang_ar' }]
    ]
  };
}

// Create post creation keyboard
function getPostCreationKeyboard(userId) {
  return {
    keyboard: [
      [t(userId, 'upload_image'), t(userId, 'add_emoji')],
      ['🔍 Preview Post', t(userId, 'publish_post')],
      [t(userId, 'share_via_email'), t(userId, 'back_to_menu')]
    ],
    resize_keyboard: true
  };
}

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate email sharing link
function generateEmailLink(post, userId) {
  const subject = encodeURIComponent('Check out this amazing post!');
  let body = '';
  
  if (post.text) {
    body += encodeURIComponent(post.text + '\n\n');
  }
  
  if (post.poll) {
    body += encodeURIComponent(`Poll: ${post.poll.question}\nOptions: ${post.poll.options.join(', ')}\n\n`);
  }
  
  body += encodeURIComponent('Shared via Post Creator Bot');
  
  return `mailto:?subject=${subject}&body=${body}`;
}

// Show post preview function
function showPostPreview(userId) {
  const user = userData.get(userId);
  if (!user || !user.currentPost) return;
  
  let previewText = '🔍 **Post Preview:**\n\n';
  
  if (user.currentPost.text) {
    previewText += user.currentPost.text + '\n\n';
  }
  
  if (user.currentPost.images.length > 0) {
    previewText += `📷 **Images:** ${user.currentPost.images.length} image(s)\n`;
  }
  
  if (user.currentPost.poll) {
    previewText += `📊 **Poll:** ${user.currentPost.poll.question}\n`;
    previewText += `**Options:** ${user.currentPost.poll.options.join(', ')}\n`;
  }
  
  if (!user.currentPost.text && user.currentPost.images.length === 0 && !user.currentPost.poll) {
    previewText += '_No content added yet_';
  }
  
  // Show preview with image if available
  if (user.currentPost.images.length > 0) {
    bot.sendPhoto(userId, user.currentPost.images[0], {
      caption: previewText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Edit', callback_data: 'edit_post' }, { text: '🚀 Publish', callback_data: 'publish_now' }]
        ]
      }
    });
  } else {
    bot.sendMessage(userId, previewText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Edit', callback_data: 'edit_post' }, { text: '🚀 Publish', callback_data: 'publish_now' }]
        ]
      }
    });
  }
}

// Create premium emoji keyboard
function getPremiumEmojiKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '💖 Hearts', callback_data: 'emoji_hearts' }, { text: '⭐ Stars', callback_data: 'emoji_stars' }],
      [{ text: '🌸 Nature', callback_data: 'emoji_nature' }, { text: '🎭 Special', callback_data: 'emoji_special' }],
      [{ text: '👑 Crown', callback_data: 'emoji_crown' }, { text: '🔥 Fire', callback_data: 'emoji_fire' }],
      [{ text: '💻 Tech', callback_data: 'emoji_tech' }, { text: '✈️ Travel', callback_data: 'emoji_travel' }]
    ]
  };
}

// Start command
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  
  initUser(userId);
  
  const user = userData.get(userId);
  user.state = userStates.MAIN_MENU;
  
  const userName = msg.from.first_name || msg.from.username || 'User';
  
  if (isGroup) {
    // Group welcome message
    const groupWelcome = `🎉 Hello everyone! I'm the Post Creator Bot!\n\nI can help you create amazing posts with images, polls, and premium emojis. Use /help to see what I can do!\n\n📝 To create posts, please message me privately @${bot.options.username || 'PostCreatorBot'}`;
    bot.sendMessage(chatId, groupWelcome);
  } else {
    // Private chat welcome message
    const welcomeMessage = t(userId, 'welcome').replace('%name%', userName);
    bot.sendMessage(userId, welcomeMessage, {
      reply_markup: getMainMenuKeyboard(userId)
    });
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  
  if (isGroup) {
    const groupHelpText = `🆘 **Post Creator Bot Help**\n\n📝 **Features:**\n• Create posts with text and images\n• Add interactive polls\n• Use premium emoji collections\n• Multi-language support\n\n**How to use:**\n1. Send me a private message: @${bot.options.username || 'PostCreatorBot'}\n2. Use /start to begin creating posts\n3. Share your created posts back to this group!\n\n**Commands:**\n/start - Start the bot\n/help - Show this help\n/language - Change language`;
    
    bot.sendMessage(chatId, groupHelpText, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(userId, t(userId, 'help_text'));
  }
});

// Language command
bot.onText(/\/language/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  
  if (isGroup) {
    bot.sendMessage(chatId, `🌐 To change language settings, please message me privately: @${bot.options.username || 'PostCreatorBot'}`, {
      reply_to_message_id: msg.message_id
    });
  } else {
    bot.sendMessage(userId, t(userId, 'choose_language'), {
      reply_markup: getLanguageKeyboard()
    });
  }
});

// Contact command
bot.onText(/\/contact/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  
  if (isGroup) {
    bot.sendMessage(chatId, `💬 For support and communication, please message me privately: @${bot.options.username || 'PostCreatorBot'}`, {
      reply_to_message_id: msg.message_id
    });
  } else {
    bot.sendMessage(userId, t(userId, 'communication_menu'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Contact @emine9104', url: 'https://t.me/emine9104' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_main' }]
        ]
      }
    });
  }
});

// Admin command
bot.onText(/\/admin/, (msg) => {
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    bot.sendMessage(userId, '❌ Access denied. This command is for administrators only.');
    return;
  }
  
  const user = userData.get(userId) || {};
  user.state = userStates.ADMIN_PANEL;
  userData.set(userId, user);
  
  const statsText = `🔐 **Admin Panel**\n\n📊 **Bot Statistics:**\n• Total Users: ${adminData.stats.totalUsers}\n• Active Today: ${adminData.stats.dailyUsers.size}\n• Total Posts: ${adminData.stats.totalPosts}\n• Total Messages: ${adminData.stats.totalMessages}\n• Blocked Users: ${adminData.blockedUsers.size}\n• Premium Users: ${adminData.premiumUsers.size}\n\n⚙️ **Bot Status:**\n• Maintenance Mode: ${adminData.maintenanceMode ? 'ON' : 'OFF'}\n• Custom Commands: ${adminData.customCommands.size}`;
  
  bot.sendMessage(userId, statsText, {
    parse_mode: 'Markdown',
    reply_markup: getAdminKeyboard()
  });
});

// Stats command (Admin only)
bot.onText(/\/stats/, (msg) => {
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) return;
  
  const users = Array.from(userData.keys());
  const languageStats = {};
  
  users.forEach(uid => {
    const lang = getUserLanguage(uid);
    languageStats[lang] = (languageStats[lang] || 0) + 1;
  });
  
  const statsText = `📈 **Detailed Statistics**\n\n👥 **Users:** ${users.length}\n📅 **Daily Active:** ${adminData.stats.dailyUsers.size}\n📝 **Posts Created:** ${adminData.stats.totalPosts}\n💬 **Messages:** ${adminData.stats.totalMessages}\n\n🌐 **Language Distribution:**\n${Object.entries(languageStats).map(([lang, count]) => `• ${lang.toUpperCase()}: ${count}`).join('\n')}\n\n🚫 **Blocked:** ${adminData.blockedUsers.size}\n💎 **Premium:** ${adminData.premiumUsers.size}`;
  
  bot.sendMessage(userId, statsText, { parse_mode: 'Markdown' });
});

// Broadcast command (Admin only)
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const message = match[1];
  
  if (!isAdmin(userId)) return;
  
  const users = Array.from(userData.keys());
  let sent = 0;
  let failed = 0;
  
  bot.sendMessage(userId, `📢 Broadcasting to ${users.length} users...`);
  
  users.forEach(async (uid) => {
    if (!adminData.blockedUsers.has(uid)) {
      try {
        await bot.sendMessage(uid, `📢 **Admin Broadcast:**\n\n${message}`, { parse_mode: 'Markdown' });
        sent++;
      } catch (error) {
        failed++;
      }
    }
  });
  
  setTimeout(() => {
    bot.sendMessage(userId, `✅ Broadcast completed!\n• Sent: ${sent}\n• Failed: ${failed}`);
  }, 2000);
});

// Handle callback queries (inline keyboard buttons)
bot.on('callback_query', (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  // Admin callback handlers
  if (isAdmin(userId)) {
    if (data === 'admin_back') {
      bot.answerCallbackQuery(callbackQuery.id);
      bot.sendMessage(userId, '🔐 Admin Panel', {
        reply_markup: getAdminKeyboard()
      });
      return;
    }
    
    if (data === 'admin_view_users') {
      const users = Array.from(userData.keys());
      const userList = users.slice(0, 20).map((uid, index) => {
        const lang = getUserLanguage(uid);
        const blocked = adminData.blockedUsers.has(uid) ? '🚫' : '✅';
        const premium = adminData.premiumUsers.has(uid) ? '💎' : '';
        return `${index + 1}. ID: ${uid} ${blocked} ${premium} (${lang})`;
      }).join('\n');
      
      bot.answerCallbackQuery(callbackQuery.id);
      bot.sendMessage(userId, `👥 **Users (showing first 20):**\n\n${userList}\n\nTotal: ${users.length}`, {
        parse_mode: 'Markdown',
        reply_markup: getUserManagementKeyboard()
      });
      return;
    }
    
    if (data === 'admin_toggle_maintenance') {
      adminData.maintenanceMode = !adminData.maintenanceMode;
      bot.answerCallbackQuery(callbackQuery.id, { 
        text: `Maintenance mode ${adminData.maintenanceMode ? 'enabled' : 'disabled'}` 
      });
      
      bot.sendMessage(userId, `⚙️ Bot Settings\n\nMaintenance mode: ${adminData.maintenanceMode ? 'ON' : 'OFF'}`, {
        reply_markup: getBotSettingsKeyboard()
      });
      return;
    }
  }
  
  if (data.startsWith('lang_')) {
    const lang = data.split('_')[1];
    saveUserLanguage(userId, lang);
    
    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(userId, t(userId, 'language_changed'), {
      reply_markup: getMainMenuKeyboard(userId)
    });
  }
  
  if (data.startsWith('emoji_')) {
    const category = data.split('_')[1];
    const emojis = premiumEmojis[category];
    
    const emojiKeyboard = {
      inline_keyboard: emojis.map(emoji => [{ text: emoji, callback_data: `add_emoji_${emoji}` }])
    };
    
    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(userId, `Choose an emoji:`, {
      reply_markup: emojiKeyboard
    });
  }
  
  if (data.startsWith('add_emoji_')) {
    const emoji = data.split('add_emoji_')[1];
    const user = userData.get(userId);
    
    if (user && user.currentPost) {
      user.currentPost.text += emoji;
      bot.answerCallbackQuery(callbackQuery.id, { text: `Added ${emoji}!` });
      
      // Show updated preview
      showPostPreview(userId);
    }
  }
  
  if (data === 'create_new_post') {
    const user = userData.get(userId);
    user.state = userStates.POST_CREATION;
    user.currentPost = { text: '', images: [], poll: null };
    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(userId, t(userId, 'post_creation'), {
      reply_markup: getPostCreationKeyboard(userId)
    });
  }
  
  if (data === 'preview_post') {
    bot.answerCallbackQuery(callbackQuery.id);
    showPostPreview(userId);
  }
  
  if (data === 'back_to_main') {
    const user = userData.get(userId);
    if (user) {
      user.state = userStates.MAIN_MENU;
    }
    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(userId, t(userId, 'main_menu'), {
      reply_markup: getMainMenuKeyboard(userId)
    });
  }
});

// Handle new chat members (when bot is added to group)
bot.on('new_chat_members', (msg) => {
  const newMembers = msg.new_chat_members;
  const chatId = msg.chat.id;
  
  // Check if our bot was added
  const botAdded = newMembers.some(member => member.username === bot.options.username);
  
  if (botAdded) {
    const groupWelcome = `🎉 Hello everyone! Thanks for adding me to ${msg.chat.title || 'this group'}!\n\nI'm the Post Creator Bot and I can help you create amazing posts with images, polls, and premium emojis.\n\n📝 To create posts, please message me privately\n❓ Use /help to see all my features\n🌐 Use /language to change language settings`;
    
    bot.sendMessage(chatId, groupWelcome);
  }
});

// Handle inline queries (for sharing posts)
bot.on('inline_query', (query) => {
  const queryText = query.query || 'Check out this amazing post!';
  
  const results = [
    {
      type: 'article',
      id: '1',
      title: '📝 Share Post',
      description: 'Share your created post',
      input_message_content: {
        message_text: queryText
      }
    }
  ];
  
  bot.answerInlineQuery(query.id, results);
});

// Handle text messages
bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // Skip commands
  
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  
  // Update stats
  updateStats(userId);
  
  // Check if user is blocked
  if (adminData.blockedUsers.has(userId) && !isAdmin(userId)) {
    return; // Silently ignore blocked users
  }
  
  // Check maintenance mode
  if (adminData.maintenanceMode && !isAdmin(userId)) {
    bot.sendMessage(userId, '🔧 Bot is currently under maintenance. Please try again later.');
    return;
  }
  
  // If it's a group message, only respond to mentions or direct replies
  if (isGroup) {
    const botMentioned = msg.text && (
      msg.text.includes(`@${bot.options.username}`) ||
      (msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.from.is_bot)
    );
    
    if (botMentioned) {
      bot.sendMessage(chatId, `👋 Hi! To create posts with me, please send me a private message. Click here: https://t.me/${bot.options.username}`, {
        reply_to_message_id: msg.message_id
      });
    }
    return; // Don't process group messages for post creation
  }
  
  initUser(userId);
  const user = userData.get(userId);
  
  // Count new users
  if (!userData.has(userId)) {
    adminData.stats.totalUsers++;
  }
  
  if (!text) return; // Skip non-text messages for this handler
  
  // Admin menu handling
  if (isAdmin(userId) && user.state === userStates.ADMIN_PANEL) {
    if (text === '📊 Statistics') {
      const detailedStats = `📈 **Detailed Statistics**\n\n👥 **Total Users:** ${adminData.stats.totalUsers}\n📅 **Active Today:** ${adminData.stats.dailyUsers.size}\n📝 **Posts Created:** ${adminData.stats.totalPosts}\n💬 **Total Messages:** ${adminData.stats.totalMessages}\n🚫 **Blocked Users:** ${adminData.blockedUsers.size}\n💎 **Premium Users:** ${adminData.premiumUsers.size}\n⚙️ **Maintenance:** ${adminData.maintenanceMode ? 'ON' : 'OFF'}\n🛠️ **Custom Commands:** ${adminData.customCommands.size}`;
      
      bot.sendMessage(userId, detailedStats, { parse_mode: 'Markdown' });
      return;
    }
    
    if (text === '👥 User Management') {
      bot.sendMessage(userId, '👥 **User Management**\n\nChoose an action:', {
        parse_mode: 'Markdown',
        reply_markup: getUserManagementKeyboard()
      });
      return;
    }
    
    if (text === '📢 Broadcast') {
      user.state = userStates.ADMIN_BROADCAST;
      bot.sendMessage(userId, '📢 **Broadcast Message**\n\nSend me the message you want to broadcast to all users:');
      return;
    }
    
    if (text === '⚙️ Bot Settings') {
      bot.sendMessage(userId, '⚙️ **Bot Settings**', {
        reply_markup: getBotSettingsKeyboard()
      });
      return;
    }
    
    if (text === '🛠️ Custom Commands') {
      const commandsList = Array.from(adminData.customCommands.entries())
        .map(([cmd, response]) => `• /${cmd}`)
        .join('\n') || 'No custom commands';
      
      bot.sendMessage(userId, `🛠️ **Custom Commands**\n\n${commandsList}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add Command', callback_data: 'admin_add_cmd' }],
            [{ text: '🗑️ Remove Command', callback_data: 'admin_remove_cmd' }],
            [{ text: '🔙 Back', callback_data: 'admin_back' }]
          ]
        }
      });
      return;
    }
    
    if (text === '💎 Premium Users') {
      const premiumList = Array.from(adminData.premiumUsers).slice(0, 10)
        .map((uid, i) => `${i + 1}. ${uid}`)
        .join('\n') || 'No premium users';
      
      bot.sendMessage(userId, `💎 **Premium Users**\n\n${premiumList}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add Premium', callback_data: 'admin_add_premium' }],
            [{ text: '➖ Remove Premium', callback_data: 'admin_remove_premium' }],
            [{ text: '🔙 Back', callback_data: 'admin_back' }]
          ]
        }
      });
      return;
    }
    
    if (text === '🔙 Exit Admin') {
      user.state = userStates.MAIN_MENU;
      bot.sendMessage(userId, '👋 Exited admin panel', {
        reply_markup: getMainMenuKeyboard(userId)
      });
      return;
    }
  }
  
  // Admin broadcast state
  if (isAdmin(userId) && user.state === userStates.ADMIN_BROADCAST) {
    const users = Array.from(userData.keys());
    let sent = 0;
    let failed = 0;
    
    bot.sendMessage(userId, `📢 Broadcasting to ${users.length} users...`);
    
    users.forEach(async (uid) => {
      if (!adminData.blockedUsers.has(uid) && uid !== userId) {
        try {
          await bot.sendMessage(uid, `📢 **Announcement:**\n\n${text}`, { parse_mode: 'Markdown' });
          sent++;
        } catch (error) {
          failed++;
        }
      }
    });
    
    setTimeout(() => {
      bot.sendMessage(userId, `✅ Broadcast completed!\n• Sent: ${sent}\n• Failed: ${failed}`, {
        reply_markup: getAdminKeyboard()
      });
      user.state = userStates.ADMIN_PANEL;
    }, 3000);
    return;
  }
  
  // Handle menu buttons
  if (text === t(userId, 'main_menu') || text === t(userId, 'back_to_menu')) {
    user.state = userStates.MAIN_MENU;
    bot.sendMessage(userId, t(userId, 'main_menu'), {
      reply_markup: getMainMenuKeyboard(userId)
    });
    return;
  }
  
  if (text === t(userId, 'help_menu')) {
    bot.sendMessage(userId, t(userId, 'help_text'));
    return;
  }
  
  if (text === t(userId, 'language_settings')) {
    bot.sendMessage(userId, t(userId, 'choose_language'), {
      reply_markup: getLanguageKeyboard()
    });
    return;
  }
  
  if (text === t(userId, 'create_post')) {
    user.state = userStates.POST_CREATION;
    user.currentPost = { text: '', images: [], poll: null };
    bot.sendMessage(userId, t(userId, 'post_creation'), {
      reply_markup: getPostCreationKeyboard(userId)
    });
    return;
  }
  
  if (text === t(userId, 'upload_image')) {
    user.state = userStates.WAITING_FOR_IMAGE;
    bot.sendMessage(userId, t(userId, 'send_image'));
    return;
  }
  
  if (text === t(userId, 'create_poll')) {
    user.state = userStates.WAITING_FOR_POLL_QUESTION;
    bot.sendMessage(userId, t(userId, 'poll_creation'));
    return;
  }
  
  if (text === t(userId, 'premium_emojis')) {
    bot.sendMessage(userId, t(userId, 'premium_emoji_menu'), {
      reply_markup: getPremiumEmojiKeyboard()
    });
    return;
  }
  
  if (text === t(userId, 'share_via_email')) {
    if (user.currentPost && (user.currentPost.text || user.currentPost.images.length > 0 || user.currentPost.poll)) {
      user.state = userStates.WAITING_FOR_EMAIL;
      bot.sendMessage(userId, t(userId, 'email_prompt'));
    } else {
      bot.sendMessage(userId, 'Please create a post first before sharing via email!');
    }
    return;
  }
  
  if (text === t(userId, 'communication')) {
    bot.sendMessage(userId, t(userId, 'communication_menu'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Contact @emine9104', url: 'https://t.me/emine9104' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_main' }]
        ]
      }
    });
    return;
  }
  
  if (text === t(userId, 'publish_post')) {
    if (user.currentPost.text || user.currentPost.images.length > 0 || user.currentPost.poll) {
      // Send the actual post with images and content
      if (user.currentPost.images.length > 0) {
        // Send image(s) with caption
        if (user.currentPost.images.length === 1) {
          // Single image with caption
          bot.sendPhoto(userId, user.currentPost.images[0], {
            caption: user.currentPost.text || '',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📤 Share this post', switch_inline_query: user.currentPost.text || 'Check out this post!' }],
                [{ text: '🔄 Create another post', callback_data: 'create_new_post' }]
              ]
            }
          });
        } else {
          // Multiple images as media group
          const mediaGroup = user.currentPost.images.map((imageId, index) => ({
            type: 'photo',
            media: imageId,
            caption: index === 0 ? user.currentPost.text || '' : undefined
          }));
          
          bot.sendMediaGroup(userId, mediaGroup).then(() => {
            bot.sendMessage(userId, '📤 Your post is ready!', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📤 Share this post', switch_inline_query: user.currentPost.text || 'Check out this post!' }],
                  [{ text: '🔄 Create another post', callback_data: 'create_new_post' }]
                ]
              }
            });
          });
        }
      } else if (user.currentPost.text) {
        // Text-only post
        bot.sendMessage(userId, user.currentPost.text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📤 Share this post', switch_inline_query: user.currentPost.text }],
              [{ text: '🔄 Create another post', callback_data: 'create_new_post' }]
            ]
          }
        });
      }
      
      // Send poll if exists
      if (user.currentPost.poll) {
        bot.sendPoll(userId, user.currentPost.poll.question, user.currentPost.poll.options, {
          is_anonymous: false,
          reply_markup: {
            inline_keyboard: [
              [{ text: '📤 Share this poll', switch_inline_query: user.currentPost.poll.question }]
            ]
          }
        });
      }
      
      // Increment post count
      adminData.stats.totalPosts++;
      
      // Success message and return to menu
      setTimeout(() => {
        bot.sendMessage(userId, t(userId, 'share_success') + '\n\nYou can now share it using the share buttons above.', {
          reply_markup: getMainMenuKeyboard(userId)
        });
      }, 1000);
      
      // Reset post data
      user.currentPost = { text: '', images: [], poll: null };
      user.state = userStates.MAIN_MENU;
    } else {
      bot.sendMessage(userId, 'Please add some content to your post first!');
    }
    return;
  }
  
  // Handle preview button
  if (text === '🔍 Preview Post') {
    showPostPreview(userId);
    return;
  }
  
  // Handle different user states
  switch (user.state) {
    case userStates.POST_CREATION:
      user.currentPost.text += text + ' ';
      bot.sendMessage(userId, t(userId, 'content_added'), {
        reply_markup: getPostCreationKeyboard(userId)
      });
      // Auto-show preview after adding text
      setTimeout(() => showPostPreview(userId), 500);
      break;
      
    case userStates.WAITING_FOR_CAPTION:
      user.currentPost.text = text;
      user.state = userStates.POST_CREATION;
      bot.sendMessage(userId, `✅ Caption added! Current post:\n\n${user.currentPost.text}`, {
        reply_markup: getPostCreationKeyboard(userId)
      });
      break;
      
    case userStates.WAITING_FOR_POLL_QUESTION:
      user.pollData.question = text;
      user.state = userStates.WAITING_FOR_POLL_OPTIONS;
      bot.sendMessage(userId, t(userId, 'poll_question_received'));
      break;
      
    case userStates.WAITING_FOR_POLL_OPTIONS:
      const options = text.split('\n').filter(option => option.trim());
      if (options.length >= 2) {
        user.currentPost.poll = {
          question: user.pollData.question,
          options: options
        };
        user.state = userStates.POST_CREATION;
        bot.sendMessage(userId, t(userId, 'poll_created'), {
          reply_markup: getPostCreationKeyboard(userId)
        });
      } else {
        bot.sendMessage(userId, 'Please provide at least 2 options (one per line):');
      }
      break;
      
    case userStates.WAITING_FOR_EMAIL:
      if (isValidEmail(text)) {
        const emailLink = generateEmailLink(user.currentPost, userId);
        bot.sendMessage(userId, `${t(userId, 'email_sent')}\n\n📧 Click here to open your email client:\n${emailLink}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📧 Send Email', url: emailLink }],
              [{ text: '🔙 Back to Menu', callback_data: 'back_to_main' }]
            ]
          }
        });
        user.state = userStates.MAIN_MENU;
      } else {
        bot.sendMessage(userId, t(userId, 'invalid_email'));
      }
      break;
  }
});

// Handle photo uploads
bot.on('photo', (msg) => {
  const userId = msg.from.id;
  initUser(userId);
  const user = userData.get(userId);
  
  if (user.state === userStates.WAITING_FOR_IMAGE || user.state === userStates.POST_CREATION) {
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
    user.currentPost.images.push(photo.file_id);
    
    if (user.state === userStates.WAITING_FOR_IMAGE) {
      user.state = userStates.WAITING_FOR_CAPTION;
      bot.sendMessage(userId, t(userId, 'image_received'));
    } else {
      bot.sendMessage(userId, `📷 Image added! Total images: ${user.currentPost.images.length}`, {
        reply_markup: getPostCreationKeyboard(userId)
      });
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});

console.log('🤖 Telegram Post Creator Bot is running...');
console.log('🔗 Make sure to set your TELEGRAM_BOT_TOKEN environment variable');
