import { isLocale, localeEnglishNames, type Locale } from '@/lib/i18n';

/**
 * Language handling for the website desk and WhatsApp agents.
 *
 * Prefer the page locale when the visitor is on the site. On WhatsApp, detect
 * from the script they typed. Fixed refusals and handoffs are translated here
 * so Anthropic answers never fall back to English while a key is configured.
 */

export function detectAssistantLocale(text: string, preferred?: string | null): Locale {
  if (preferred && isLocale(preferred)) return preferred;

  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  /* Arabic script: Urdu is the India-facing default; Arabic page locale wins above. */
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';
  return 'en';
}

export function assistantLanguageName(locale: Locale): string {
  return localeEnglishNames[locale];
}

const FALLBACK: Record<Locale, string> = {
  en: 'I do not have that in the company notes, so I will not guess. A person on the team can answer during office hours. Payment is only on this website.',
  hi: 'यह जानकारी कंपनी के नोट्स में नहीं है, इसलिए अनुमान नहीं लगाया जा सकता। कार्यालय समय में टीम का कोई व्यक्ति जवाब दे सकता है। भुगतान केवल इस वेबसाइट पर होता है।',
  bn: 'কোম্পানির নোটে সেই তথ্য নেই, তাই আমি অনুমান করব না। অফিস সময়ে দলের কেউ উত্তর দিতে পারেন। পেমেন্ট শুধু এই ওয়েবসাইটে।',
  mr: 'ही माहिती कंपनीच्या नोंदीत नाही, म्हणून मी अंदाज लावणार नाही. कार्यालयीन वेळेत टीममधील कोणी उत्तर देऊ शकतो. पेमेंट फक्त या संकेतस्थळावर होते.',
  te: 'ఆ సమాచారం కంపెనీ నోట్స్‌లో లేదు, కాబట్టి నేను ఊహించను. ఆఫీసు సమయంలో బృందంలోని వారు సమాధానం ఇవ్వవచ్చు. చెల్లింపు ఈ వెబ్‌సైట్‌లోనే.',
  ta: 'அந்தத் தகவல் நிறுவனக் குறிப்புகளில் இல்லை; எனவே ஊகிக்க மாட்டேன். அலுவலக நேரத்தில் குழுவினர் பதிலளிக்கலாம். பணம் செலுத்துதல் இந்த இணையதளத்தில் மட்டுமே.',
  ur: 'یہ معلومات کمپنی کے نوٹس میں نہیں، اس لیے میں اندازہ نہیں لگاؤں گا۔ دفتری اوقات میں ٹیم کا کوئی فرد جواب دے سکتا ہے۔ ادائیگی صرف اس ویب سائٹ پر ہوتی ہے۔',
  gu: 'આ માહિતી કંપનીની નોંધમાં નથી, તેથી હું અનુમાન નહીં લગાડું. ઑફિસ સમયે ટીમનો કોઈ જવાબ આપી શકે. ચુકવણી ફક્ત આ વેબસાઇટ પર.',
  kn: 'ಆ ಮಾಹಿತಿ ಕಂಪನಿ ಟಿಪ್ಪಣಿಗಳಲ್ಲಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ. ಕಚೇರಿ ಸಮಯದಲ್ಲಿ ತಂಡದವರು ಉತ್ತರಿಸಬಹುದು. ಪಾವತಿ ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಮಾತ್ರ.',
  or: 'ସେହି ସୂଚନା କମ୍ପାନୀ ନୋଟରେ ନାହିଁ, ତେଣୁ ମୁଁ ଅନୁମାନ କରିବି ନାହିଁ। ଅଫିସ ସମୟରେ ଦଳର କେହି ଉତ୍ତର ଦେଇପାରିବେ। ପେମେଣ୍ଟ କେବଳ ଏହି ୱେବସାଇଟରେ।',
  ml: 'ആ വിവരം കമ്പനി കുറിപ്പുകളിൽ ഇല്ല, അതുകൊണ്ട് ഞാൻ ഊഹിക്കില്ല. ഓഫീസ് സമയത്ത് ടീമിലെ ആരെങ്കിലും മറുപടി തരാം. പേയ്‌മെന്റ് ഈ വെബ്‌സൈറ്റിൽ മാത്രം.',
  pa: 'ਉਹ ਜਾਣਕਾਰੀ ਕੰਪਨੀ ਦੇ ਨੋਟਸ ਵਿੱਚ ਨਹੀਂ, ਇਸ ਲਈ ਮੈਂ ਅਨੁਮਾਨ ਨਹੀਂ ਲਗਾਵਾਂਗਾ। ਦਫ਼ਤਰੀ ਸਮੇਂ ਟੀਮ ਦਾ ਕੋਈ ਵਿਅਕਤੀ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹੈ। ਭੁਗਤਾਨ ਸਿਰਫ਼ ਇਸ ਵੈੱਬਸਾਈਟ ’ਤੇ।',
  as: 'সেই তথ্য কোম্পানীৰ নোটত নাই, সেয়ে মই অনুমান নকৰোঁ। কাৰ্যালয়ৰ সময়ত দলৰ কোনোবাই উত্তৰ দিব পাৰে। পেমেণ্ট কেৱল এই ৱেবছাইটত।',
  ar: 'هذه المعلومة ليست في ملاحظات الشركة، لذلك لن أخمن. يمكن لأحد أفراد الفريق الرد خلال ساعات العمل. الدفع يتم على هذا الموقع فقط.',
};

