import type { Locale } from '@/lib/i18n/path';

/**
 * The footer email sign-up, in every language. Kept in code rather than the
 * JSON files because it is six short interface labels, not page copy. Same
 * rule as the rest: the English source is the key. Needs a native read.
 */
export const interfaceUpdates: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  hi: {
    'New jobs by email': 'ईमेल पर नई नौकरियाँ',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'नई नौकरियाँ खुलने पर हम ईमेल करते हैं। कोई स्पैम नहीं, और आप कभी भी सदस्यता छोड़ सकते हैं।',
    'Your email': 'आपका ईमेल',
    Subscribe: 'सदस्यता लें',
    'Thank you. You are on the list.': 'धन्यवाद। आप सूची में जुड़ गए हैं।',
    'That did not work. Check the address and try again.': 'यह नहीं हो पाया। पता जाँचें और फिर कोशिश करें।',
  },
  bn: {
    'New jobs by email': 'ইমেলে নতুন চাকরি',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'নতুন চাকরি খুললে আমরা ইমেল করি। কোনো স্প্যাম নয়, আর আপনি যেকোনো সময় সদস্যতা ছাড়তে পারেন।',
    'Your email': 'আপনার ইমেল',
    Subscribe: 'সদস্য হন',
    'Thank you. You are on the list.': 'ধন্যবাদ। আপনি তালিকায় যুক্ত হয়েছেন।',
    'That did not work. Check the address and try again.': 'হয়নি। ঠিকানাটি দেখে আবার চেষ্টা করুন।',
  },
  mr: {
    'New jobs by email': 'ईमेलवर नवीन नोकऱ्या',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'नवीन नोकऱ्या उघडल्यावर आम्ही ईमेल करतो. स्पॅम नाही, आणि तुम्ही कधीही सदस्यता रद्द करू शकता.',
    'Your email': 'तुमचा ईमेल',
    Subscribe: 'सदस्य व्हा',
    'Thank you. You are on the list.': 'धन्यवाद. तुम्ही यादीत आहात.',
    'That did not work. Check the address and try again.': 'हे झाले नाही. पत्ता तपासा आणि पुन्हा प्रयत्न करा.',
  },
  te: {
    'New jobs by email': 'ఈమెయిల్‌లో కొత్త ఉద్యోగాలు',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'కొత్త ఉద్యోగాలు వచ్చినప్పుడు మేము ఈమెయిల్ చేస్తాం. స్పామ్ ఉండదు, ఎప్పుడైనా సభ్యత్వం రద్దు చేసుకోవచ్చు.',
    'Your email': 'మీ ఈమెయిల్',
    Subscribe: 'సభ్యత్వం తీసుకోండి',
    'Thank you. You are on the list.': 'ధన్యవాదాలు. మీరు జాబితాలో చేరారు.',
    'That did not work. Check the address and try again.': 'అది పని చేయలేదు. చిరునామా సరిచూసి మళ్లీ ప్రయత్నించండి.',
  },
  ta: {
    'New jobs by email': 'மின்னஞ்சலில் புதிய வேலைகள்',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'புதிய வேலைகள் திறக்கும்போது மின்னஞ்சல் அனுப்புவோம். ஸ்பேம் இல்லை, எப்போது வேண்டுமானாலும் விலகலாம்.',
    'Your email': 'உங்கள் மின்னஞ்சல்',
    Subscribe: 'சேருங்கள்',
    'Thank you. You are on the list.': 'நன்றி. நீங்கள் பட்டியலில் சேர்க்கப்பட்டீர்கள்.',
    'That did not work. Check the address and try again.': 'அது நடக்கவில்லை. முகவரியைச் சரிபார்த்து மீண்டும் முயலுங்கள்.',
  },
  ur: {
    'New jobs by email': 'ای میل پر نئی نوکریاں',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'نئی نوکریاں کھلنے پر ہم ای میل کرتے ہیں۔ کوئی اسپام نہیں، اور آپ کسی بھی وقت رکنیت ختم کر سکتے ہیں۔',
    'Your email': 'آپ کا ای میل',
    Subscribe: 'رکنیت لیں',
    'Thank you. You are on the list.': 'شکریہ۔ آپ فہرست میں شامل ہو گئے ہیں۔',
    'That did not work. Check the address and try again.': 'یہ نہیں ہو سکا۔ پتہ دیکھ کر دوبارہ کوشش کریں۔',
  },
  gu: {
    'New jobs by email': 'ઈમેલ પર નવી નોકરીઓ',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'નવી નોકરીઓ ખૂલે ત્યારે અમે ઈમેલ કરીએ છીએ. કોઈ સ્પામ નહીં, અને તમે ગમે ત્યારે સભ્યપદ છોડી શકો છો.',
    'Your email': 'તમારો ઈમેલ',
    Subscribe: 'સભ્ય બનો',
    'Thank you. You are on the list.': 'આભાર. તમે યાદીમાં જોડાઈ ગયા છો.',
    'That did not work. Check the address and try again.': 'એ થયું નહીં. સરનામું તપાસીને ફરી પ્રયાસ કરો.',
  },
  kn: {
    'New jobs by email': 'ಇಮೇಲ್‌ನಲ್ಲಿ ಹೊಸ ಉದ್ಯೋಗಗಳು',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'ಹೊಸ ಉದ್ಯೋಗಗಳು ತೆರೆದಾಗ ನಾವು ಇಮೇಲ್ ಮಾಡುತ್ತೇವೆ. ಸ್ಪ್ಯಾಮ್ ಇಲ್ಲ, ಯಾವಾಗ ಬೇಕಾದರೂ ಚಂದಾದಾರಿಕೆ ರದ್ದುಮಾಡಬಹುದು.',
    'Your email': 'ನಿಮ್ಮ ಇಮೇಲ್',
    Subscribe: 'ಚಂದಾದಾರರಾಗಿ',
    'Thank you. You are on the list.': 'ಧನ್ಯವಾದಗಳು. ನೀವು ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿದ್ದೀರಿ.',
    'That did not work. Check the address and try again.': 'ಅದು ಆಗಲಿಲ್ಲ. ವಿಳಾಸ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  },
  or: {
    'New jobs by email': 'ଇମେଲରେ ନୂଆ ଚାକିରି',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'ନୂଆ ଚାକିରି ଖୋଲିଲେ ଆମେ ଇମେଲ କରୁ। କୌଣସି ସ୍ପାମ ନାହିଁ, ଏବଂ ଆପଣ ଯେକୌଣସି ସମୟରେ ସଦସ୍ୟତା ଛାଡ଼ିପାରିବେ।',
    'Your email': 'ଆପଣଙ୍କ ଇମେଲ',
    Subscribe: 'ସଦସ୍ୟ ହୁଅନ୍ତୁ',
    'Thank you. You are on the list.': 'ଧନ୍ୟବାଦ। ଆପଣ ତାଲିକାରେ ଯୋଡ଼ି ହୋଇଗଲେ।',
    'That did not work. Check the address and try again.': 'ଏହା ହେଲା ନାହିଁ। ଠିକଣା ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
  },
  ml: {
    'New jobs by email': 'ഇമെയിലിൽ പുതിയ ജോലികൾ',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'പുതിയ ജോലികൾ തുറക്കുമ്പോൾ ഞങ്ങൾ ഇമെയിൽ അയയ്ക്കും. സ്പാം ഇല്ല, എപ്പോൾ വേണമെങ്കിലും ഒഴിവാകാം.',
    'Your email': 'നിങ്ങളുടെ ഇമെയിൽ',
    Subscribe: 'ചേരൂ',
    'Thank you. You are on the list.': 'നന്ദി. നിങ്ങൾ പട്ടികയിൽ ചേർന്നു.',
    'That did not work. Check the address and try again.': 'അത് നടന്നില്ല. വിലാസം പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കൂ.',
  },
  pa: {
    'New jobs by email': 'ਈਮੇਲ ’ਤੇ ਨਵੀਆਂ ਨੌਕਰੀਆਂ',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'ਨਵੀਆਂ ਨੌਕਰੀਆਂ ਖੁੱਲ੍ਹਣ ’ਤੇ ਅਸੀਂ ਈਮੇਲ ਕਰਦੇ ਹਾਂ। ਕੋਈ ਸਪੈਮ ਨਹੀਂ, ਅਤੇ ਤੁਸੀਂ ਕਦੇ ਵੀ ਮੈਂਬਰਸ਼ਿਪ ਛੱਡ ਸਕਦੇ ਹੋ।',
    'Your email': 'ਤੁਹਾਡੀ ਈਮੇਲ',
    Subscribe: 'ਮੈਂਬਰ ਬਣੋ',
    'Thank you. You are on the list.': 'ਧੰਨਵਾਦ। ਤੁਸੀਂ ਸੂਚੀ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋ ਗਏ ਹੋ।',
    'That did not work. Check the address and try again.': 'ਇਹ ਨਹੀਂ ਹੋਇਆ। ਪਤਾ ਜਾਂਚ ਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  as: {
    'New jobs by email': 'ইমেইলত নতুন চাকৰি',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'নতুন চাকৰি মুকলি হ’লে আমি ইমেইল কৰোঁ। কোনো স্পাম নাই, আৰু আপুনি যিকোনো সময়তে সদস্যতা এৰিব পাৰে।',
    'Your email': 'আপোনাৰ ইমেইল',
    Subscribe: 'সদস্য হওক',
    'Thank you. You are on the list.': 'ধন্যবাদ। আপুনি তালিকাত যোগ হ’ল।',
    'That did not work. Check the address and try again.': 'নহ’ল। ঠিকনাটো চাই আকৌ চেষ্টা কৰক।',
  },
  ar: {
    'New jobs by email': 'وظائف جديدة عبر البريد الإلكتروني',
    'We write when new jobs open. No spam, and you can unsubscribe at any time.': 'نراسلك عندما تُفتح وظائف جديدة. بلا رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.',
    'Your email': 'بريدك الإلكتروني',
    Subscribe: 'اشترك',
    'Thank you. You are on the list.': 'شكرًا. أنت الآن في القائمة.',
    'That did not work. Check the address and try again.': 'لم ينجح ذلك. تحقّق من العنوان وحاول مرة أخرى.',
  },
};
