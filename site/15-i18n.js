/* Part 1b: languages. A hotel site is written in English and can also be shown in Latvian, Russian, German and French.

     NS.LANGS            the languages a site can offer (code -> {name, short, locale})
     NS.lang             the language the page is drawn in now ('en' unless the guest or the page picked another)
     NS.t(s, vars)       the site's own words (buttons, headings, the automatic stay plan): s is the English text,
                         looked up in DICT below; {name} placeholders are filled from vars (plain text)
     NS.th(s, vars)      the same, HTML-escaped, with vars that are already HTML (for <b>…</b> inside a sentence)
     NS.tr(s)            the owner's own texts (story, rooms, FAQ…): their translation in data.i18n[lang][english],
                         else DICT (default kinds/titles), else the English as written
     NS.siteLangs(data)  ['en'] + the languages the owner switched on (data.langs)
     NS.setLang(code, data)
   Translations of the owner's texts are keyed by the English text itself, so a changed English sentence simply
   shows in English until it is translated again (no wrong, out-of-date translation). The editor's Languages tab
   (theme/assets/ns-editor.js) fills data.i18n.
   DICT: English -> [Latvian, Russian, German, French] (tools/i18n_dict.py checks that every row has all four, with the
   English key's {placeholders}; check.py runs it). French is neutral and Quebec-friendly: a no-break space before ':' and
   inside the guillemets, none before ! ? ;, 'courriel', 'stationnement', meals named without the dejeuner/diner clash.
   Place names are never declined: the sentences are built so a name
   can stand as it is ("Kafija: X", «X»). Add a line here for every new English string the renderer shows. */