const OFF: Record<Locale, string> = {
  en: 'Written answers are not switched on yet. A person on the team replies on WhatsApp during office hours.',
  hi: 'लिखित जवाब अभी चालू नहीं हैं। कार्यालय समय में टीम का व्यक्ति WhatsApp पर जवाब देता है।',
  bn: 'লিখিত উত্তর এখনো চালু নেই। অফিস সময়ে দলের কেউ WhatsApp-এ উত্তর দেন।',
  mr: 'लिखित उत्तरे अजून सुरू नाहीत. कार्यालयीन वेळेत टीम WhatsApp वर उत्तर देते.',
  te: 'వ్రాతపూర్వక సమాధానాలు ఇంకా ఆన్ కాలేదు. ఆఫీసు సమయంలో బృందం WhatsAppలో సమాధానం ఇస్తుంది.',
  ta: 'எழுத்துப்பூர்வ பதில்கள் இன்னும் இயங்கவில்லை. அலுவலக நேரத்தில் குழுவினர் WhatsApp-இல் பதிலளிக்கின்றனர்.',
  ur: 'تحریری جوابات ابھی آن نہیں۔ دفتری اوقات میں ٹیم WhatsApp پر جواب دیتی ہے۔',
  gu: 'લેખિત જવાબ હજુ ચાલુ નથી. ઑફિસ સમયે ટીમ WhatsApp પર જવાબ આપે છે.',
  kn: 'ಲಿಖಿತ ಉತ್ತರಗಳು ಇನ್ನೂ ಆನ್ ಆಗಿಲ್ಲ. ಕಚೇರಿ ಸಮಯದಲ್ಲಿ ತಂಡ WhatsAppನಲ್ಲಿ ಉತ್ತರಿಸುತ್ತದೆ.',
  or: 'ଲିଖିତ ଉତ୍ତର ଏପର୍ଯ୍ୟନ୍ତ ଚାଲୁ ନାହିଁ। ଅଫିସ ସମୟରେ ଦଳ WhatsAppରେ ଉତ୍ତର ଦିଅନ୍ତି।',
  ml: 'എഴുത്ത് മറുപടികൾ ഇതുവരെ ഓണല്ല. ഓഫീസ് സമയത്ത് ടീം WhatsApp-ൽ മറുപടി തരും.',
  pa: 'ਲਿਖਤੀ ਜਵਾਬ ਹਾਲੇ ਚਾਲੂ ਨਹੀਂ। ਦਫ਼ਤਰੀ ਸਮੇਂ ਟੀਮ WhatsApp ’ਤੇ ਜਵਾਬ ਦਿੰਦੀ ਹੈ।',
  as: 'লিখিত উত্তৰ এতিয়াও অন নহয়। কাৰ্যালয়ৰ সময়ত দলে WhatsApp-ত উত্তৰ দিয়ে।',
  ar: 'الإجابات المكتوبة غير مفعّلة بعد. يردّ أحد من الفريق على WhatsApp خلال ساعات العمل.',
};

