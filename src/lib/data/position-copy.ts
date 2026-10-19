import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import type { PositionSlug } from '@/lib/data/positions';

/**
 * What each job actually is, in the operations these placements are for.
 *
 * Written from the group's own businesses rather than from a job board: a
 * managed portfolio of several hundred apartments, cafés and restaurants, and
 * the renovation work that keeps both running. That is why the cleaner entry
 * talks about turnarounds between guests and the electrician entry talks about
 * old Lisbon buildings. A candidate deciding whether to spend an evening on an
 * assessment deserves to know which of these is their work.
 *
 * Kept out of the main dictionary because this is content that will be edited
 * by whoever knows the roles, not by whoever is adding a button label.
 *
 * Each has a `summary` of one line for the card, and `detail` of two or three
 * sentences for the dialog. No salary figures: they vary by employer and a
 * number here would be a promise the platform cannot keep.
 */

export type PositionCopy = { summary: string; detail: string; looksFor: string[] };

const en: Record<PositionSlug, PositionCopy> = {
  'property-manager': {
    summary: 'Running occupied buildings day to day, and the people in them.',
    detail:
      'Managed residential buildings in Lisbon, Porto and the Algarve: check-ins and check-outs, guests and tenants, keys, suppliers, and the small problems that have to be solved the same day. You are the person on site when a boiler fails on a Saturday.',
    looksFor: ['Calm with people', 'Written English', 'Organised without being told to be'],
  },
  cleaner: {
    summary: 'Turnarounds between guests, to a standard that is checked.',
    detail:
      'Apartments and hotel rooms, usually on a turnaround between one guest leaving and the next arriving, against a checklist somebody inspects. Pace matters, but what gets noticed is consistency: the room that is right every time rather than impressive once.',
    looksFor: ['Speed with consistency', 'Chemical handling', 'Working unsupervised'],
  },
  chef: {
    summary: 'Service in a working kitchen, not a demonstration kitchen.',
    detail:
      'Cafés, bakeries and restaurant kitchens doing real covers: prep, service, allergens, waste and handover. Most placements start on a section rather than running a pass, and the ones that go well are people who can hold their station when the room fills.',
    looksFor: ['Section work under pressure', 'Food safety', 'Kitchen English'],
  },
  'fb-service': {
    summary: 'The floor, the counter and the customer in front of you.',
    detail:
      'Serving in cafés, bars and restaurants: orders, the till, coffee, clearing and the hundred small judgements a shift asks for. English is the working language with most guests, and a willing manner carries further here than it does in a kitchen.',
    looksFor: ['Spoken English', 'Pace on a busy floor', 'Handling a till'],
  },
  driver: {
    summary: 'Deliveries, transfers and the routes between them.',
    detail:
      'Vans and light commercial vehicles for deliveries, linen runs between properties, and passenger transfers. Portuguese city driving is close quarters and the hours are early; a licence that transfers and a clean record matter more than years behind a wheel.',
    looksFor: ['Clean licence', 'City driving', 'Punctuality that can be relied on'],
  },
  logistics: {
    summary: 'Stock, linen and goods moving between sites on time.',
    detail:
      'Receiving, counting, storing and dispatching: linen for a managed portfolio, stock for kitchens, and the paperwork that says where everything went. It is the job where a small error becomes somebody else’s emergency three hours later.',
    looksFor: ['Accurate counting', 'Stock systems', 'Lifting and pace'],
  },
  'construction-worker': {
    summary: 'Renovation and fit-out, mostly in buildings already standing.',
    detail:
      'Portuguese construction leans heavily on renovation of older buildings rather than new build: demolition, screed, plaster, tiling and making good. Sites are often small, in occupied streets, with restricted access and neighbours.',
    looksFor: ['Site experience', 'Safety discipline', 'Finishing work'],
  },
  electrician: {
    summary: 'Installation and fault-finding, often in old wiring.',
    detail:
      'Circuits, boards, lighting and fault-finding across apartments and commercial spaces. A great deal of the work in Lisbon is in buildings a century old, where the first job is working out what the last person did.',
    looksFor: ['Reading a board', 'Fault-finding', 'Working to a standard'],
  },
  plumber: {
    summary: 'Water, waste and heating, in flats where the neighbour is below.',
    detail:
      'Bathrooms and kitchens, hot water, leaks and the heating that fails on the coldest week. Almost all of it is in occupied apartment buildings, so the work is as much about containing a problem as about fixing it.',
    looksFor: ['Pipework', 'Leak diagnosis', 'Clean work in occupied homes'],
  },
  welder: {
    summary: 'Structural and fabrication work, to a drawing.',
    detail:
      'Fabrication, railings, structural steel and repair, usually to a drawing and sometimes to a certificate. The processes you have actually run matter more than the number of years: say which, and where.',
    looksFor: ['MIG, TIG or stick', 'Reading a drawing', 'Safety on site'],
  },
  'data-analyst': {
    summary: 'Turning operational data into decisions somebody acts on.',
    detail:
      'Occupancy, pricing, bookings and cost data across a managed portfolio and a hospitality operation. The useful part is rarely the model: it is noticing that one building is behaving unlike the others and finding out why.',
    looksFor: ['SQL', 'Spreadsheets to a professional standard', 'Explaining a number clearly'],
  },
  'qa-tester': {
    summary: 'Finding what breaks before a customer does.',
    detail:
      'Testing booking flows, internal tools and customer-facing systems: writing cases, reproducing faults and describing them so a developer can fix them without asking you twice. Manual testing with an eye for the edge nobody tried.',
    looksFor: ['Writing a clear bug report', 'Test cases', 'Curiosity about edge cases'],
  },
};