(function () {
  'use strict';
  var NS = window.NSSite;
  NS.LANGS = {
    en: { name: 'English', short: 'EN', locale: 'en_GB' },
    lv: { name: 'Latviešu', short: 'LV', locale: 'lv_LV' },
    ru: { name: 'Русский', short: 'RU', locale: 'ru_RU' },
    de: { name: 'Deutsch', short: 'DE', locale: 'de_DE' },
    fr: { name: 'Français', short: 'FR', locale: 'fr_FR' }
  };
  NS.LANG_ORDER = ['en', 'lv', 'ru', 'de', 'fr'];
  NS.lang = 'en';
  var IDX = { lv: 0, ru: 1, de: 2, fr: 3 };
  var owner = {};   // data.i18n[NS.lang] of the site being drawn

  var DICT = {
    /* ---------------------------------------------------------------- frame */
    "Rooms": ["Numuri", "Номера", "Zimmer", "Chambres"],
    "Your stay": ["Jūsu brauciens", "Ваша поездка", "Ihr Aufenthalt", "Votre séjour"],
    "Neighbourhood": ["Apkārtne", "Окрестности", "Umgebung", "Quartier"],
    "Booking": ["Rezervācija", "Бронирование", "Buchung", "Réservation"],
    "Book": ["Rezervēt", "Забронировать", "Buchen", "Réserver"],
    "Menu": ["Izvēlne", "Меню", "Menü", "Menu"],
    "Contact": ["Kontakti", "Контакты", "Kontakt", "Contact"],
    "Language": ["Valoda", "Язык", "Sprache", "Langue"],
    "Show everything": ["Rādīt visu", "Показать всё", "Alles zeigen", "Tout afficher"],
    "Photo and data credits": ["Foto un datu avoti", "Источники фото и данных", "Foto- und Datenquellen", "Crédits photos et données"],
    "Website made with {platform}": ["Mājaslapa veidota ar {platform}", "Сайт создан в {platform}", "Website erstellt mit {platform}", "Site créé avec {platform}"],
    "Scroll down": ["Ritināt uz leju", "Прокрутить вниз", "Nach unten scrollen", "Défiler vers le bas"],
    "Hotel": ["Viesnīca", "Отель", "Hotel", "Hôtel"],
    "Your hotel": ["Jūsu viesnīca", "Ваш отель", "Ihr Hotel", "Votre hôtel"],
    "Close": ["Aizvērt", "Закрыть", "Schließen", "Fermer"],
    "Previous": ["Iepriekšējā", "Назад", "Zurück", "Précédent"],
    "Next": ["Nākamā", "Вперёд", "Weiter", "Suivant"],

    /* ---------------------------------------------------------------- hero + profiles */
    "Check availability": ["Pārbaudīt pieejamību", "Проверить наличие мест", "Verfügbarkeit prüfen", "Voir les disponibilités"],
    "Plan your stay": ["Plānot braucienu", "Спланировать поездку", "Aufenthalt planen", "Préparez votre séjour"],
    "For {who}:": ["Ja esat {who}:", "Если вы — {who}:", "Als {who}:", "Pour le profil « {who} » :"],
    "Made for you": ["Veidots jums", "Специально для вас", "Für Sie gemacht", "Pensé pour vous"],
    "Who is coming?": ["Kas brauc?", "Кто едет?", "Wer kommt?", "Qui sera du voyage?"],
    "Pick the traveller you are. The whole page rearranges itself: rooms, places, and a stay planned hour by hour.": [
      "Izvēlieties, kāds ceļotājs esat. Visa lapa pielāgojas jums: numuri, vietas un brauciens, saplānots pa stundām.",
      "Выберите, какой вы путешественник. Вся страница подстроится под вас: номера, места и поездка, расписанная по часам.",
      "Wählen Sie, welcher Reisetyp Sie sind. Die ganze Seite passt sich an: Zimmer, Orte und ein Aufenthalt, Stunde für Stunde geplant.", "Choisissez votre profil de voyage. Toute la page se réorganise : chambres, adresses et un séjour planifié heure par heure."],
    "Choose your kind of trip": ["Izvēlieties brauciena veidu", "Выберите тип поездки", "Wählen Sie Ihre Art zu reisen", "Choisissez votre type de voyage"],
    "Everyone": ["Visiem", "Для всех", "Alle", "Tout le monde"],
    "Show me everything": ["Parādiet man visu", "Покажите мне всё", "Alles anzeigen", "Montrez-moi tout"],
    "Showing the site for {who}.": ["Lapa parādīta: {who}.", "Сайт показан для: {who}.", "Die Seite für: {who}.", "Site adapté au profil {who}."],
    "See your stay": ["Skatīt jūsu braucienu", "Посмотреть вашу поездку", "Ihren Aufenthalt ansehen", "Voir votre séjour"],

    /* ---------------------------------------------------------------- sections */
    "Our story": ["Mūsu stāsts", "Наша история", "Unsere Geschichte", "Notre histoire"],
    "Welcome": ["Laipni lūdzam", "Добро пожаловать", "Willkommen", "Bienvenue"],
    "Why stay here": ["Kāpēc šeit", "Почему здесь", "Warum hier", "Pourquoi séjourner ici"],
    "The best address in the neighbourhood": ["Labākā adrese apkārtnē", "Лучший адрес в округе", "Die beste Adresse im Viertel", "La meilleure adresse du quartier"],
    "for you": ["jums", "для вас", "für Sie", "pour vous"],
    "Sleep well": ["Labu nakti", "Спокойной ночи", "Gut schlafen", "Dormez bien"],
    "Rooms are coming soon.": ["Numuri drīzumā būs redzami.", "Номера скоро появятся.", "Die Zimmer folgen in Kürze.", "Les chambres seront bientôt en ligne."],
    "{room} photo {n}": ["{room}, foto {n}", "{room}, фото {n}", "{room}, Foto {n}", "{room}, photo {n}"],
    "Previous photo": ["Iepriekšējā foto", "Предыдущее фото", "Vorheriges Foto", "Photo précédente"],
    "Next photo": ["Nākamā foto", "Следующее фото", "Nächstes Foto", "Photo suivante"],
    "Photos coming soon": ["Foto drīzumā", "Фото скоро", "Fotos folgen", "Photos à venir"],
    "Drawing of the room": ["Numura zīmējums", "Рисунок номера", "Zeichnung des Zimmers", "Dessin de la chambre"],
    "Up to {n}": ["Līdz {n}", "До {n}", "Bis {n}", "Jusqu'à {n}"],
    "{n} photos": ["{n} foto", "Фото: {n}", "{n} Fotos", "{n} photos"],
    "3D tour": ["3D tūre", "3D-тур", "3D-Rundgang", "Visite 3D"],
    "Video": ["Video", "Видео", "Video", "Vidéo"],
    "Perfect for you": ["Ideāli jums", "Идеально для вас", "Perfekt für Sie", "Idéal pour vous"],
    "from {price} / night": ["no {price} / nakts", "от {price} / ночь", "ab {price} / Nacht", "dès {price} / nuit"],
    "Check dates": ["Pārbaudīt datumus", "Проверить даты", "Termine prüfen", "Voir les dates"],
    "Tour {n}": ["Tūre {n}", "Тур {n}", "Rundgang {n}", "Visite {n}"],
    "Drag to look around": ["Velciet, lai paskatītos apkārt", "Потяните, чтобы осмотреться", "Ziehen, um sich umzusehen", "Faites glisser pour explorer"],
    "Full screen": ["Pilnekrāns", "Во весь экран", "Vollbild", "Plein écran"],
    "Virtual tour": ["Virtuālā tūre", "Виртуальный тур", "Virtueller Rundgang", "Visite virtuelle"],
    "Back": ["Atpakaļ", "Назад", "Zurück", "Retour"],
    "Walk on": ["Iet tālāk", "Идти дальше", "Weitergehen", "Continuer"],
    "Look around": ["Paskatieties apkārt", "Осмотритесь", "Schauen Sie sich um", "Faites le tour"],
    "Step inside": ["Ienāciet", "Заходите", "Treten Sie ein", "Poussez la porte"],
    "{room}: drag to look around.": ["{room}: velciet, lai paskatītos apkārt.", "{room}: потяните, чтобы осмотреться.", "{room}: ziehen, um sich umzusehen.", "{room} : faites glisser pour explorer."],
    "Gallery": ["Galerija", "Галерея", "Galerie", "Galerie"],
    "A closer look": ["Tuvāk", "Поближе", "Genauer hingesehen", "De plus près"],
    "Your stay, planned": ["Jūsu brauciens, saplānots", "Ваша поездка, уже спланирована", "Ihr Aufenthalt, geplant", "Votre séjour, tout planifié"],
    "Your stay, hour by hour": ["Jūsu brauciens pa stundām", "Ваша поездка по часам", "Ihr Aufenthalt, Stunde für Stunde", "Votre séjour, heure par heure"],
    "Written for the way you travel, from the places around us. Change the trip and watch it rewrite itself.": [
      "Uzrakstīts tieši jūsu ceļošanas veidam, no vietām mums apkārt. Mainiet braucienu, un plāns pārrakstīsies pats.",
      "Написано под ваш стиль путешествий, по местам вокруг нас. Измените поездку, и план перепишется сам.",
      "Geschrieben für Ihre Art zu reisen, aus den Orten rund um uns. Ändern Sie die Reise, und der Plan schreibt sich neu.", "Écrit selon votre façon de voyager, avec les adresses du quartier. Modifiez le voyage : le programme se réécrit sous vos yeux."],
    "Travelling as": ["Ceļoju kā", "Я путешествую как", "Ich reise als", "Votre profil"],
    "Nights": ["Naktis", "Ночей", "Nächte", "Nuits"],
    "Season": ["Sezona", "Сезон", "Jahreszeit", "Saison"],
    "Day {n}": ["{n}. diena", "День {n}", "Tag {n}", "Jour {n}"],
    "Show on map": ["Rādīt kartē", "Показать на карте", "Auf der Karte zeigen", "Voir sur la carte"],
    "Google Maps": ["Google Maps", "Google Карты", "Google Maps", "Google Maps"],
    "Walk this day on the map": ["Izstaigāt šo dienu kartē", "Пройти этот день по карте", "Diesen Tag auf der Karte ablaufen", "Parcourir cette journée sur la carte"],
    "Our pick for you: {room}": ["Mūsu izvēle jums: {room}", "Наш выбор для вас: {room}", "Unsere Wahl für Sie: {room}", "Notre choix pour vous : {room}"],
    "Book this stay": ["Rezervēt šo braucienu", "Забронировать эту поездку", "Diesen Aufenthalt buchen", "Réserver ce séjour"],
    "The neighbourhood": ["Apkārtne", "Окрестности", "Die Umgebung", "Le quartier"],
    "Everything is a short walk away": ["Viss ir pāris soļu attālumā", "Всё в нескольких шагах", "Alles ist nur ein paar Schritte entfernt", "Tout est à deux pas"],
    "Drag to turn · tap a pin for details": ["Velciet, lai pagrieztu · pieskarieties punktam", "Потяните, чтобы повернуть · нажмите на точку", "Ziehen zum Drehen · Punkt antippen für Details", "Glissez pour pivoter · touchez un repère pour plus de détails"],
    "All": ["Visi", "Все", "Alle", "Tous"],
    "No places in this filter yet.": ["Šajā filtrā vietu vēl nav.", "В этом фильтре пока нет мест.", "In diesem Filter gibt es noch keine Orte.", "Aucune adresse dans ce filtre pour l'instant."],
    "{n} min": ["{n} min", "{n} мин", "{n} Min.", "{n} min"],
    "min": ["min", "мин", "Min.", "min"],
    "Read more": ["Lasīt vairāk", "Читать дальше", "Mehr lesen", "En savoir plus"],
    "Watch": ["Skatieties", "Смотрите", "Ansehen", "En vidéo"],
    "See it for yourself": ["Pārliecinieties paši", "Убедитесь сами", "Überzeugen Sie sich selbst", "Voyez par vous-même"],
    "Video {n}": ["Video {n}", "Видео {n}", "Video {n}", "Vidéo {n}"],
    "Eat & drink": ["Ēst un dzert", "Еда и напитки", "Essen & Trinken", "Manger et boire"],
    "See the menu": ["Skatīt ēdienkarti", "Посмотреть меню", "Zur Speisekarte", "Voir le menu"],
    "Reserve a table": ["Rezervēt galdiņu", "Забронировать столик", "Tisch reservieren", "Réserver une table"],
    "Guests say": ["Viesi saka", "Гости говорят", "Gäste sagen", "Paroles de clients"],
    "Loved by our guests": ["Mūsu viesu iecienīta", "Любимый отель наших гостей", "Von unseren Gästen geliebt", "Ils ont adoré"],
    "{n} reviews": ["{n} atsauksmes", "Отзывов: {n}", "{n} Bewertungen", "{n} avis"],
    "A guest": ["Viesis", "Гость", "Ein Gast", "Un client"],
    "Book with confidence": ["Rezervējiet droši", "Бронируйте спокойно", "Sicher buchen", "Réservez en toute confiance"],
    "How booking and payment work": ["Kā notiek rezervācija un apmaksa", "Как работают бронирование и оплата", "So funktionieren Buchung und Bezahlung", "Comment réserver et payer"],
    "Choose your dates": ["Izvēlieties datumus", "Выберите даты", "Wählen Sie Ihre Daten", "Choisissez vos dates"],
    "Check prices and availability on the booking site you trust, or contact us directly.": [
      "Pārbaudiet cenas un brīvos numurus savā uzticamajā rezervāciju vietnē vai sazinieties ar mums tieši.",
      "Проверьте цены и наличие мест на привычном сайте бронирования или свяжитесь с нами напрямую.",
      "Prüfen Sie Preise und Verfügbarkeit auf der Buchungsseite Ihres Vertrauens oder kontaktieren Sie uns direkt.", "Consultez les prix et les disponibilités sur votre site de réservation préféré, ou contactez-nous directement."],
    "Pay the way you like": ["Maksājiet, kā jums ērtāk", "Оплачивайте как удобно", "Bezahlen Sie, wie Sie möchten", "Payez à votre façon"],
    "You pay when you book or at the hotel, depending on the rate you choose.": [
      "Jūs maksājat rezervējot vai viesnīcā, atkarībā no izvēlētā tarifa.",
      "Вы платите при бронировании или в отеле, в зависимости от выбранного тарифа.",
      "Sie bezahlen bei der Buchung oder im Hotel, je nach gewähltem Tarif.", "Vous payez à la réservation ou à l'hôtel, selon le tarif choisi."],
    "Arrive and relax": ["Ierodieties un atpūtieties", "Приезжайте и отдыхайте", "Ankommen und entspannen", "Arrivez et détendez-vous"],
    "Check-in from {in}, check-out until {out}. We will have your room ready.": [
      "Reģistrācija no {in}, izrakstīšanās līdz {out}. Jūsu numurs būs gatavs.",
      "Заезд с {in}, выезд до {out}. Ваш номер будет готов.",
      "Check-in ab {in}, Check-out bis {out}. Ihr Zimmer wartet auf Sie.", "Arrivée dès {in}, départ jusqu'à {out}. Votre chambre sera prête."],
    "Good to know": ["Noderīgi zināt", "Полезно знать", "Gut zu wissen", "Bon à savoir"],
    "Questions guests ask": ["Viesu jautājumi", "Вопросы гостей", "Fragen unserer Gäste", "Les questions de nos clients"],
    "Didn't find your answer?": ["Neatradāt atbildi?", "Не нашли ответ?", "Keine Antwort gefunden?", "Vous ne trouvez pas votre réponse?"],
    "Ask us": ["Jautājiet mums", "Спросите нас", "Fragen Sie uns", "Écrivez-nous"],
    "Find us": ["Kā mūs atrast", "Как нас найти", "So finden Sie uns", "Nous trouver"],
    "Getting here": ["Kā nokļūt", "Как добраться", "Anreise", "Comment venir"],
    "Directions": ["Maršruts", "Маршрут", "Route", "Itinéraire"],

    /* ---------------------------------------------------------------- the question form */
    "Ask us a question": ["Uzdodiet mums jautājumu", "Задайте нам вопрос", "Stellen Sie uns eine Frage", "Posez-nous une question"],
    "We usually answer within a day, by email.": ["Parasti atbildam dienas laikā, pa e-pastu.", "Обычно мы отвечаем в течение дня по электронной почте.", "Wir antworten meist innerhalb eines Tages per E-Mail.", "Nous répondons habituellement en moins de 24 heures, par courriel."],
    "Your name": ["Jūsu vārds", "Ваше имя", "Ihr Name", "Votre nom"],
    "Your email": ["Jūsu e-pasts", "Ваш e-mail", "Ihre E-Mail", "Votre courriel"],
    "Your question": ["Jūsu jautājums", "Ваш вопрос", "Ihre Frage", "Votre question"],
    "Send question": ["Sūtīt jautājumu", "Отправить вопрос", "Frage senden", "Envoyer la question"],
    "Sending…": ["Sūta…", "Отправка…", "Wird gesendet…", "Envoi en cours…"],
    "Thank you! {hotel} will answer you by email soon.": ["Paldies! {hotel} drīz jums atbildēs pa e-pastu.", "Спасибо! {hotel} скоро ответит вам по электронной почте.", "Danke! {hotel} antwortet Ihnen bald per E-Mail.", "Merci! {hotel} vous répondra bientôt par courriel."],
    "Ask another question": ["Uzdot vēl vienu jautājumu", "Задать ещё вопрос", "Noch eine Frage stellen", "Poser une autre question"],
    "Your message goes only to {hotel}, who use your email to reply.": [
      "Jūsu ziņa nonāk tikai pie {hotel}, un jūsu e-pasts tiek izmantots tikai atbildei.",
      "Ваше сообщение получит только {hotel}; ваш e-mail нужен лишь для ответа.",
      "Ihre Nachricht geht nur an {hotel}; Ihre E-Mail wird nur für die Antwort verwendet.", "{hotel} est le seul destinataire de votre message; votre courriel ne sert qu'à vous répondre."],
    "Please check your email address.": ["Lūdzu, pārbaudiet e-pasta adresi.", "Пожалуйста, проверьте адрес e-mail.", "Bitte prüfen Sie Ihre E-Mail-Adresse.", "Veuillez vérifier votre adresse courriel."],
    "Please write a little more.": ["Lūdzu, uzrakstiet nedaudz vairāk.", "Пожалуйста, напишите чуть подробнее.", "Bitte schreiben Sie etwas mehr.", "Veuillez en dire un peu plus."],
    "Too many questions right now. Please try again later, or email us.": [
      "Pašlaik pārāk daudz jautājumu. Lūdzu, mēģiniet vēlāk vai rakstiet mums e-pastu.",
      "Сейчас слишком много вопросов. Попробуйте позже или напишите нам на e-mail.",
      "Gerade sind es zu viele Fragen. Bitte versuchen Sie es später oder schreiben Sie uns eine E-Mail.", "Trop de questions en ce moment. Veuillez réessayer plus tard ou nous écrire par courriel."],
    "Sorry, the question could not be sent. Please email us instead.": [
      "Atvainojiet, jautājumu neizdevās nosūtīt. Lūdzu, rakstiet mums e-pastu.",
      "Извините, вопрос не удалось отправить. Пожалуйста, напишите нам на e-mail.",
      "Leider konnte die Frage nicht gesendet werden. Bitte schreiben Sie uns eine E-Mail.", "Désolés, la question n'a pas pu être envoyée. Écrivez-nous plutôt par courriel."],
    "The form works on the published site.": ["Forma darbojas publicētajā lapā.", "Форма работает на опубликованном сайте.", "Das Formular funktioniert auf der veröffentlichten Seite.", "Le formulaire fonctionne sur le site publié."],

    /* ---------------------------------------------------------------- the reception QR card (ns-app.js NSApp.qrCard) */
    "Scan to plan your stay": ["Skenējiet un plānojiet braucienu", "Отсканируйте и спланируйте поездку", "Scannen und Aufenthalt planen", "Scannez pour préparer votre séjour"],
    "Your stay hour by hour, the neighbourhood map, and a place to ask us anything.": [
      "Jūsu brauciens pa stundām, apkārtnes karte un vieta, kur uzdot mums jebkuru jautājumu.",
      "Ваша поездка по часам, карта окрестностей и место, где можно задать нам любой вопрос.",
      "Ihr Aufenthalt Stunde für Stunde, die Karte der Umgebung und ein Ort für all Ihre Fragen.", "Votre séjour heure par heure, la carte du quartier et un espace pour toutes vos questions."],

    /* ---------------------------------------------------------------- the date request form (booking section, booking.request.on) */
    "Ask us for your dates": [
      "Jautājiet mums cenu saviem datumiem",
      "Узнайте у нас цену на ваши даты",
      "Fragen Sie uns direkt nach Ihren Daten",
      "Demandez-nous un prix pour vos dates"],
    "Tell us when you would like to come. We email you our best direct price, usually within a day.": [
      "Pastāstiet, kad vēlaties ierasties. Mēs atsūtīsim jums savu labāko tiešo cenu pa e-pastu, parasti dienas laikā.",
      "Напишите, когда хотите приехать. Мы пришлём вам нашу лучшую прямую цену по электронной почте, обычно в течение дня.",
      "Sagen Sie uns, wann Sie kommen möchten. Wir schicken Ihnen unseren besten Direktpreis per E-Mail, meist innerhalb eines Tages.",
      "Dites-nous quand vous aimeriez venir. Nous vous envoyons notre meilleur prix direct par courriel, en général dans la journée."],
    "Adults": ["Pieaugušie", "Взрослые", "Erwachsene", "Adultes"],
    "Children": ["Bērni", "Дети", "Kinder", "Enfants"],
    "Room": ["Numurs", "Номер", "Zimmer", "Chambre"],
    "Any room": ["Jebkurš numurs", "Любой номер", "Beliebiges Zimmer", "Peu importe la chambre"],
    "Phone (optional)": ["Tālrunis (nav obligāts)", "Телефон (необязательно)", "Telefon (optional)", "Téléphone (facultatif)"],
    "Anything we should know? (optional)": [
      "Kas mums būtu jāzina? (nav obligāti)",
      "Что нам стоит знать? (необязательно)",
      "Gibt es etwas, das wir wissen sollten? (optional)",
      "Quelque chose à nous dire? (facultatif)"],
    "Ask for a price": ["Pajautāt cenu", "Узнать цену", "Preis anfragen", "Demander un prix"],
    "Not a booking yet: you decide once you have our offer.": [
      "Tā vēl nav rezervācija: jūs izlemjat, kad esat saņēmis mūsu piedāvājumu.",
      "Это ещё не бронирование: вы решите, когда получите наше предложение.",
      "Noch keine Buchung: Sie entscheiden, wenn Sie unser Angebot haben.",
      "Ce n'est pas encore une réservation : vous décidez une fois notre offre reçue."],
    "Please check your dates.": ["Lūdzu, pārbaudiet datumus.", "Пожалуйста, проверьте даты.", "Bitte prüfen Sie Ihre Daten.", "Veuillez vérifier vos dates."],
    "Please tell us your name.": [
      "Lūdzu, norādiet savu vārdu.",
      "Пожалуйста, укажите ваше имя.",
      "Bitte nennen Sie uns Ihren Namen.",
      "Veuillez nous indiquer votre nom."],
    "Thank you!": ["Paldies!", "Спасибо!", "Danke!", "Merci!"],
    "{hotel} will email you a price for your dates soon.": [
      "{hotel} drīz atsūtīs jums cenu jūsu datumiem pa e-pastu.",
      "{hotel} скоро пришлёт вам цену на ваши даты по электронной почте.",
      "{hotel} schickt Ihnen bald einen Preis für Ihre Daten per E-Mail.",
      "{hotel} vous enverra bientôt un prix pour vos dates par courriel."],
    "Ask about other dates": ["Jautāt par citiem datumiem", "Спросить о других датах", "Nach anderen Daten fragen", "Demander d'autres dates"],
    "Ask us directly": ["Jautājiet tieši mums", "Спросите нас напрямую", "Direkt bei uns anfragen", "Demandez-nous directement"],
    "Sorry, the request could not be sent. Please email us instead.": [
      "Diemžēl pieprasījumu neizdevās nosūtīt. Lūdzu, rakstiet mums e-pastu.",
      "К сожалению, запрос не удалось отправить. Пожалуйста, напишите нам по электронной почте.",
      "Leider konnte die Anfrage nicht gesendet werden. Bitte schreiben Sie uns eine E-Mail.",
      "Désolés, la demande n'a pas pu être envoyée. Écrivez-nous plutôt par courriel."],
    "Too many requests right now. Please try again later, or email us.": [
      "Šobrīd ir pārāk daudz pieprasījumu. Lūdzu, mēģiniet vēlāk vai rakstiet mums e-pastu.",
      "Сейчас слишком много запросов. Попробуйте позже или напишите нам по электронной почте.",
      "Gerade gibt es zu viele Anfragen. Bitte versuchen Sie es später oder schreiben Sie uns eine E-Mail.",
      "Trop de demandes en ce moment. Réessayez plus tard ou écrivez-nous par courriel."],
    "This form is closed right now. Please email us instead.": [
      "Šī forma pašlaik ir slēgta. Lūdzu, rakstiet mums e-pastu.",
      "Эта форма сейчас закрыта. Пожалуйста, напишите нам по электронной почте.",
      "Dieses Formular ist gerade geschlossen. Bitte schreiben Sie uns eine E-Mail.",
      "Ce formulaire est fermé pour l'instant. Écrivez-nous plutôt par courriel."],
    "Come-back code: {code}": ["Atgriešanās kods: {code}", "Код возвращения: {code}", "Rückkehr-Code: {code}", "Code de retour : {code}"],

    /* ---------------------------------------------------------------- the thank-you sheet (#thanks, from the check-out QR card) */
    "Thank you for staying with us": [
      "Paldies, ka palikāt pie mums",
      "Спасибо, что остановились у нас",
      "Danke, dass Sie bei uns waren",
      "Merci d'avoir séjourné chez nous"],
    "Tell others about your stay": [
      "Pastāstiet citiem par savu viesošanos",
      "Расскажите другим о своём пребывании",
      "Erzählen Sie anderen von Ihrem Aufenthalt",
      "Racontez votre séjour aux autres voyageurs"],
    "A few words on any of these sites helps a small hotel more than you think.": [
      "Daži vārdi kādā no šīm vietnēm mazai viesnīcai palīdz vairāk, nekā domājat.",
      "Пара слов на любом из этих сайтов помогает маленькому отелю больше, чем кажется.",
      "Ein paar Worte auf einer dieser Seiten helfen einem kleinen Hotel mehr, als Sie denken.",
      "Quelques mots sur l'un de ces sites aident un petit hôtel plus que vous ne le pensez."],
    "Tell us privately": ["Pastāstiet mums privāti", "Напишите нам лично", "Sagen Sie es uns persönlich", "Dites-le-nous en privé"],
    "Something we could do better, or a thank-you just for us? Only {hotel} reads it.": [
      "Kaut kas, ko varam darīt labāk, vai paldies tikai mums? To lasīs tikai {hotel}.",
      "Что-то, что мы могли бы сделать лучше, или благодарность только для нас? Это прочитает только {hotel}.",
      "Etwas, das wir besser machen könnten, oder ein Dank nur für uns? Das liest nur {hotel}.",
      "Une chose à améliorer, ou un merci rien que pour nous? Votre message ira seulement à {hotel}."],
    "Write to us": ["Rakstiet mums", "Написать нам", "Schreiben Sie uns", "Écrivez-nous"],
    "Come back direct": ["Atgriezieties, rezervējot tieši", "Возвращайтесь, бронируя напрямую", "Kommen Sie direkt wieder", "Revenez en réservant en direct"],
    "Your code": ["Jūsu kods", "Ваш код", "Ihr Code", "Votre code"],
    "Copy": ["Kopēt", "Копировать", "Kopieren", "Copier"],
    "Copied": ["Nokopēts", "Скопировано", "Kopiert", "Copié"],
    "Ask for your dates": ["Jautāt par saviem datumiem", "Спросить о своих датах", "Nach Ihren Daten fragen", "Demander vos dates"],

    /* ---------------------------------------------------------------- the owner's offer email (Items/QuestionRow: written in the guest's language with NSSite.tIn) */
    "Hello {name},": ["Labdien, {name}!", "Здравствуйте, {name}!", "Hallo {name},", "Bonjour {name},"],
    "Thank you for asking us directly. For your dates we can offer:": [
      "Paldies, ka jautājāt tieši mums. Jūsu datumiem varam piedāvāt:",
      "Спасибо, что обратились к нам напрямую. На ваши даты мы можем предложить:",
      "Danke, dass Sie direkt bei uns anfragen. Für Ihre Daten können wir Ihnen anbieten:",
      "Merci de nous avoir écrit directement. Pour vos dates, nous pouvons vous proposer :"],
    "__ {cur} a night, __ {cur} in total.": [
      "__ {cur} par nakti, kopā __ {cur}.",
      "__ {cur} за ночь, всего __ {cur}.",
      "__ {cur} pro Nacht, insgesamt __ {cur}.",
      "__ {cur} la nuit, __ {cur} au total."],
    "Reply to this email to confirm, and we will hold the room for you for 48 hours.": [
      "Atbildiet uz šo e-pastu, lai apstiprinātu, un mēs turēsim numuru jums 48 stundas.",
      "Ответьте на это письмо, чтобы подтвердить, и мы придержим для вас номер на 48 часов.",
      "Antworten Sie auf diese E-Mail, um zu bestätigen, und wir halten das Zimmer 48 Stunden für Sie frei.",
      "Répondez à ce courriel pour confirmer, et nous vous gardons la chambre pendant 48 heures."],
    "Best wishes,": ["Ar cieņu,", "С наилучшими пожеланиями,", "Viele Grüße", "Au plaisir de vous accueillir,"],

    /* ---------------------------------------------------------------- widgets */
    "This 360° photo could not be loaded.": ["Šo 360° foto neizdevās ielādēt.", "Не удалось загрузить фото 360°.", "Dieses 360°-Foto konnte nicht geladen werden.", "Impossible de charger cette photo 360°."],
    "Open in Google Maps": ["Atvērt Google Maps", "Открыть в Google Картах", "In Google Maps öffnen", "Ouvrir dans Google Maps"],
    "Map of places around the hotel": ["Vietu karte ap viesnīcu", "Карта мест вокруг отеля", "Karte der Orte rund um das Hotel", "Carte des lieux autour de l'hôtel"],
    "Illustrated map: directions are true, distances are walking minutes.": [
      "Zīmēta karte: virzieni ir precīzi, attālumi ir minūtes kājām.",
      "Рисованная карта: направления точные, расстояния в минутах пешком.",
      "Gezeichnete Karte: Richtungen stimmen, Entfernungen sind Gehminuten.", "Carte illustrée : les directions sont exactes, les distances sont en minutes de marche."],
    "Hotel video": ["Viesnīcas video", "Видео отеля", "Hotelvideo", "Vidéo de l'hôtel"],
    "Room video": ["Numura video", "Видео номера", "Zimmervideo", "Vidéo de la chambre"],

    /* ---------------------------------------------------------------- walking, seasons, numbers */
    "1 min walk": ["1 min kājām", "1 мин пешком", "1 Min. zu Fuß", "1 min à pied"],
    "{n} min walk": ["{n} min kājām", "{n} мин пешком", "{n} Min. zu Fuß", "{n} min à pied"],
    "{n} min by tram or taxi": ["{n} min ar tramvaju vai taksi", "{n} мин на трамвае или такси", "{n} Min. mit Tram oder Taxi", "{n} min en tram ou en taxi"],
    "Winter": ["Ziema", "Зима", "Winter", "Hiver"],
    "Spring": ["Pavasaris", "Весна", "Frühling", "Printemps"],
    "Summer": ["Vasara", "Лето", "Sommer", "Été"],
    "Autumn": ["Rudens", "Осень", "Herbst", "Automne"],
    "on foot to {place}": ["kājām līdz {place}", "пешком до «{place}»", "zu Fuß zu {place}", "à pied : {place}"],
    "{things} within 10 minutes": ["{things} 10 minūšu attālumā", "{things} в 10 минутах", "{things} in 10 Minuten", "{things} à moins de 10 minutes"],
    "to {place}": ["līdz {place}", "до «{place}»", "zu {place}", "direction {place}"],
    "places within 15 minutes on foot": ["vietas 15 minūšu gājienā", "мест в 15 минутах пешком", "Orte in 15 Minuten zu Fuß", "lieux à moins de 15 minutes à pied"],

    /* ---------------------------------------------------------------- place kinds: label, plural */
    "Sight": ["Apskates vieta", "Достопримечательность", "Sehenswürdigkeit", "À voir"],
    "sights": ["apskates vietas", "достопримечательности", "Sehenswürdigkeiten", "lieux à voir"],
    "Museum": ["Muzejs", "Музей", "Museum", "Musée"],
    "museums": ["muzeji", "музеи", "Museen", "musées"],
    "galleries": ["galerijas", "галереи", "Galerien", "galeries d'art"],
    "Church": ["Baznīca", "Церковь", "Kirche", "Église"],
    "churches": ["baznīcas", "церкви", "Kirchen", "églises"],
    "Stage & screen": ["Skatuve un kino", "Сцена и кино", "Bühne & Kino", "Spectacles & cinéma"],
    "theatres & concert halls": ["teātri un koncertzāles", "театры и концертные залы", "Theater & Konzertsäle", "théâtres & salles de concert"],
    "Café": ["Kafejnīca", "Кафе", "Café", "Café"],
    "cafés": ["kafejnīcas", "кафе", "Cafés", "cafés"],
    "Restaurant": ["Restorāns", "Ресторан", "Restaurant", "Restaurant"],
    "restaurants": ["restorāni", "рестораны", "Restaurants", "restaurants"],
    "Bar": ["Bārs", "Бар", "Bar", "Bar"],
    "bars & pubs": ["bāri un krodziņi", "бары и пабы", "Bars & Kneipen", "bars & pubs"],
    "Nightlife": ["Naktsdzīve", "Ночная жизнь", "Nachtleben", "Vie nocturne"],
    "clubs & late venues": ["klubi un vēlās vietas", "клубы и ночные заведения", "Clubs & Nachtlokale", "clubs & adresses de nuit"],
    "Park": ["Parks", "Парк", "Park", "Parc"],
    "parks & gardens": ["parki un dārzi", "парки и сады", "Parks & Gärten", "parcs & jardins"],
    "Shop": ["Veikals", "Магазин", "Geschäft", "Boutique"],
    "shops & boutiques": ["veikali un butiki", "магазины и бутики", "Geschäfte & Boutiquen", "magasins & boutiques"],
    "Market & food shop": ["Tirgus un pārtika", "Рынок и продукты", "Markt & Feinkost", "Marché & épicerie"],
    "markets & food shops": ["tirgi un pārtikas veikali", "рынки и продуктовые лавки", "Märkte & Feinkostläden", "marchés & épiceries"],
    "Wellness": ["Labsajūta", "Велнес", "Wellness", "Bien-être"],
    "spas & wellness": ["spa un labsajūta", "спа и велнес", "Spas & Wellness", "spas & bien-être"],
    "Sport": ["Sports", "Спорт", "Sport", "Sport"],
    "gyms & sport": ["sporta zāles un sports", "спортзалы и спорт", "Fitness & Sport", "lieux sportifs"],
    "For kids": ["Bērniem", "Для детей", "Für Kinder", "Pour les enfants"],
    "places for kids": ["vietas bērniem", "места для детей", "Orte für Kinder", "lieux pour enfants"],
    "Coworking": ["Kopstrādes telpa", "Коворкинг", "Coworking", "Coworking"],
    "coworking spaces": ["kopstrādes telpas", "коворкинги", "Coworking-Spaces", "espaces de coworking"],
    "Transport": ["Transports", "Транспорт", "Verkehr", "Transports"],
    "stations & stops": ["stacijas un pieturas", "вокзалы и остановки", "Bahnhöfe & Haltestellen", "gares & arrêts"],
    "Essentials": ["Ikdienas lietas", "Самое нужное", "Das Nötigste", "Essentiels"],
    "pharmacies & ATMs": ["aptiekas un bankomāti", "аптеки и банкоматы", "Apotheken & Geldautomaten", "pharmacies & guichets automatiques"],

    /* place verbs ({n} = the place's name, never declined) */
    "See {n}": ["Apskatiet: {n}", "Посмотрите «{n}»", "Sehen Sie {n}", "Admirer {n}"],
    "Stand in front of {n}": ["Pastāviet pie: {n}", "Постойте у «{n}»", "Stehen Sie vor {n}", "Halte devant {n}"],
    "Wander over to {n}": ["Aizklīstiet līdz: {n}", "Прогуляйтесь до «{n}»", "Schlendern Sie zu {n}", "Flâner vers {n}"],
    "Explore {n}": ["Izpētiet: {n}", "Исследуйте «{n}»", "Entdecken Sie {n}", "Explorer {n}"],
    "An hour or two at {n}": ["Stunda vai divas: {n}", "Час-другой в «{n}»", "Ein, zwei Stunden in {n}", "Une heure ou deux à {n}"],
    "Step into {n}": ["Ieejiet: {n}", "Загляните в «{n}»", "Treten Sie ein: {n}", "Un détour par {n}"],
    "Browse {n}": ["Paraugieties: {n}", "Загляните в «{n}»", "Stöbern Sie in {n}", "Fureter dans {n}"],
    "Look in at {n}": ["Ieskatieties: {n}", "Зайдите в «{n}»", "Schauen Sie vorbei: {n}", "Passer voir {n}"],
    "Visit {n}": ["Apmeklējiet: {n}", "Посетите «{n}»", "Besuchen Sie {n}", "Visiter {n}"],
    "Quiet moment at {n}": ["Kluss brīdis: {n}", "Тихая минута в «{n}»", "Ein stiller Moment: {n}", "Un moment de calme dans {n}"],
    "Climb or look up at {n}": ["Uzkāpiet vai paskatieties augšup: {n}", "Поднимитесь или полюбуйтесь: «{n}»", "Hinaufsteigen oder hinaufschauen: {n}", "Gravir ou admirer {n}"],
    "A performance at {n}": ["Izrāde: {n}", "Спектакль в «{n}»", "Eine Vorstellung: {n}", "Un spectacle à {n}"],
    "Tickets for {n}": ["Biļetes: {n}", "Билеты в «{n}»", "Karten für {n}", "Des billets pour {n}"],
    "Coffee at {n}": ["Kafija: {n}", "Кофе в «{n}»", "Kaffee bei {n}", "Un café chez {n}"],
    "Slow coffee at {n}": ["Nesteidzīga kafija: {n}", "Неспешный кофе в «{n}»", "Kaffee in Ruhe bei {n}", "Café tranquille chez {n}"],
    "Cake and coffee at {n}": ["Kūka un kafija: {n}", "Кофе с пирожным в «{n}»", "Kaffee und Kuchen bei {n}", "Café et gâteau chez {n}"],
    "Eat at {n}": ["Paēdiet: {n}", "Поешьте в «{n}»", "Essen bei {n}", "À table chez {n}"],
    "A table at {n}": ["Galdiņš: {n}", "Столик в «{n}»", "Ein Tisch bei {n}", "Une table chez {n}"],
    "Dinner at {n}": ["Vakariņas: {n}", "Ужин в «{n}»", "Abendessen bei {n}", "Repas du soir chez {n}"],
    "Drinks at {n}": ["Dzērieni: {n}", "Напитки в «{n}»", "Drinks bei {n}", "Un verre chez {n}"],
    "A glass at {n}": ["Glāze: {n}", "Бокал в «{n}»", "Ein Glas bei {n}", "Trinquer chez {n}"],
    "Nightcap at {n}": ["Pēdējā glāze: {n}", "Последний бокал в «{n}»", "Absacker bei {n}", "Dernier verre chez {n}"],
    "Dance at {n}": ["Dejas: {n}", "Танцы в «{n}»", "Tanzen bei {n}", "Danser chez {n}"],
    "Late night at {n}": ["Vēls vakars: {n}", "Поздний вечер в «{n}»", "Späte Stunden bei {n}", "Fin de soirée chez {n}"],
    "Stroll through {n}": ["Pastaiga: {n}", "Прогулка по «{n}»", "Spaziergang durch {n}", "Balade dans {n}"],
    "Fresh air in {n}": ["Svaigs gaiss: {n}", "Свежий воздух в «{n}»", "Frische Luft: {n}", "Prendre l'air dans {n}"],
    "A bench in {n}": ["Soliņš: {n}", "Скамейка в «{n}»", "Eine Bank in {n}", "Un banc dans {n}"],
    "Shopping at {n}": ["Iepirkšanās: {n}", "Покупки в «{n}»", "Einkaufen bei {n}", "Emplettes chez {n}"],
    "Pick up treats at {n}": ["Gardumi līdzi: {n}", "Вкусности в «{n}»", "Leckereien holen bei {n}", "Des gourmandises chez {n}"],
    "Wander {n}": ["Izstaigājiet: {n}", "Побродите по «{n}»", "Bummeln Sie über {n}", "Arpenter {n}"],
    "Unwind at {n}": ["Atpūta: {n}", "Расслабьтесь в «{n}»", "Entspannen bei {n}", "Détente chez {n}"],
    "Treat yourself at {n}": ["Palutiniet sevi: {n}", "Побалуйте себя в «{n}»", "Gönnen Sie sich etwas: {n}", "Se faire dorloter chez {n}"],
    "Work out at {n}": ["Treniņš: {n}", "Тренировка в «{n}»", "Training bei {n}", "Entraînement chez {n}"],
    "Swim or train at {n}": ["Peldēšana vai treniņš: {n}", "Плавание или тренировка в «{n}»", "Schwimmen oder trainieren: {n}", "Nager ou s'entraîner à {n}"],
    "Let the kids loose at {n}": ["Ļaujiet bērniem izskrieties: {n}", "Дайте детям порезвиться в «{n}»", "Kinder toben lassen: {n}", "Les enfants se défoulent à {n}"],
    "Family time at {n}": ["Ģimenes laiks: {n}", "Время всей семьёй в «{n}»", "Familienzeit: {n}", "En famille à {n}"],
    "Work a few hours at {n}": ["Dažas darba stundas: {n}", "Пара рабочих часов в «{n}»", "Ein paar Stunden arbeiten: {n}", "Travailler un peu chez {n}"],
    "Head to {n}": ["Dodieties uz: {n}", "Направляйтесь к «{n}»", "Weiter zu {n}", "Direction {n}"],
    "Pop into {n}": ["Ieskrieniet: {n}", "Загляните в «{n}»", "Kurz rein: {n}", "Un saut chez {n}"],

    /* ---------------------------------------------------------------- describing a place */
    "A café": ["Kafejnīca", "Кафе", "Ein Café", "Un café"],
    "A restaurant": ["Restorāns", "Ресторан", "Ein Restaurant", "Un restaurant"],
    "A bar": ["Bārs", "Бар", "Eine Bar", "Un bar"],
    "A late-night venue": ["Vieta vēlām stundām", "Ночное заведение", "Ein Ort für die späten Stunden", "Un lieu ouvert tard le soir"],
    "A museum": ["Muzejs", "Музей", "Ein Museum", "Un musée"],
    "A gallery": ["Galerija", "Галерея", "Eine Galerie", "Une galerie d'art"],
    "A local landmark": ["Vietējā apskates vieta", "Местная достопримечательность", "Ein Wahrzeichen der Gegend", "Un incontournable du quartier"],
    "A historic church": ["Vēsturiska baznīca", "Историческая церковь", "Eine historische Kirche", "Une église historique"],
    "A green space": ["Zaļā zona", "Зелёный уголок", "Eine grüne Oase", "Un espace vert"],
    "A shop": ["Veikals", "Магазин", "Ein Geschäft", "Une boutique"],
    "A food shop": ["Pārtikas veikals", "Продуктовая лавка", "Ein Lebensmittelladen", "Une épicerie"],
    "A place to unwind": ["Vieta atpūtai", "Место, чтобы расслабиться", "Ein Ort zum Entspannen", "Un lieu pour se détendre"],
    "A place to train": ["Vieta treniņiem", "Место для тренировок", "Ein Ort zum Trainieren", "Un lieu pour s'entraîner"],
    "Fun for children": ["Prieks bērniem", "Радость для детей", "Spaß für Kinder", "Pour le plaisir des enfants"],
    "A coworking space": ["Kopstrādes telpa", "Коворкинг", "Ein Coworking-Space", "Un espace de coworking"],
    "Transport link": ["Transporta mezgls", "Транспорт", "Verkehrsanbindung", "Accès aux transports"],
    "Everyday essentials": ["Ikdienas vajadzībām", "Всё необходимое", "Alles für den Alltag", "L'essentiel du quotidien"],
    "A stage for music and theatre": ["Skatuve mūzikai un teātrim", "Сцена для музыки и театра", "Eine Bühne für Musik und Theater", "Une scène pour la musique et le théâtre"],
    "Our tip: {note}": ["Mūsu padoms: {note}", "Наш совет: {note}", "Unser Tipp: {note}", "Notre conseil : {note}"],
    "Plant-based dishes too.": ["Ir arī augu ēdieni.", "Есть и растительные блюда.", "Auch pflanzliche Gerichte.", "Options végétales aussi."],

    /* ---------------------------------------------------------------- the stay plan */
    "the hotel": ["viesnīca", "отель", "das Hotel", "l'hôtel"],
    "Wrap up warm: the old town glows in the snow.": ["Saģērbieties silti: vecpilsēta mirdz sniegā.", "Одевайтесь теплее: старый город сияет в снегу.", "Ziehen Sie sich warm an: Die Altstadt leuchtet im Schnee.", "Couvrez-vous bien : la vieille ville scintille sous la neige."],
    "Evenings stay light until late, so take your time.": ["Vakari ilgi paliek gaiši, tāpēc nesteidzieties.", "Вечера светлые до поздна, так что не спешите.", "Die Abende bleiben lange hell, lassen Sie sich Zeit.", "Le soleil se couche tard, alors prenez votre temps."],
    "Café terraces start opening in spring.": ["Pavasarī atveras kafejnīcu terases.", "Весной открываются летние террасы кафе.", "Im Frühling öffnen die Café-Terrassen.", "Les terrasses des cafés ouvrent au printemps."],
    "Golden trees and fewer crowds.": ["Zelta koki un mazāk ļaužu.", "Золотые деревья и меньше туристов.", "Goldene Bäume und weniger Trubel.", "Arbres dorés et moins de foule."],
    "Breakfast at {hotel}": ["Brokastis: {hotel}", "Завтрак в «{hotel}»", "Frühstück im {hotel}", "Petit-déjeuner à {hotel}"],
    "Breakfast is included and served downstairs.": ["Brokastis ir iekļautas un tiek pasniegtas lejā.", "Завтрак включён и подаётся внизу.", "Das Frühstück ist inbegriffen und wird unten serviert.", "Le petit-déjeuner est inclus et servi en bas."],
    "A good start to the day.": ["Labs dienas sākums.", "Хорошее начало дня.", "Ein guter Start in den Tag.", "Pour bien commencer la journée."],
    "Breakfast nearby": ["Brokastis tuvumā", "Завтрак рядом", "Frühstück in der Nähe", "Petit-déjeuner tout près"],
    "Ask at the desk for our favourite breakfast spot.": ["Pajautājiet reģistratūrā par mūsu iecienītāko brokastu vietu.", "Спросите на ресепшене о нашем любимом месте для завтрака.", "Fragen Sie an der Rezeption nach unserem Lieblingsort fürs Frühstück.", "Demandez à la réception notre adresse préférée."],
    "Wander the neighbourhood": ["Izstaigājiet apkārtni", "Прогуляйтесь по округе", "Streifzug durchs Viertel", "Flâner dans le quartier"],
    "Pick a street you have not walked yet. Everything here is close.": ["Izvēlieties ielu, pa kuru vēl neesat gājuši. Šeit viss ir tuvu.", "Выберите улицу, по которой ещё не гуляли. Здесь всё рядом.", "Nehmen Sie eine Straße, die Sie noch nicht kennen. Hier ist alles nah.", "Choisissez une rue encore inconnue. Ici, tout est à deux pas."],
    "Ask us for a table nearby. We know the good ones.": ["Pajautājiet mums par galdiņu tuvumā. Mēs zinām labās vietas.", "Спросите нас о столике поблизости. Мы знаем хорошие места.", "Fragen Sie uns nach einem Tisch in der Nähe. Wir kennen die guten Adressen.", "Demandez-nous une table tout près. Nous connaissons les bonnes adresses."],
    "Lunch": ["Pusdienas", "Обед", "Mittagessen", "Repas du midi"],
    "Dinner": ["Vakariņas", "Ужин", "Abendessen", "Repas du soir"],
    "Pick up lunch at {place}": ["Pusdienas līdzi: {place}", "Обед с собой в «{place}»", "Mittagessen holen bei {place}", "Le midi, à emporter chez {place}"],
    "Lunch at {place}": ["Pusdienas: {place}", "Обед в «{place}»", "Mittagessen bei {place}", "Repas du midi chez {place}"],
    "Dinner at {place}": ["Vakariņas: {place}", "Ужин в «{place}»", "Abendessen bei {place}", "Repas du soir chez {place}"],
    "Late night at {place}": ["Vēls vakars: {place}", "Поздний вечер в «{place}»", "Späte Stunden bei {place}", "Fin de soirée chez {place}"],
    "Nightcap at {place}": ["Pēdējā glāze: {place}", "Последний бокал в «{place}»", "Absacker bei {place}", "Dernier verre chez {place}"],
    "Drinks at {place}": ["Dzērieni: {place}", "Напитки в «{place}»", "Drinks bei {place}", "Un verre chez {place}"],
    "Back by the fireplace": ["Atpakaļ pie kamīna", "Обратно к камину", "Zurück am Kamin", "Retour au coin du feu"],
    "End the day with a book by the lobby fire.": ["Noslēdziet dienu ar grāmatu pie kamīna vestibilā.", "Завершите день с книгой у камина в лобби.", "Beenden Sie den Tag mit einem Buch am Kamin in der Lobby.", "Finissez la journée un livre à la main, près du feu dans le hall."],
    "Beautiful after dark, too.": ["Skaisti arī pēc tumsas iestāšanās.", "Красиво и после заката.", "Auch nach Einbruch der Dunkelheit schön.", "Superbe aussi à la nuit tombée."],
    "An early night": ["Agri gulēt", "Ранний отбой", "Früh schlafen", "Au lit de bonne heure"],
    "Sleep well: tomorrow there is more to see.": ["Guliet saldi: rīt būs vēl ko redzēt.", "Спокойной ночи: завтра будет ещё что посмотреть.", "Schlafen Sie gut: Morgen gibt es noch mehr zu sehen.", "Dormez bien : demain, il y a encore tant à voir."],
    "Check in at {hotel}": ["Reģistrācija: {hotel}", "Заселение в «{hotel}»", "Check-in im {hotel}", "Installation à {hotel}"],
    "Drop your bags, freshen up and pick up a map at the desk.": ["Atstājiet somas, atsvaidzinieties un paņemiet karti reģistratūrā.", "Оставьте сумки, освежитесь и возьмите карту на ресепшене.", "Taschen abstellen, frisch machen und an der Rezeption eine Karte mitnehmen.", "Posez vos valises, rafraîchissez-vous et prenez une carte à la réception."],
    "First walk: {what}": ["Pirmā pastaiga: {what}", "Первая прогулка: {what}", "Erster Spaziergang: {what}", "Première sortie : {what}"],
    "To start the trip.": ["Brauciena sākumam.", "Для начала поездки.", "Zum Auftakt der Reise.", "Pour bien lancer le séjour."],
    "An aperitif at {place}": ["Aperitīvs: {place}", "Аперитив в «{place}»", "Ein Aperitif bei {place}", "Un apéritif chez {place}"],
    "Dinner downstairs at {place}": ["Vakariņas lejā: {place}", "Ужин внизу, в «{place}»", "Abendessen unten im {place}", "À table en bas, chez {place}"],
    "No need to go far on your first night.": ["Pirmajā vakarā nav jāiet tālu.", "В первый вечер не нужно далеко идти.", "Am ersten Abend müssen Sie nicht weit gehen.", "Inutile d'aller loin le premier soir."],
    "Arrival": ["Ierašanās", "Приезд", "Anreise", "Arrivée"],
    "Before breakfast, while the streets are quiet.": ["Pirms brokastīm, kamēr ielas ir klusas.", "До завтрака, пока улицы тихие.", "Vor dem Frühstück, solange die Straßen ruhig sind.", "Avant le petit-déjeuner, quand les rues sont calmes."],
    "Fast Wi-Fi and good coffee.": ["Ātrs Wi-Fi un laba kafija.", "Быстрый Wi-Fi и хороший кофе.", "Schnelles WLAN und guter Kaffee.", "Wi-Fi rapide et bon café."],
    "Warm up for a while.": ["Mazliet sasildieties.", "Немного согрейтесь.", "Wärmen Sie sich ein wenig auf.", "Le temps de vous réchauffer."],
    "Check what is on tonight: most performances start around 19:00.": ["Paskatieties, kas šovakar notiek: lielākā daļa izrāžu sākas ap 19:00.", "Посмотрите, что идёт сегодня: большинство спектаклей начинается около 19:00.", "Schauen Sie, was heute läuft: Die meisten Vorstellungen beginnen gegen 19:00.", "Consultez le programme du soir : la plupart des spectacles commencent vers 19 h."],
    "An evening performance at {place}": ["Vakara izrāde: {place}", "Вечерний спектакль в «{place}»", "Eine Abendvorstellung: {place}", "Soirée spectacle : {place}"],
    "A late supper after the show.": ["Vēlas vakariņas pēc izrādes.", "Поздний ужин после спектакля.", "Ein spätes Essen nach der Vorstellung.", "Un repas tardif après le spectacle."],
    "Late supper at {place}": ["Vēlas vakariņas: {place}", "Поздний ужин в «{place}»", "Spätes Essen bei {place}", "Repas tardif chez {place}"],
    "Departure": ["Aizbraukšana", "Отъезд", "Abreise", "Départ"],
    "One last look before you go.": ["Pēdējais skats pirms aizbraukšanas.", "Последний взгляд перед отъездом.", "Ein letzter Blick vor der Abreise.", "Un dernier coup d'œil avant de partir."],
    "Check out": ["Izrakstīšanās", "Выезд", "Check-out", "Remise des clés"],
    "Leave your bags with us and enjoy the rest of the day.": ["Atstājiet somas pie mums un baudiet atlikušo dienu.", "Оставьте сумки у нас и наслаждайтесь остатком дня.", "Lassen Sie Ihr Gepäck bei uns und genießen Sie den Rest des Tages.", "Laissez-nous vos bagages et profitez du reste de la journée."],
    "Thank you for staying with us.": ["Paldies, ka bijāt pie mums.", "Спасибо, что остановились у нас.", "Danke, dass Sie bei uns waren.", "Merci d'avoir séjourné chez nous."],
    "To the airport": ["Uz lidostu", "В аэропорт", "Zum Flughafen", "Direction l'aéroport"],
    "{hotel} is {walk} from {place}": ["No {hotel} līdz {place} ir {walk}", "От «{hotel}» до «{place}» — {walk}", "Vom {hotel} sind es {walk} bis {place}", "Depuis {hotel}, {place} est à {walk}"],
    ", with {list} within ten minutes on foot.": [", un desmit minūšu gājienā: {list}.", ", а в десяти минутах пешком: {list}.", ", und in zehn Minuten zu Fuß: {list}.", ", et vous trouverez {list} à moins de dix minutes de marche."],
    "{n} {things}": ["{things}: {n}", "{things} — {n}", "{n} {things}", "{n} {things}"],
    " and ": [" un ", " и ", " und ", " et "],

    /* ---------------------------------------------------------------- drafted texts (shown while the owner's are empty) */
    "Welcome to {hotel}": ["Laipni lūdzam {hotel}", "Добро пожаловать в «{hotel}»", "Willkommen im {hotel}", "Bienvenue à {hotel}"],
    ", in the heart of {area}": [", pašā {area} sirdī", ", в самом сердце района {area}", ", mitten in {area}", ", au cœur du quartier {area}"],
    "our hotel": ["mūsu viesnīcā", "наш отель", "unserem Hotel", "notre hôtel"],
    "From our door it is {list}. ": ["No mūsu durvīm: {list}. ", "От наших дверей: {list}. ", "Von unserer Tür sind es {list}. ", "Depuis notre porte : {list}. "],
    "{walk} to {place}": ["{walk} līdz {place}", "{walk} до «{place}»", "{walk} bis {place}", "{place} à {walk}"],
    "We are a small, personal hotel: we know our guests by name, and we love sharing the places we go ourselves.": [
      "Mēs esam neliela, personiska viesnīca: mēs zinām savus viesus pēc vārda un labprāt dalāmies ar vietām, kur ejam paši.",
      "Мы небольшой, уютный отель: знаем гостей по имени и с радостью делимся местами, куда ходим сами.",
      "Wir sind ein kleines, persönliches Hotel: Wir kennen unsere Gäste beim Namen und teilen gern die Orte, an die wir selbst gehen.", "Nous sommes un petit hôtel chaleureux : nous connaissons nos clients par leur nom et aimons partager les adresses que nous fréquentons nous-mêmes."],
    "the city": ["pilsēta", "город", "die Stadt", "la ville"],
    "Step outside and {area} is yours: {n} places within a fifteen-minute walk, including {cafes} cafés and {rest} restaurants within ten minutes": [
      "Izejiet ārā, un {area} ir jūsu: {n} vietas piecpadsmit minūšu gājienā, tostarp desmit minūšu attālumā kafejnīcas ({cafes}) un restorāni ({rest})",
      "Выйдите за дверь, и {area} ваш: мест в пятнадцати минутах пешком — {n}, из них в десяти минутах кафе ({cafes}) и рестораны ({rest})",
      "Treten Sie hinaus, und {area} gehört Ihnen: {n} Orte in fünfzehn Gehminuten, darunter {cafes} Cafés und {rest} Restaurants in zehn Minuten", "Passez la porte, et {area} est à vous : {n} lieux à moins de quinze minutes à pied, dont {cafes} cafés et {rest} restaurants à moins de dix minutes"],
    ", and {mus} museums": [", kā arī muzeji ({mus})", ", а также музеи ({mus})", " sowie {mus} Museen", ", ainsi que {mus} musées"],
    ". Leave the car; you will not need it.": [". Atstājiet auto; tas jums nebūs vajadzīgs.", ". Оставьте машину: она вам не понадобится.", ". Lassen Sie das Auto stehen; Sie brauchen es nicht.", ". Laissez la voiture : vous n'en aurez pas besoin."],
    "{n} minutes {label}": ["{n} minūtes {label}", "{n} мин {label}", "{n} Minuten {label}", "{n} minutes {label}"],
    "Right in the middle of everything, on a quiet street.": ["Pašā centrā, klusā ielā.", "В самом центре, на тихой улице.", "Mitten im Geschehen, in einer ruhigen Straße.", "Au cœur de l'action, dans une rue tranquille."],
    "What time is check-in and check-out?": ["Cikos ir reģistrācija un izrakstīšanās?", "Во сколько заезд и выезд?", "Wann sind Check-in und Check-out?", "Quels sont les horaires d'arrivée et de départ?"],
    "Check-in is from {in} and check-out is until {out}.": ["Reģistrācija no {in}, izrakstīšanās līdz {out}.", "Заезд с {in}, выезд до {out}.", "Check-in ab {in}, Check-out bis {out}.", "L'arrivée se fait dès {in} et le départ jusqu'à {out}."],
    "Is breakfast included?": ["Vai brokastis ir iekļautas?", "Завтрак включён?", "Ist das Frühstück inbegriffen?", "Le petit-déjeuner est-il inclus?"],
    "Yes, breakfast is included.": ["Jā, brokastis ir iekļautas.", "Да, завтрак включён.", "Ja, das Frühstück ist inbegriffen.", "Oui, le petit-déjeuner est inclus."],
    "When do I pay?": ["Kad man jāmaksā?", "Когда нужно платить?", "Wann bezahle ich?", "Quand dois-je payer?"],
    "Is there parking?": ["Vai ir stāvvieta?", "Есть ли парковка?", "Gibt es Parkplätze?", "Y a-t-il du stationnement?"],
    "How do I get here from the airport?": ["Kā nokļūt šeit no lidostas?", "Как добраться из аэропорта?", "Wie komme ich vom Flughafen hierher?", "Comment venir depuis l'aéroport?"],

    /* ---------------------------------------------------------------- amenities, channels, payments, kinds */
    "Breakfast included": ["Brokastis iekļautas", "Завтрак включён", "Frühstück inbegriffen", "Petit-déjeuner inclus"],
    "Restaurant in the house": ["Restorāns viesnīcā", "Ресторан в отеле", "Restaurant im Haus", "Restaurant sur place"],
    "Free Wi-Fi": ["Bezmaksas Wi-Fi", "Бесплатный Wi-Fi", "Kostenloses WLAN", "Wi-Fi gratuit"],
    "Lobby fireplace": ["Kamīns vestibilā", "Камин в лобби", "Kamin in der Lobby", "Cheminée dans le hall"],
    "Guest library": ["Viesu bibliotēka", "Библиотека для гостей", "Gästebibliothek", "Bibliothèque des clients"],
    "Bikes to rent": ["Velosipēdu noma", "Прокат велосипедов", "Fahrradverleih", "Vélos en location"],
    "Lift": ["Lifts", "Лифт", "Aufzug", "Ascenseur"],
    "Luggage storage": ["Bagāžas glabāšana", "Камера хранения", "Gepäckaufbewahrung", "Consigne à bagages"],
    "Airport transfer": ["Transfērs no lidostas", "Трансфер из аэропорта", "Flughafentransfer", "Navette aéroport"],
    "Parking nearby": ["Stāvvieta tuvumā", "Парковка рядом", "Parken in der Nähe", "Stationnement à proximité"],
    "Cots for little ones": ["Gultiņas mazuļiem", "Детские кроватки", "Babybetten", "Lits pour bébé"],
    "Pets welcome": ["Mājdzīvnieki laipni gaidīti", "Можно с животными", "Haustiere willkommen", "Animaux bienvenus"],
    "Step-free access": ["Piekļuve bez pakāpieniem", "Доступ без ступенек", "Stufenloser Zugang", "Accès sans marches"],
    "Late check-in": ["Vēla reģistrācija", "Поздний заезд", "Später Check-in", "Arrivée tardive"],
    "Work desk": ["Darba galds", "Рабочий стол", "Schreibtisch", "Bureau de travail"],
    "Tea & coffee in rooms": ["Tēja un kafija numuros", "Чай и кофе в номерах", "Tee & Kaffee im Zimmer", "Thé et café en chambre"],
    "Quiet rooms": ["Klusi numuri", "Тихие номера", "Ruhige Zimmer", "Chambres calmes"],
    "Air conditioning": ["Gaisa kondicionieris", "Кондиционер", "Klimaanlage", "Climatisation"],
    "Sauna or spa": ["Pirts vai spa", "Сауна или спа", "Sauna oder Spa", "Sauna ou spa"],
    "Gym": ["Sporta zāle", "Спортзал", "Fitnessraum", "Salle d'entraînement"],
    "24-hour reception": ["Diennakts reģistratūra", "Круглосуточный ресепшен", "Rezeption rund um die Uhr", "Réception 24 h sur 24"],
    "Tours & tickets desk": ["Ekskursijas un biļetes", "Экскурсии и билеты", "Touren & Tickets", "Visites et billetterie"],
    "Book direct": ["Rezervēt tieši", "Забронировать напрямую", "Direkt buchen", "Réserver en direct"],
    "Call us": ["Zvaniet mums", "Позвоните нам", "Rufen Sie uns an", "Appelez-nous"],
    "Email us": ["Rakstiet mums", "Напишите нам", "Schreiben Sie uns", "Écrivez-nous"],
    "Book online": ["Rezervēt tiešsaistē", "Забронировать онлайн", "Online buchen", "Réserver en ligne"],
    "Cash": ["Skaidra nauda", "Наличные", "Bargeld", "Argent comptant"],
    "Bank transfer": ["Bankas pārskaitījums", "Банковский перевод", "Banküberweisung", "Virement bancaire"],
    "Boutique hotel": ["Butika viesnīca", "Бутик-отель", "Boutique-Hotel", "Hôtel-boutique"],
    "Guesthouse": ["Viesu nams", "Гостевой дом", "Gästehaus", "Maison d'hôtes"],
    "Bed & breakfast": ["Viesu māja ar brokastīm", "Мини-отель с завтраком", "Bed & Breakfast", "Chambre d'hôtes"],
    "Aparthotel": ["Apartviesnīca", "Апарт-отель", "Aparthotel", "Appart-hôtel"],
    "Hostel": ["Hostelis", "Хостел", "Hostel", "Auberge de jeunesse"],
    "Inn": ["Krogs ar naktsmājām", "Гостиница", "Gasthof", "Auberge"],
    "Villa": ["Villa", "Вилла", "Villa", "Villa"],

    /* ---------------------------------------------------------------- the 30 guest profiles: name, line, hook */
    "Art Nouveau Admirer": ["Jūgendstila cienītājs", "Ценитель модерна", "Jugendstil-Liebhaber", "Amoureux de l'Art nouveau"],
    "Here for facades, stained glass and the curve of a staircase.": ["Brauc fasāžu, vitrāžu un kāpņu līkumu dēļ.", "Едет ради фасадов, витражей и изгибов лестниц.", "Kommt für Fassaden, Buntglas und den Schwung einer Treppe.", "Pour les façades, les vitraux et la courbe d'un escalier."],
    "Wake up among the finest facades in Europe.": ["Mostieties starp Eiropas skaistākajām fasādēm.", "Просыпайтесь среди лучших фасадов Европы.", "Wachen Sie zwischen den schönsten Fassaden Europas auf.", "Réveillez-vous parmi les plus belles façades d'Europe."],
    "History Buff": ["Vēstures mīļotājs", "Любитель истории", "Geschichtsfan", "Passionné d'histoire"],
    "Every cobblestone has a story, and they want all of them.": ["Katram bruģakmenim ir stāsts, un viņš grib dzirdēt visus.", "У каждого камня мостовой своя история, и он хочет услышать все.", "Jeder Pflasterstein hat eine Geschichte, und er will alle hören.", "Chaque pavé a son histoire, et pas question d'en manquer une."],
    "Centuries of history start at the front door.": ["Gadsimtiem sena vēsture sākas aiz durvīm.", "Века истории начинаются прямо за дверью.", "Jahrhunderte Geschichte beginnen vor der Haustür.", "Des siècles d'histoire, dès le pas de la porte."],
    "Foodie": ["Gardēdis", "Гурман", "Feinschmecker", "Gourmet"],
    "Plans the trip around lunch and dinner. Breakfast too.": ["Plāno braucienu ap pusdienām un vakariņām. Un brokastīm.", "Планирует поездку вокруг обедов и ужинов. И завтраков.", "Plant die Reise rund um Mittag- und Abendessen. Und Frühstück.", "Organise tout le voyage autour des repas. Petit-déjeuner compris."],
    "Your table is never more than a few minutes away.": ["Jūsu galdiņš vienmēr ir tikai dažu minūšu attālumā.", "Ваш столик всегда в паре минут.", "Ihr Tisch ist nie mehr als ein paar Minuten entfernt.", "Votre table n'est jamais à plus de quelques minutes."],
    "Coffee Lover": ["Kafijas cienītājs", "Любитель кофе", "Kaffeeliebhaber", "Amateur de café"],
    "Judges a city by its flat whites and its cinnamon buns.": ["Vērtē pilsētu pēc tās kafijas un kanēļmaizītēm.", "Судит о городе по его флэт уайту и булочкам с корицей.", "Beurteilt eine Stadt nach ihrem Flat White und ihren Zimtschnecken.", "Juge une ville à ses flat whites et à ses brioches à la cannelle."],
    "A great cup of coffee around every corner.": ["Lieliska kafija aiz katra stūra.", "Отличный кофе за каждым углом.", "Großartiger Kaffee an jeder Ecke.", "Un excellent café à chaque coin de rue."],
    "Romantic Couple": ["Romantisks pāris", "Романтичная пара", "Romantisches Paar", "Couple romantique"],
    "Candle-lit dinners, late mornings, a walk by the water.": ["Vakariņas sveču gaismā, vēli rīti, pastaiga gar ūdeni.", "Ужины при свечах, поздние утра, прогулка у воды.", "Dinner bei Kerzenlicht, späte Morgen, ein Spaziergang am Wasser.", "Repas aux chandelles, grasses matinées, balade au bord de l'eau."],
    "Candle-lit dinners and cobbled lanes for two.": ["Vakariņas sveču gaismā un bruģētas ieliņas diviem.", "Ужины при свечах и мощёные улочки для двоих.", "Dinner bei Kerzenlicht und Gassen für zwei.", "Repas aux chandelles et ruelles pavées, en amoureux."],
    "Family with Kids": ["Ģimene ar bērniem", "Семья с детьми", "Familie mit Kindern", "Famille avec enfants"],
    "Little legs, big curiosity, and snacks at all times.": ["Mazas kājiņas, liela ziņkārība un uzkodas vienmēr.", "Маленькие ножки, большое любопытство и перекусы всегда под рукой.", "Kleine Beine, große Neugier und immer Snacks dabei.", "Petites jambes, grande curiosité et collations à toute heure."],
    "Short walks, big adventures, room for everyone.": ["Īsas pastaigas, lieli piedzīvojumi, vieta visiem.", "Короткие прогулки, большие приключения, место для всех.", "Kurze Wege, große Abenteuer, Platz für alle.", "Petits trajets, grandes aventures, de la place pour tous."],
    "Business Traveller": ["Darba ceļotājs", "Деловой путешественник", "Geschäftsreisender", "Voyageur d'affaires"],
    "Meetings by day, a good dinner and a quiet room by night.": ["Dienā tikšanās, vakarā labas vakariņas un kluss numurs.", "Днём встречи, вечером хороший ужин и тихий номер.", "Tagsüber Termine, abends ein gutes Essen und ein ruhiges Zimmer.", "Réunions le jour, bonne table et chambre calme le soir."],
    "Close to everything, quiet when you need it.": ["Tuvu visam, klusi, kad tas vajadzīgs.", "Рядом со всем, тихо, когда нужно.", "Nah an allem, ruhig, wenn Sie es brauchen.", "Près de tout, au calme quand il le faut."],
    "Digital Nomad": ["Digitālais nomads", "Цифровой кочевник", "Digitaler Nomade", "Nomade numérique"],
    "Laptop, good Wi-Fi, better coffee, a city to explore after five.": ["Klēpjdators, labs Wi-Fi, vēl labāka kafija un pilsēta, ko izpētīt pēc pieciem.", "Ноутбук, хороший Wi-Fi, кофе ещё лучше и город, который можно исследовать после пяти.", "Laptop, gutes WLAN, noch besserer Kaffee und eine Stadt zum Entdecken nach fünf.", "Ordinateur portable, bon Wi-Fi, café encore meilleur et une ville à explorer après 17 h."],
    "Work from anywhere, then explore everything.": ["Strādājiet no jebkurienes, pēc tam izpētiet visu.", "Работайте откуда угодно, а потом исследуйте всё.", "Arbeiten Sie von überall, dann entdecken Sie alles.", "Travaillez d'où vous voulez, puis explorez tout."],
    "Night Owl": ["Naktspūce", "Сова", "Nachteule", "Noctambule"],
    "The city really starts after 10 pm.": ["Pilsēta īsti sākas pēc desmitiem vakarā.", "Город по-настоящему оживает после десяти вечера.", "Die Stadt beginnt erst nach 22 Uhr richtig.", "La ville commence vraiment après 22 h."],
    "The bars are close, and so is your bed.": ["Bāri ir tuvu, un tāpat arī jūsu gulta.", "Бары рядом, и ваша кровать тоже.", "Die Bars sind nah, und Ihr Bett auch.", "Les bars sont tout près, votre lit aussi."],
    "Concert & Opera Goer": ["Koncertu un operas apmeklētājs", "Любитель концертов и оперы", "Konzert- und Operngänger", "Mélomane"],
    "Has the opera schedule open in another tab.": ["Operas repertuārs jau atvērts citā cilnē.", "Афиша оперы уже открыта в соседней вкладке.", "Hat den Opernspielplan im anderen Tab offen.", "Garde la programmation de l'opéra ouverte dans un autre onglet."],
    "Curtain up, then a short walk home.": ["Priekškars veras, pēc tam īsa pastaiga mājup.", "Занавес, а потом короткая прогулка домой.", "Vorhang auf, danach ein kurzer Weg nach Hause.", "Lever de rideau, puis un court retour à pied."],
    "Shopper": ["Iepirkšanās mīļotājs", "Любитель шопинга", "Shopping-Fan", "Amateur de boutiques"],
    "Leaves with one more bag than they arrived with.": ["Aizbrauc ar vienu somu vairāk nekā atbrauca.", "Уезжает с одной сумкой больше, чем приехал.", "Reist mit einer Tasche mehr ab, als er gekommen ist.", "Repart toujours avec un sac de plus qu'à l'arrivée."],
    "Boutiques, markets and makers on your doorstep.": ["Butiki, tirgi un amatnieki pie jūsu durvīm.", "Бутики, рынки и мастера прямо у порога.", "Boutiquen, Märkte und Manufakturen vor der Tür.", "Boutiques, marchés et artisans à votre porte."],
    "Wellness Seeker": ["Labsajūtas meklētājs", "Ищущий гармонии", "Wellness-Suchender", "Adepte du bien-être"],
    "Saunas, slow mornings, green spaces and early nights.": ["Pirtis, nesteidzīgi rīti, zaļas vietas un agri vakari.", "Сауны, неспешные утра, зелень и ранний отбой.", "Saunen, ruhige Morgen, viel Grün und frühe Nächte.", "Saunas, matins paisibles, verdure et nuits qui commencent tôt."],
    "Slow mornings, green parks, a city that breathes.": ["Nesteidzīgi rīti, zaļi parki, pilsēta, kas elpo.", "Неспешные утра, зелёные парки, город, который дышит.", "Ruhige Morgen, grüne Parks, eine Stadt, die atmet.", "Matins paisibles, parcs verdoyants, une ville qui respire."],
    "Morning Runner": ["Rīta skrējējs", "Утренний бегун", "Morgenläufer", "Coureur matinal"],
    "Laces up before breakfast and maps every route.": ["Pirms brokastīm sasien kurpes un izplāno katru maršrutu.", "Зашнуровывается до завтрака и прокладывает каждый маршрут.", "Schnürt vor dem Frühstück die Schuhe und plant jede Strecke.", "Lacets noués avant le petit-déjeuner, chaque parcours repéré."],
    "Run the canal at sunrise, breakfast when you are back.": ["Skrējiens gar kanālu saullēktā, brokastis pēc atgriešanās.", "Пробежка вдоль канала на рассвете, завтрак по возвращении.", "Bei Sonnenaufgang am Kanal laufen, danach frühstücken.", "Courez le long du canal au lever du soleil, petit-déjeuner au retour."],
    "Cyclist": ["Riteņbraucējs", "Велосипедист", "Radfahrer", "Cycliste"],
    "Sees the city on two wheels, from the river to the suburbs.": ["Redz pilsētu no diviem riteņiem, no upes līdz priekšpilsētām.", "Смотрит город с велосипеда, от реки до окраин.", "Erkundet die Stadt auf zwei Rädern, vom Fluss bis in die Vororte.", "Découvre la ville sur deux roues, des quais jusqu'en banlieue."],
    "Grab a bike and the whole city is yours.": ["Paņemiet velosipēdu, un visa pilsēta ir jūsu.", "Берите велосипед, и весь город ваш.", "Schnappen Sie sich ein Rad, und die ganze Stadt gehört Ihnen.", "Prenez un vélo, et toute la ville est à vous."],
    "Photographer": ["Fotogrāfs", "Фотограф", "Fotograf", "Photographe"],
    "Chases golden hour, rooftops and quiet streets at dawn.": ["Medī zelta stundu, jumtus un klusas ielas rītausmā.", "Охотится за золотым часом, крышами и тихими улицами на рассвете.", "Jagt die goldene Stunde, Dächer und stille Straßen im Morgengrauen.", "Traque l'heure dorée, les toits et les rues calmes à l'aube."],
    "Golden hour starts outside your window.": ["Zelta stunda sākas aiz jūsu loga.", "Золотой час начинается за вашим окном.", "Die goldene Stunde beginnt vor Ihrem Fenster.", "L'heure dorée commence sous vos fenêtres."],
    "Budget Explorer": ["Taupīgs ceļotājs", "Экономный путешественник", "Sparfuchs", "Petit budget"],
    "Wants the most city for the least money.": ["Grib redzēt visvairāk par vismazāko naudu.", "Хочет увидеть больше всего за меньшие деньги.", "Will am meisten Stadt fürs wenigste Geld.", "Un maximum de ville pour un minimum d'argent."],
    "Walk everywhere. Spend it on experiences.": ["Ejiet visur kājām. Tērējiet piedzīvojumiem.", "Ходите везде пешком. Тратьте на впечатления.", "Gehen Sie überall zu Fuß. Geben Sie es für Erlebnisse aus.", "Allez partout à pied. Gardez l'argent pour les expériences."],
    "Solo Traveller": ["Ceļotājs vienatnē", "Путешественник-одиночка", "Alleinreisender", "Voyageur en solo"],
    "Their own pace, their own plans, and a good book.": ["Savs temps, savi plāni un laba grāmata.", "Свой темп, свои планы и хорошая книга.", "Eigenes Tempo, eigene Pläne und ein gutes Buch.", "Son rythme, ses projets et un bon livre."],
    "Your own pace, in a city that is easy to love.": ["Savā tempā, pilsētā, kuru ir viegli iemīlēt.", "В своём темпе, в городе, который легко полюбить.", "In Ihrem Tempo, in einer Stadt, die man leicht lieben kann.", "À votre rythme, dans une ville facile à aimer."],
    "Friends' Weekend": ["Draugu nedēļas nogale", "Выходные с друзьями", "Wochenende mit Freunden", "Fin de semaine entre amis"],
    "Three friends, two days, one group chat full of plans.": ["Trīs draugi, divas dienas un viena čata grupa, pilna plānu.", "Трое друзей, два дня и один групповой чат, полный планов.", "Drei Freunde, zwei Tage, ein Gruppenchat voller Pläne.", "Trois amis, deux jours, une conversation de groupe pleine de projets."],
    "Dinner, drinks and stories you will retell for years.": ["Vakariņas, dzērieni un stāsti, ko stāstīsiet gadiem.", "Ужин, напитки и истории, которые вы будете пересказывать годами.", "Abendessen, Drinks und Geschichten, die Sie noch jahrelang erzählen.", "Bonne table, verres et histoires à raconter pendant des années."],
    "Unhurried Travellers": ["Nesteidzīgi ceļotāji", "Неторопливые путешественники", "Gemütlich Reisende", "Voyageurs sans hâte"],
    "Retired, curious and in no rush at all.": ["Pensijā, ziņkārīgi un nekur nesteidzas.", "На пенсии, любознательны и никуда не спешат.", "Im Ruhestand, neugierig und ganz ohne Eile.", "Retraités, curieux et pas pressés du tout."],
    "Everything worth seeing, within an easy stroll.": ["Viss, ko vērts redzēt, vieglas pastaigas attālumā.", "Всё, что стоит увидеть, в лёгкой прогулке.", "Alles Sehenswerte, gemütlich zu Fuß erreichbar.", "L'essentiel à voir, au fil d'une promenade tranquille."],
    "Step-free Traveller": ["Ceļotājs bez pakāpieniem", "Путешественник без ступенек", "Stufenlos Reisende", "Mobilité réduite"],
    "Needs smooth routes, lifts and no surprises.": ["Vajag līdzenus maršrutus, liftus un bez pārsteigumiem.", "Нужны ровные маршруты, лифты и никаких сюрпризов.", "Braucht ebene Wege, Aufzüge und keine Überraschungen.", "Trajets sans obstacles, ascenseurs, et pas de mauvaises surprises."],
    "Short, smooth routes and help when you need it.": ["Īsi, līdzeni maršruti un palīdzība, kad tā vajadzīga.", "Короткие ровные маршруты и помощь, когда нужна.", "Kurze, ebene Wege und Hilfe, wenn Sie sie brauchen.", "Des trajets courts et sans obstacles, et de l'aide au besoin."],
    "Travelling with a Dog": ["Ceļojums ar suni", "Путешествие с собакой", "Reisen mit Hund", "En voyage avec son chien"],
    "The best friend comes too.": ["Labākais draugs brauc līdzi.", "Лучший друг едет с вами.", "Der beste Freund kommt mit.", "Le meilleur ami est du voyage."],
    "Parks for them, cafés for you.": ["Parki viņam, kafejnīcas jums.", "Парки для него, кафе для вас.", "Parks für ihn, Cafés für Sie.", "Des parcs pour lui, des cafés pour vous."],
    "Winter & Christmas Market": ["Ziema un Ziemassvētku tirdziņš", "Зима и рождественская ярмарка", "Winter & Weihnachtsmarkt", "Hiver et marché de Noël"],
    "Mulled wine, candlelight and markets under falling snow.": ["Karstvīns, sveču gaisma un tirdziņi krītošā sniegā.", "Глинтвейн, свечи и ярмарки под падающим снегом.", "Glühwein, Kerzenlicht und Märkte im fallenden Schnee.", "Vin chaud, lueur des chandelles et marchés sous les flocons."],
    "Christmas markets and candlelit cafés, a short walk away.": ["Ziemassvētku tirdziņi un kafejnīcas sveču gaismā, pāris soļu attālumā.", "Рождественские ярмарки и кафе при свечах в паре шагов.", "Weihnachtsmärkte und Cafés bei Kerzenlicht, nur ein paar Schritte entfernt.", "Marchés de Noël et cafés aux chandelles, à quelques pas."],
    "White Nights Summer": ["Baltās naktis vasarā", "Лето белых ночей", "Sommer der hellen Nächte", "Été des nuits claires"],
    "Long evenings, terraces and sunsets after ten.": ["Gari vakari, terases un saulrieti pēc desmitiem.", "Долгие вечера, террасы и закаты после десяти.", "Lange Abende, Terrassen und Sonnenuntergänge nach zehn.", "Longues soirées, terrasses et couchers de soleil après 22 h."],
    "Long light evenings on the terraces outside.": ["Gari, gaiši vakari uz terasēm turpat blakus.", "Долгие светлые вечера на террасах рядом.", "Lange helle Abende auf den Terrassen ringsum.", "De longues soirées lumineuses en terrasse, tout près."],
    "Craft Beer Fan": ["Amatniecības alus cienītājs", "Любитель крафтового пива", "Craft-Beer-Fan", "Fan de bière artisanale"],
    "Has a list of breweries and taprooms to tick off.": ["Viņam ir saraksts ar alus darītavām un krogiem, ko apmeklēt.", "У него список пивоварен и тапрумов, которые надо обойти.", "Hat eine Liste von Brauereien und Taprooms zum Abhaken.", "Tient une liste de microbrasseries et de bars à bières à cocher."],
    "Taprooms and beer gardens within a short wander.": ["Alus krodziņi un dārzi īsas pastaigas attālumā.", "Пивные бары и сады в короткой прогулке.", "Taprooms und Biergärten nur einen kurzen Bummel entfernt.", "Bars à bières et terrasses, à deux pas."],
    "Plant-based Eater": ["Augu ēdienu cienītājs", "Растительное питание", "Pflanzlich Essende", "Cuisine végétale"],
    "Vegetarian or vegan, and always hunting the best menus.": ["Veģetārietis vai vegāns, vienmēr meklē labākās ēdienkartes.", "Вегетарианец или веган, всегда ищет лучшие меню.", "Vegetarisch oder vegan und immer auf der Suche nach den besten Speisekarten.", "Végétarien ou végane, toujours à l'affût des meilleurs menus."],
    "Fresh, green food all around the block.": ["Svaigs, zaļš ēdiens visapkārt.", "Свежая растительная еда по всему кварталу.", "Frisches, grünes Essen rund um den Block.", "Une cuisine fraîche et végétale, partout dans le quartier."],
    "Short Layover": ["Īsa pārsēšanās", "Короткая пересадка", "Kurzer Zwischenstopp", "Courte escale"],
    "One night, a few hours of city, an early flight.": ["Viena nakts, dažas stundas pilsētā un agrs lidojums.", "Одна ночь, пара часов в городе и ранний рейс.", "Eine Nacht, ein paar Stunden Stadt, ein früher Flug.", "Une nuit, quelques heures en ville, un vol au petit matin."],
    "One night is enough to fall for the city.": ["Ar vienu nakti pietiek, lai iemīlētu pilsētu.", "Одной ночи хватит, чтобы влюбиться в город.", "Eine Nacht reicht, um sich in die Stadt zu verlieben.", "Une nuit suffit pour tomber sous le charme de la ville."],
    "Ferry & Cruise Day": ["Prāmja un kruīza diena", "День с парома или круиза", "Fähr- & Kreuzfahrttag", "Escale en bateau"],
    "Arrives by sea and wants the highlights before sailing.": ["Ierodas pa jūru un grib redzēt labāko pirms atiešanas.", "Прибывает морем и хочет увидеть главное до отплытия.", "Kommt übers Meer und will die Highlights vor dem Ablegen sehen.", "Arrive par la mer et veut voir l'essentiel avant de repartir."],
    "The best of the old town, then back to the port.": ["Labākais no vecpilsētas, tad atpakaļ uz ostu.", "Лучшее в старом городе, а потом обратно в порт.", "Das Beste der Altstadt, dann zurück zum Hafen.", "Le meilleur de la vieille ville, puis retour au port."],
    "Architecture Student": ["Arhitektūras students", "Студент-архитектор", "Architekturstudent", "Étudiant en architecture"],
    "Sketchbook in hand, from Gothic to Jugendstil to Soviet modern.": ["Ar skiču bloknotu rokā: no gotikas līdz jūgendstilam un padomju modernismam.", "С альбомом в руках: от готики до модерна и советского модернизма.", "Skizzenbuch in der Hand, von Gotik über Jugendstil bis zur sowjetischen Moderne.", "Carnet de croquis en main, du gothique à l'Art nouveau jusqu'au modernisme soviétique."],
    "Seven centuries of architecture in one walk.": ["Septiņi arhitektūras gadsimti vienā pastaigā.", "Семь веков архитектуры за одну прогулку.", "Sieben Jahrhunderte Architektur auf einem Spaziergang.", "Sept siècles d'architecture en une seule promenade."],
    "Event & Conference Visitor": ["Pasākuma vai konferences viesis", "Гость мероприятия или конференции", "Event- & Konferenzgast", "Événement ou congrès"],
    "In town for an event, with evenings free.": ["Pilsētā pasākuma dēļ, vakari brīvi.", "В городе ради мероприятия, вечера свободны.", "Wegen eines Events in der Stadt, die Abende sind frei.", "En ville pour un événement, les soirées libres."],
    "Walk to the venue, unwind in the old town.": ["Kājām līdz norises vietai, atpūta vecpilsētā.", "Пешком до площадки, отдых в старом городе.", "Zu Fuß zum Veranstaltungsort, entspannen in der Altstadt.", "Allez à pied à l'événement, détendez-vous dans la vieille ville."],
    "Long Stay": ["Ilga uzturēšanās", "Долгое пребывание", "Langer Aufenthalt", "Long séjour"],
    "Here for weeks: groceries, a gym and a favourite café matter.": ["Šeit uz nedēļām: svarīgs ir veikals, sporta zāle un iemīļota kafejnīca.", "Здесь на недели: важны продукты, спортзал и любимое кафе.", "Für Wochen hier: Supermarkt, Fitnessstudio und ein Lieblingscafé zählen.", "Ici pour des semaines : épicerie, salle d'entraînement et café préféré, c'est essentiel."],
    "Live like a local, from market to morning run.": ["Dzīvojiet kā vietējais: no tirgus līdz rīta skrējienam.", "Живите как местный: от рынка до утренней пробежки.", "Leben Sie wie ein Einheimischer, vom Markt bis zum Morgenlauf.", "Vivez comme les gens d'ici, du marché à la course du matin."]
  };

  NS.t = function (s, vars) {
    var row = NS.lang !== 'en' ? DICT[s] : null;
    var out = (row && row[IDX[NS.lang]]) || String(s == null ? '' : s);
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return out;
  };
  NS.th = function (s, vars) {
    var out = NS.esc(NS.t(s));
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return out;
  };
  NS.tr = function (s) {
    if (s == null || s === '' || NS.lang === 'en') return s;
    var k = String(s);
    if (owner[k]) return owner[k];
    var row = DICT[k];
    return (row && row[IDX[NS.lang]]) || s;
  };
  NS.hasWord = function (s) { return !!DICT[s]; };
  NS.tIn = function (lang, s) { var row = DICT[s]; return (row && IDX[lang] != null && row[IDX[lang]]) || ''; };
  NS.siteLangs = function (data) {
    var on = (data && data.langs) || [];
    return NS.LANG_ORDER.filter(function (c) { return c === 'en' || on.indexOf(c) >= 0; });
  };
  NS.setLang = function (code, data) {
    NS.lang = NS.LANGS[code] ? code : 'en';
    owner = (data && data.i18n && data.i18n[NS.lang]) || {};
    return NS.lang;
  };
  /* Lower-case the first letter where the language allows it (German nouns keep their capital). */
  NS.lcFirst = function (s) {
    s = String(s || '');
    return NS.lang === 'de' ? s : s.charAt(0).toLowerCase() + s.slice(1);
  };
  /* The language a guest's browser prefers, if the site offers it. */
  NS.browserLang = function (offered) {
    var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (var i = 0; i < prefs.length; i++) {
      var c = String(prefs[i] || '').slice(0, 2).toLowerCase();
      if (offered.indexOf(c) >= 0) return c;
    }
    return null;
  };
})();