const HANDOFF_WEB: Record<Locale, string> = {
  en: 'A recruiter will reply here shortly. Stay in this window — you do not need to start again.',
  hi: 'एक रिक्रूटर जल्द यहाँ जवाब देगा। इसी विंडो में रहें — फिर से शुरू करने की ज़रूरत नहीं।',
  bn: 'একজন রিক্রুটার শিগগির এখানে উত্তর দেবেন। এই উইন্ডোতেই থাকুন — আবার শুরু করতে হবে না।',
  mr: 'एक रिक्रूटर लवकरच येथे उत्तर देईल. याच खिडकीत रहा — पुन्हा सुरू करण्याची गरज नाही.',
  te: 'రిక్రూటర్ త్వరలో ఇక్కడ సమాధానం ఇస్తారు. ఈ విండోలోనే ఉండండి — మళ్లీ మొదలుపెట్టాల్సిన అవసరం లేదు.',
  ta: 'ஒரு ஆட்சேர்ப்பாளர் விரைவில் இங்கே பதிலளிப்பார். இந்தச் சாளரத்திலேயே இருங்கள் — மீண்டும் தொடங்க வேண்டாம்.',
  ur: 'ایک ریکروٹر جلد یہاں جواب دے گا۔ اسی ونڈو میں رہیں — دوبارہ شروع کرنے کی ضرورت نہیں۔',
  gu: 'એક રિક્રૂટર ટૂંક સમયમાં અહીં જવાબ આપશે. આ જ વિન્ડોમાં રહો — ફરી શરૂ કરવાની જરૂર નથી.',
  kn: 'ರಿಕ್ರೂಟರ್ ಶೀಘ್ರದಲ್ಲಿ ಇಲ್ಲಿ ಉತ್ತರಿಸುತ್ತಾರೆ. ಈ ವಿಂಡೋದಲ್ಲೇ ಇರಿ — ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಬೇಕಾಗಿಲ್ಲ.',
  or: 'ଜଣେ ରିକ୍ରୁଟର ଶୀଘ୍ର ଏଠାରେ ଉତ୍ତର ଦେବେ। ଏହି ୱିଣ୍ଡୋରେ ରୁହନ୍ତୁ — ପୁନର୍ବାର ଆରମ୍ଭ କରିବାକୁ ହେବ ନାହିଁ।',
  ml: 'ഒരു റിക്രൂട്ടർ ഉടൻ ഇവിടെ മറുപടി തരും. ഈ വിൻഡോയിൽ തന്നെ ഇരിക്കൂ — വീണ്ടും തുടങ്ങേണ്ടതില്ല.',
  pa: 'ਇੱਕ ਰਿਕਰੂਟਰ ਜਲਦੀ ਇੱਥੇ ਜਵਾਬ ਦੇਵੇਗਾ। ਇਸੇ ਵਿੰਡੋ ਵਿੱਚ ਰਹੋ — ਮੁੜ ਸ਼ੁਰੂ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ।',
  as: 'এজন ৰিক্ৰুটাৰ সোনকালে ইয়াত উত্তৰ দিব। এই উইণ্ডোতেই থাকক — পুনৰ আৰম্ভ কৰিব নালাগে।',
  ar: 'سيردّ أحد المسؤولين هنا قريباً. ابقَ في هذه النافذة — لا حاجة للبدء من جديد.',
};