const hi: Record<PositionSlug, PositionCopy> = {
  'property-manager': {
    summary: 'रोज़मर्रा की इमारत और उसमें रहने वाले लोगों का प्रबंधन।',
    detail:
      'लिस्बन, पोर्टो और अल्गार्वे में प्रबंधित आवासीय इमारतें: चेक-इन और चेक-आउट, मेहमान और किरायेदार, चाबियाँ, सप्लायर, और वे छोटी समस्याएँ जो उसी दिन हल करनी होती हैं। शनिवार को बॉयलर ख़राब हो तो मौक़े पर आप ही होते हैं।',
    looksFor: ['लोगों के साथ शांत', 'लिखित अंग्रेज़ी', 'बिना कहे व्यवस्थित'],
  },
  cleaner: {
    summary: 'एक मेहमान के जाने और दूसरे के आने के बीच की सफ़ाई, जिसकी जाँच होती है।',
    detail:
      'अपार्टमेंट और होटल के कमरे, आमतौर पर एक मेहमान के जाने और अगले के आने के बीच, एक चेकलिस्ट के अनुसार जिसे कोई जाँचता है। रफ़्तार मायने रखती है, पर नज़र आती है निरंतरता: हर बार सही कमरा, न कि एक बार शानदार।',
    looksFor: ['रफ़्तार के साथ निरंतरता', 'केमिकल हैंडलिंग', 'बिना निगरानी काम'],
  },
  chef: {
    summary: 'असली रसोई में सर्विस, प्रदर्शन वाली रसोई में नहीं।',
    detail:
      'कैफ़े, बेकरी और रेस्तराँ की रसोई जहाँ सचमुच ऑर्डर बनते हैं: तैयारी, सर्विस, एलर्जन, वेस्ट और हैंडओवर। ज़्यादातर शुरुआत एक सेक्शन से होती है, और वही लोग अच्छा करते हैं जो भीड़ बढ़ने पर अपना स्टेशन संभाल लेते हैं।',
    looksFor: ['दबाव में सेक्शन का काम', 'खाद्य सुरक्षा', 'रसोई की अंग्रेज़ी'],
  },
  'fb-service': {
    summary: 'फ़्लोर, काउंटर और आपके सामने खड़ा ग्राहक।',
    detail:
      'कैफ़े, बार और रेस्तराँ में सर्विस: ऑर्डर, टिल, कॉफ़ी, टेबल साफ़ करना और शिफ़्ट के सौ छोटे फ़ैसले। ज़्यादातर मेहमानों के साथ काम की भाषा अंग्रेज़ी है, और यहाँ अच्छा व्यवहार रसोई से ज़्यादा दूर तक ले जाता है।',
    looksFor: ['बोलचाल की अंग्रेज़ी', 'व्यस्त फ़्लोर पर रफ़्तार', 'टिल संभालना'],
  },
  driver: {
    summary: 'डिलीवरी, ट्रांसफ़र और उनके बीच के रास्ते।',
    detail:
      'डिलीवरी के लिए वैन और हल्के व्यावसायिक वाहन, संपत्तियों के बीच लिनन की ढुलाई, और यात्री ट्रांसफ़र। पुर्तगाल में शहर की ड्राइविंग तंग है और समय सुबह जल्दी; ट्रांसफ़र होने वाला लाइसेंस और साफ़ रिकॉर्ड सालों के अनुभव से ज़्यादा मायने रखते हैं।',
    looksFor: ['साफ़ लाइसेंस', 'शहर में ड्राइविंग', 'भरोसेमंद समय-पालन'],
  },
  logistics: {
    summary: 'स्टॉक, लिनन और सामान, समय पर एक जगह से दूसरी जगह।',
    detail:
      'सामान लेना, गिनना, रखना और भेजना: प्रबंधित संपत्तियों का लिनन, रसोई का स्टॉक, और वह काग़ज़ी काम जो बताता है कि क्या कहाँ गया। यह वह काम है जहाँ एक छोटी ग़लती तीन घंटे बाद किसी और की आपात स्थिति बन जाती है।',
    looksFor: ['सटीक गिनती', 'स्टॉक सिस्टम', 'उठाना और रफ़्तार'],
  },
  'construction-worker': {
    summary: 'नवीनीकरण और फ़िट-आउट, ज़्यादातर पहले से खड़ी इमारतों में।',
    detail:
      'पुर्तगाल का निर्माण नई इमारतों से ज़्यादा पुरानी इमारतों के नवीनीकरण पर टिका है: तोड़-फोड़, स्क्रीड, प्लास्टर, टाइल और फ़िनिशिंग। साइटें अक्सर छोटी होती हैं, बसी हुई गलियों में, सीमित पहुँच और पड़ोसियों के साथ।',
    looksFor: ['साइट का अनुभव', 'सुरक्षा अनुशासन', 'फ़िनिशिंग का काम'],
  },
  electrician: {
    summary: 'इंस्टॉलेशन और ख़राबी ढूँढ़ना, अक्सर पुरानी वायरिंग में।',
    detail:
      'अपार्टमेंट और व्यावसायिक जगहों में सर्किट, बोर्ड, लाइटिंग और फ़ॉल्ट-फ़ाइंडिंग। लिस्बन में बहुत सारा काम सौ साल पुरानी इमारतों में है, जहाँ पहला काम यह समझना होता है कि पिछले व्यक्ति ने क्या किया था।',
    looksFor: ['बोर्ड पढ़ना', 'फ़ॉल्ट-फ़ाइंडिंग', 'मानक के अनुसार काम'],
  },
  plumber: {
    summary: 'पानी, निकासी और हीटिंग, उन फ़्लैटों में जहाँ नीचे पड़ोसी रहता है।',
    detail:
      'बाथरूम और रसोई, गर्म पानी, लीक, और वह हीटिंग जो सबसे ठंडे हफ़्ते में ख़राब होती है। लगभग सब कुछ बसे हुए अपार्टमेंट में होता है, इसलिए काम जितना ठीक करने का है उतना ही समस्या को फैलने से रोकने का।',
    looksFor: ['पाइपवर्क', 'लीक पहचानना', 'बसे घरों में साफ़ काम'],
  },
  welder: {
    summary: 'ड्रॉइंग के अनुसार संरचनात्मक और फ़ैब्रिकेशन का काम।',
    detail:
      'फ़ैब्रिकेशन, रेलिंग, स्ट्रक्चरल स्टील और मरम्मत, आमतौर पर ड्रॉइंग के अनुसार और कभी-कभी प्रमाणपत्र के साथ। सालों की संख्या से ज़्यादा यह मायने रखता है कि आपने कौन-सी प्रक्रियाएँ सचमुच चलाई हैं: बताइए कौन-सी, और कहाँ।',
    looksFor: ['MIG, TIG या स्टिक', 'ड्रॉइंग पढ़ना', 'साइट पर सुरक्षा'],
  },
  'data-analyst': {
    summary: 'परिचालन के आँकड़ों को ऐसे फ़ैसलों में बदलना जिन पर कोई अमल करे।',
    detail:
      'प्रबंधित संपत्तियों और हॉस्पिटैलिटी में ऑक्यूपेंसी, मूल्य-निर्धारण, बुकिंग और लागत के आँकड़े। काम का उपयोगी हिस्सा शायद ही कभी मॉडल होता है: यह देखना होता है कि एक इमारत बाक़ियों से अलग व्यवहार कर रही है, और क्यों।',
    looksFor: ['SQL', 'पेशेवर स्तर की स्प्रेडशीट', 'आँकड़े को साफ़ समझाना'],
  },
  'qa-tester': {
    summary: 'ग्राहक से पहले ख़ुद ढूँढ़ना कि क्या टूटता है।',
    detail:
      'बुकिंग फ़्लो, आंतरिक टूल और ग्राहक-सामने के सिस्टम की टेस्टिंग: केस लिखना, ख़राबी दोहराना, और उसे ऐसे बताना कि डेवलपर दोबारा पूछे बिना ठीक कर सके। मैनुअल टेस्टिंग, उस किनारे पर नज़र के साथ जिसे किसी ने आज़माया नहीं।',
    looksFor: ['साफ़ बग रिपोर्ट लिखना', 'टेस्ट केस', 'एज केस की जिज्ञासा'],
  },
};

function overlay(copy: Record<PositionSlug, PositionCopy>, locale: Locale): Record<PositionSlug, PositionCopy> {
  const out = {} as Record<PositionSlug, PositionCopy>;
  for (const slug of Object.keys(copy) as PositionSlug[]) {
    const item = copy[slug];
    out[slug] = {
      summary: siteText(locale, item.summary),
      detail: siteText(locale, item.detail),
      looksFor: item.looksFor.map((line) => siteText(locale, line)),
    };
  }
  return out;
}

export function positionCopy(locale: Locale): Record<PositionSlug, PositionCopy> {
  if (locale === 'hi') return hi;
  if (locale === 'en') return en;
  return overlay(en, locale);
}
