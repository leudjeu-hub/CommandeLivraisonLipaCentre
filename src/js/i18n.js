/*
 * Traductions du site.
 *
 * - PAGE.en : textes de index.html en anglais. Le français n’est pas répété ici :
 *   c’est le texte écrit dans index.html (data-i18n="clé").
 *   Ces valeurs peuvent contenir du HTML simple (<br>, <em>, <strong>, <a>).
 * - UI.fr / UI.en : textes produits par js/script.js (boutons, messages, récapitulatif).
 *
 * Pour ajouter une langue : ajouter PAGE.<code>, UI.<code>, les champs <code> dans
 * products.js et l’entrée dans LANGUAGES. `npm test` vérifie qu’aucune clé ne manque.
 */
window.I18N = {
  DEFAULT: 'fr',

  LANGUAGES: {
    fr: { label: 'Français', switchLabel: 'Passer en français', locale: 'fr-FR' },
    en: { label: 'English', switchLabel: 'Switch to English', locale: 'en-GB' }
  },

  META: {
    fr: { description: 'Livres et fournitures de papeterie : préparez votre commande pour une livraison à Yaoundé.' },
    en: { description: 'Books and stationery: prepare your order for delivery in Yaoundé.' }
  },

  PAGE: {
    en: {
      'brand.name': 'Librairie du Centre',
      'brand.logoAlt': 'LIPACE — Librairie Papeterie du Centre, home',
      'brand.tagline': 'BOOKSHOP &amp; STATIONERY · YAOUNDÉ',
      'nav.label': 'Main navigation',
      'nav.menu': 'Menu',
      'nav.catalogue': 'Catalogue',
      'nav.lists': 'School lists',
      'nav.delivery': 'Delivery',
      'nav.cart': 'Basket',
      'notice': 'Preview version · Illustrative items and prices · Every order is confirmed by the bookshop.',

      'hero.eyebrow': 'Your essentials, at your door',
      'hero.title': 'A page opens.<br><em>We deliver it to you.</em>',
      'hero.intro': 'Books, school supplies and office stationery. Fill your basket in a few clicks for home delivery in Yaoundé, with payment on delivery.',
      'hero.cta': 'Browse the catalogue ↗',
      'hero.list': 'My school list',
      'hero.channels': 'Phone · WhatsApp · Online order',
      'hero.sceneLabel': 'Illustration of books and supplies',
      'hero.svgLabel': 'Books, notebook and pencil',
      'hero.stamp': '📦 Home delivery in Yaoundé<br><strong>Pay on delivery</strong>',

      'strip.1.title': '01 / Choose your items',
      'strip.1.text': 'A simple catalogue for school and office.',
      'strip.2.title': '02 / Give your address',
      'strip.2.text': 'Neighbourhood, landmark and preferred time slot.',
      'strip.3.title': '03 / Pay on delivery',
      'strip.3.text': 'Cash, Orange Money or MTN MoMo, once activated.',

      'catalogue.eyebrow': 'The Centre’s selection',
      'catalogue.title': 'It all starts here.',
      'catalogue.note': 'Demo catalogue · Prices in FCFA',
      'catalogue.searchPlaceholder': 'Search for a notebook, a pen…',
      'catalogue.searchLabel': 'Search for a product',

      'lists.eyebrow': 'Parents, make back-to-school easy',
      'lists.title': 'A school list?<br>We’ll handle the rest.',
      'lists.text': 'Gather the books and supplies requested by the school. Prepare your quote request with the class, references and quantities.',
      'lists.cta': 'Request a quote ↗',
      'lists.edition.title': 'The right item, the right edition.',
      'lists.edition.text': 'Each book must be confirmed by its title, author and edition. Any substitution requires your approval.',
      'lists.business.title': 'For businesses too.',
      'lists.business.text': 'Paper, binders, pens and supplies: list your recurring needs in your quote request.',
      'lists.whatsapp': 'Send your list directly via WhatsApp from the quote form.',

      'delivery.eyebrow': 'A local service',
      'delivery.title': 'Delivery, made clear.',
      'delivery.1.title': 'Your neighbourhood',
      'delivery.1.text': 'Give your neighbourhood and a precise landmark. Delivery areas will be confirmed by the bookshop.',
      'delivery.2.title': 'Your time slot',
      'delivery.2.text': 'Availability, lead time and final fees are confirmed before dispatch.',
      'delivery.3.title': 'Your payment',
      'delivery.3.text': 'Check your parcel, then pay on delivery. No online payment is requested in this version.',

      'footer.services': 'Stationery, books and delivery service.',
      'footer.address': 'Carrefour Abbia, opposite the Manège<br>Yaoundé, Cameroon<br>Tel.: <a href="tel:+237693240396">+237 6 93 24 03 96</a>',
      'footer.hours': 'Opening hours',
      'footer.weekdays': 'Monday – Friday',
      'footer.saturday': 'Saturday',
      'footer.sunday': 'Sunday',
      'footer.closed': 'Closed',
      'footer.terms': 'Information &amp; privacy',

      'common.close': 'Close',
      'cart.title': 'Your basket',
      'cart.items': 'Items',
      'cart.fees': 'Delivery fee: to be confirmed depending on address and parcel.',
      'cart.checkout': 'Prepare my order',

      'form.intro': 'Your summary is prepared here. It is only sent to the bookshop if you click “Send via WhatsApp”.',
      'form.name': 'Recipient’s name',
      'form.phone': 'Phone',
      'form.area': 'Neighbourhood',
      'form.areaPlaceholder': 'e.g. Bastos, Melen, Essos…',
      'form.address': 'Address and landmark',
      'form.addressPlaceholder': 'Street, building, landmark and useful directions',
      'form.slot': 'Preferred time slot — to be confirmed',
      'form.slot.morning': 'Morning',
      'form.slot.afternoon': 'Afternoon',
      'form.slot.phone': 'To be arranged by phone',
      'form.payment': 'Payment on delivery — subject to activation',
      'form.payment.cash': 'Cash',
      'form.notes': 'School list or additional instructions',
      'form.notesPlaceholder': 'Class, references, edition, quantities…',
      'form.consent': 'I understand that prices, stock, delivery and its fees must be confirmed by the bookshop.',
      'form.submit': 'Create my summary',

      'result.title': 'Your summary is ready',
      'result.text': 'Send it to the bookshop via WhatsApp: your order will be confirmed by message or phone.',
      'result.whatsapp': 'Send via WhatsApp',
      'result.download': 'Download',
      'result.copy': 'Copy text',
      'afterSend.text': 'Has your message been sent on WhatsApp? Empty your basket so you don’t send the same order again by mistake.',
      'afterSend.clear': 'Empty my basket',
      'afterSend.keep': 'Keep my basket',

      'terms.title': 'About this version',
      'terms.p1': 'This site is a private preview of the upcoming service of the Librairie Papeterie du Centre. Products, prices and visuals are illustrative; they do not represent confirmed stock.',
      'terms.p2': 'Your basket is stored only in your browser. The form information is used to create your summary; it is only sent to the bookshop if you send it yourself via WhatsApp. No payment is collected online.',
      'terms.p3': 'Before commercial launch: complete the legal notice, add real prices and stock, define delivery areas and fees, and have the terms of sale and privacy policy approved.',
      'terms.clear': 'Clear my local basket',

      'map.text': 'Find us',
      'map.label': 'See the bookshop on Google Maps (new tab)'
    }
  },

  UI: {
    fr: {
      'cat.Tout': 'Tout',
      'cat.Scolaire': 'Scolaire',
      'cat.Bureau': 'Bureau',
      'cat.Livres': 'Livres',
      onQuote: 'Sur devis',
      request: 'Demander',
      add: 'Ajouter +',
      noResults: 'Aucun article trouvé. Essayez un autre mot.',
      cartEmpty: 'Votre panier est vide. Découvrez notre sélection.',
      quantity: 'Quantité : {name}',
      remove: 'Retirer {name}',
      formOrder: 'Livraison à Yaoundé',
      formQuote: 'Votre demande de devis',
      quoteNote: '{name} : titre, classe et édition à préciser.',
      toastAdded: 'Article ajouté au panier',
      toastCleared: 'Panier effacé',
      toastCopied: 'Récapitulatif copié',
      toastCopyFailed: 'Copie indisponible : téléchargez le document.',
      toastThanks: 'Panier vidé. Merci pour votre commande !',
      'sum.quote': 'DEMANDE DE DEVIS',
      'sum.order': 'DEMANDE DE COMMANDE',
      'sum.pending': ' — À CONFIRMER',
      'sum.date': 'Date : ',
      'sum.name': 'Destinataire : ',
      'sum.phone': 'Téléphone : ',
      'sum.area': 'Quartier : ',
      'sum.address': 'Adresse / repère : ',
      'sum.slot': 'Créneau souhaité : ',
      'sum.payment': 'Paiement à réception : ',
      'sum.total': 'Total indicatif des articles : ',
      'sum.confirm': 'Livraison, disponibilité et prix définitifs à confirmer.',
      'sum.notes': 'Informations complémentaires : ',
      'sum.disclaimer': 'Cette demande ne constitue pas une commande confirmée.',
      'sum.language': ''
    },
    en: {
      'cat.Tout': 'All',
      'cat.Scolaire': 'School',
      'cat.Bureau': 'Office',
      'cat.Livres': 'Books',
      onQuote: 'On quote',
      request: 'Request',
      add: 'Add +',
      noResults: 'No items found. Try another word.',
      cartEmpty: 'Your basket is empty. Browse our selection.',
      quantity: 'Quantity: {name}',
      remove: 'Remove {name}',
      formOrder: 'Delivery in Yaoundé',
      formQuote: 'Your quote request',
      quoteNote: '{name}: please specify the title, class and edition.',
      toastAdded: 'Item added to basket',
      toastCleared: 'Basket cleared',
      toastCopied: 'Summary copied',
      toastCopyFailed: 'Copy unavailable: please download the document.',
      toastThanks: 'Basket emptied. Thank you for your order!',
      'sum.quote': 'QUOTE REQUEST',
      'sum.order': 'ORDER REQUEST',
      'sum.pending': ' — TO BE CONFIRMED',
      'sum.date': 'Date: ',
      'sum.name': 'Recipient: ',
      'sum.phone': 'Phone: ',
      'sum.area': 'Neighbourhood: ',
      'sum.address': 'Address / landmark: ',
      'sum.slot': 'Preferred time slot: ',
      'sum.payment': 'Payment on delivery: ',
      'sum.total': 'Indicative item total: ',
      'sum.confirm': 'Delivery, availability and final prices to be confirmed.',
      'sum.notes': 'Additional information: ',
      'sum.disclaimer': 'This request is not a confirmed order.',
      'sum.language': 'Customer language: English'
    }
  }
};