const HANDOFF_WA: Record<Locale, string> = {
  en: 'A recruiter will continue with you on the website chat or call you back during office hours. Stay on this number if we already have your WhatsApp.',
  hi: 'एक रिक्रूटर वेबसाइट चैट पर जारी रखेगा या कार्यालय समय में कॉल बैक करेगा। अगर हमारा WhatsApp आपके पास है तो इसी नंबर पर रहें।',
  bn: 'একজন রিক্রুটার ওয়েবসাইট চ্যাটে চালিয়ে যাবেন বা অফিস সময়ে কল ব্যাক করবেন। আমাদের WhatsApp থাকলে এই নম্বরেই থাকুন।',
  mr: 'एक रिक्रूटर संकेतस्थळ चॅटवर पुढे जाईल किंवा कार्यालयीन वेळेत कॉल बॅक करेल. आमचा WhatsApp असेल तर याच क्रमांकावर रहा.',
  te: 'రిక్రూటర్ వెబ్‌సైట్ చాట్‌లో కొనసాగుతారు లేదా ఆఫీసు సమయంలో కాల్ బ్యాక్ చేస్తారు. మా WhatsApp ఉంటే ఈ నంబర్‌లోనే ఉండండి.',
  ta: 'ஆட்சேர்ப்பாளர் இணையதள அரட்டையில் தொடருவார் அல்லது அலுவலக நேரத்தில் அழைப்புத் திருப்புவார். எங்கள் WhatsApp இருந்தால் இந்த எண்ணிலேயே இருங்கள்.',
  ur: 'ایک ریکروٹر ویب سائٹ چیٹ پر جاری رکھے گا یا دفتری اوقات میں کال بیک کرے گا۔ اگر ہمارا WhatsApp ہے تو اسی نمبر پر رہیں۔',
  gu: 'એક રિક્રૂટર વેબસાઇટ ચેટ પર ચાલુ રાખશે અથવા ઑફિસ સમયે કૉલ બૅક કરશે. અમારો WhatsApp હોય તો આ જ નંબર પર રહો.',
  kn: 'ರಿಕ್ರೂಟರ್ ವೆಬ್‌ಸೈಟ್ ಚಾಟ್‌ನಲ್ಲಿ ಮುಂದುವರಿಯುತ್ತಾರೆ ಅಥವಾ ಕಚೇರಿ ಸಮಯದಲ್ಲಿ ಕಾಲ್ ಬ್ಯಾಕ್ ಮಾಡುತ್ತಾರೆ. ನಮ್ಮ WhatsApp ಇದ್ದರೆ ಈ ಸಂಖ್ಯೆಯಲ್ಲೇ ಇರಿ.',
  or: 'ଜଣେ ରିକ୍ରୁଟର ୱେବସାଇଟ ଚାଟରେ ଜାରି ରଖିବେ କିମ୍ବା ଅଫିସ ସମୟରେ କଲ୍ ବ୍ୟାକ୍ କରିବେ। ଆମର WhatsApp ଥିଲେ ଏହି ନମ୍ବରରେ ରୁହନ୍ତୁ।',
  ml: 'ഒരു റിക്രൂട്ടർ വെബ്‌സൈറ്റ് ചാറ്റിൽ തുടരും അല്ലെങ്കിൽ ഓഫീസ് സമയത്ത് കോൾ ബാക്ക് ചെയ്യും. ഞങ്ങളുടെ WhatsApp ഉണ്ടെങ്കിൽ ഈ നമ്പറിൽ തന്നെ ഇരിക്കൂ.',
  pa: 'ਇੱਕ ਰਿਕਰੂਟਰ ਵੈੱਬਸਾਈਟ ਚੈਟ ’ਤੇ ਜਾਰੀ ਰੱਖੇਗਾ ਜਾਂ ਦਫ਼ਤਰੀ ਸਮੇਂ ਕਾਲ ਬੈਕ ਕਰੇਗਾ। ਸਾਡਾ WhatsApp ਹੋਵੇ ਤਾਂ ਇਸੇ ਨੰਬਰ ’ਤੇ ਰਹੋ।',
  as: 'এজন ৰিক্ৰুটাৰ ৱেবছাইট চেশ্বত অব্যাহত ৰাখিব বা কাৰ্যালয়ৰ সময়ত কল বেক কৰিব। আমাৰ WhatsApp থাকিলে এই নম্বৰতে থাকক।',
  ar: 'سيتابع معك أحد المسؤولين على دردشة الموقع أو يتصل بك خلال ساعات العمل. ابقَ على هذا الرقم إن كان لدينا واتسابك.',
};

export function assistantFallback(locale: Locale): string {
  return FALLBACK[locale] ?? FALLBACK.en;
}

export function assistantOff(locale: Locale): string {
  return OFF[locale] ?? OFF.en;
}

export function assistantHandoff(channel: 'web' | 'whatsapp', locale: Locale): string {
  const table = channel === 'whatsapp' ? HANDOFF_WA : HANDOFF_WEB;
  return table[locale] ?? table.en;
}

/**
 * Human-request phrases beyond English, so Hindi / Tamil / etc. handoffs are
 * not missed when Anthropic is on.
 */
const HUMAN_ASK =
  /\b(speak to (a |an )?(human|person|someone|agent|recruiter|staff)|talk to (a |an )?(human|person|someone|agent|recruiter)|real person|live (chat|agent|person)|call me|human please)\b/i;

const HUMAN_ASK_LOCAL =
  /मानव|इंसान|व्यक्ति से बात|रिक्रूटर|মানুষ|ব্যক্তি|व्यक्तिशी|మనిషి|மனிதர்|பேசு|انسان|شخص|વ્યક્તિ|ಮಾತನಾಡ|ବ୍ୟକ୍ତି|മനുഷ്യൻ|ਇਨਸਾਨ|মানুহ|بشري|موظف/i;

export function askedForHuman(text: string): boolean {
  return HUMAN_ASK.test(text) || HUMAN_ASK_LOCAL.test(text);
}

/**
 * Expected writing system for each locale. Used to catch an English model
 * reply that would otherwise be shown to a Hindi / Tamil / etc. visitor.
 * Built with RegExp() so a locale key like `as` is never read as a type assertion.
 */
const LOCALE_SCRIPT: Record<Exclude<Locale, 'en'>, RegExp> = {
  hi: new RegExp('[\\u0900-\\u097F]'),
  mr: new RegExp('[\\u0900-\\u097F]'),
  bn: new RegExp('[\\u0980-\\u09FF]'),
  as: new RegExp('[\\u0980-\\u09FF]'),
  pa: new RegExp('[\\u0A00-\\u0A7F]'),
  gu: new RegExp('[\\u0A80-\\u0AFF]'),
  or: new RegExp('[\\u0B00-\\u0B7F]'),
  ta: new RegExp('[\\u0B80-\\u0BFF]'),
  te: new RegExp('[\\u0C00-\\u0C7F]'),
  kn: new RegExp('[\\u0C80-\\u0CFF]'),
  ml: new RegExp('[\\u0D00-\\u0D7F]'),
  ur: new RegExp('[\\u0600-\\u06FF]'),
  ar: new RegExp('[\\u0600-\\u06FF]'),
};

/** True when the reply already uses the visitor's script (or locale is English). */
export function replyMatchesLocale(reply: string, locale: Locale): boolean {
  if (locale === 'en') return true;
  const script = LOCALE_SCRIPT[locale];
  return script.test(reply);
}
