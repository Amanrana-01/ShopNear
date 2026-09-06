import type { ProductSeed } from './products'

/**
 * Second demo-density catalogue top-up — NOT from the API seed.
 *
 * `products-extra.ts` brought every leaf category to eight products, which
 * fills a phone grid but leaves a desktop grid one tile short of a second
 * row, and leaves nothing to page. This file lifts every leaf to **ten or
 * more**, so a sub-category tap is never the thin end of the catalogue.
 *
 * Written in the same style as the transcribed seed: real SKUs a Navrangpura
 * kirana actually carries, MRPs in the right band for 2026 Ahmedabad, and
 * Hindi/Gujarati transliteration keywords so search finds them the way a
 * customer would type. Leaves already at ten or more (spices, biscuits,
 * namkeen, fresh vegetables) are deliberately absent.
 */
export const DEPTH_PRODUCT_SEED: ProductSeed[] = [
  // ── Groceries ─────────────────────────────────────────────────────────
  { name: 'Pillsbury Chakki Fresh Atta 5 kg', nameGu: 'પિલ્સબરી લોટ ૫ કિલો', brand: 'Pillsbury', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 280, searchKeywords: ['atta', 'aata', 'lot', 'ghau no lot', 'pillsbury'] },
  { name: 'Bajri Flour (loose)', nameGu: 'બાજરીનો લોટ', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['bajri', 'bajra', 'bajri no lot', 'millet flour'], isLooseGood: true },
  { name: 'Rajgira Atta 500 g', nameGu: 'રાજગરાનો લોટ ૫૦૦ ગ્રામ', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 95, searchKeywords: ['rajgira', 'rajgara', 'amaranth flour', 'farali lot'] },

  { name: 'Moong Dal (loose)', nameGu: 'મગ દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['moong dal', 'mag dal', 'green gram', 'dal'], isLooseGood: true },
  { name: 'Urad Dal Gota (loose)', nameGu: 'અડદ દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['urad dal', 'adad dal', 'black gram', 'dal'], isLooseGood: true },
  { name: 'Tata Sampann Toor Dal 1 kg', nameGu: 'ટાટા સંપન્ન તુવેર દાળ ૧ કિલો', brand: 'Tata Sampann', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 175, searchKeywords: ['toor dal', 'tuver dal', 'arhar', 'dal', 'tata sampann'] },

  { name: 'Daawat Rozana Basmati 5 kg', nameGu: 'દાવત બાસમતી ૫ કિલો', brand: 'Daawat', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 425, searchKeywords: ['basmati', 'rice', 'chokha', 'chawal', 'daawat'] },
  { name: 'Sona Masoori Rice (loose)', nameGu: 'સોના મસૂરી ચોખા', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sona masoori', 'rice', 'chokha', 'chawal'], isLooseGood: true },
  { name: 'India Gate Classic Basmati 1 kg', nameGu: 'ઇન્ડિયા ગેટ બાસમતી ૧ કિલો', brand: 'India Gate', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 210, searchKeywords: ['basmati', 'rice', 'chokha', 'india gate'] },

  { name: 'Saffola Gold Oil 1 L', nameGu: 'સફોલા ગોલ્ડ તેલ ૧ લિટર', brand: 'Saffola', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 210, searchKeywords: ['saffola', 'oil', 'tel', 'cooking oil'] },
  { name: 'Sundrop Heart Oil 1 L', nameGu: 'સનડ્રોપ તેલ ૧ લિટર', brand: 'Sundrop', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 195, searchKeywords: ['sundrop', 'oil', 'tel', 'sunflower oil'] },
  { name: 'Groundnut Oil (loose)', nameGu: 'સીંગ તેલ', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['singtel', 'sing tel', 'groundnut oil', 'peanut oil', 'tel'], isLooseGood: true },

  { name: 'Madhur Pure Sugar 1 kg', nameGu: 'મધુર ખાંડ ૧ કિલો', brand: 'Madhur', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 55, searchKeywords: ['sugar', 'khand', 'cheeni', 'madhur'] },
  { name: 'Gol Jaggery Block (loose)', nameGu: 'ગોળનું ઢેફું', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['gol', 'gud', 'jaggery', 'gol dhefu'], isLooseGood: true },
  { name: 'Mishri Rock Sugar 200 g', nameGu: 'મિશ્રી ૨૦૦ ગ્રામ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 60, searchKeywords: ['mishri', 'rock sugar', 'sakar', 'khadi sakar'] },

  // ── Dairy ─────────────────────────────────────────────────────────────
  { name: 'Amul Masti Dahi 400 g', nameGu: 'અમૂલ મસ્તી દહીં ૪૦૦ ગ્રામ', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 45, searchKeywords: ['dahi', 'curd', 'yogurt', 'amul dahi'] },
  { name: 'Mother Dairy Toned Milk 1 L', nameGu: 'મધર ડેરી દૂધ ૧ લિટર', brand: 'Mother Dairy', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 68, searchKeywords: ['milk', 'doodh', 'dudh', 'mother dairy'] },
  { name: 'Buttermilk Chaas (loose)', nameGu: 'છાશ', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['chaas', 'chhash', 'buttermilk', 'majjige'], isLooseGood: true },

  { name: 'Amul Cow Ghee 1 L', nameGu: 'અમૂલ ગાયનું ઘી ૧ લિટર', brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 640, searchKeywords: ['ghee', 'ghi', 'cow ghee', 'amul ghee'] },
  { name: 'Nutralite Table Spread 500 g', nameGu: 'ન્યુટ્રાલાઈટ સ્પ્રેડ ૫૦૦ ગ્રામ', brand: 'Nutralite', categorySlug: 'butter-ghee', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 210, searchKeywords: ['margarine', 'butter', 'makhan', 'nutralite', 'spread'] },
  { name: 'Sagar Pure Ghee 500 ml', nameGu: 'સાગર ઘી ૫૦૦ મિલી', brand: 'Sagar', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 330, searchKeywords: ['ghee', 'ghi', 'sagar ghee'] },

  { name: 'Amul Cheese Slices 200 g', nameGu: 'અમૂલ ચીઝ સ્લાઈસ ૨૦૦ ગ્રામ', brand: 'Amul', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 140, searchKeywords: ['cheese', 'cheese slice', 'amul cheese'] },
  { name: 'Paneer (loose)', nameGu: 'પનીર', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['paneer', 'cottage cheese', 'panir'], isLooseGood: true },
  { name: 'Britannia Cheese Cubes 200 g', nameGu: 'બ્રિટાનિયા ચીઝ ક્યુબ્સ', brand: 'Britannia', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 145, searchKeywords: ['cheese', 'cheese cube', 'britannia'] },

  // ── Bakery ────────────────────────────────────────────────────────────
  { name: 'Britannia Brown Bread 400 g', nameGu: 'બ્રિટાનિયા બ્રાઉન બ્રેડ', brand: 'Britannia', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 50, searchKeywords: ['bread', 'brown bread', 'pav', 'britannia'] },
  { name: 'Pav Buns 6 pc', nameGu: 'પાંઉ ૬ નંગ', categorySlug: 'bread-buns', unitType: 'PIECE', defaultUnitLabel: '6 pc', mrp: 30, searchKeywords: ['pav', 'pau', 'buns', 'ladi pav'] },
  { name: 'Modern Milk Bread 400 g', nameGu: 'મોર્ડન મિલ્ક બ્રેડ', brand: 'Modern', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 45, searchKeywords: ['bread', 'milk bread', 'modern bread'] },

  { name: 'Britannia Fruit Cake 250 g', nameGu: 'બ્રિટાનિયા ફ્રુટ કેક', brand: 'Britannia', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 60, searchKeywords: ['cake', 'fruit cake', 'britannia'] },
  { name: 'Elaichi Rusk 300 g', nameGu: 'ઈલાયચી ટોસ્ટ ૩૦૦ ગ્રામ', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 55, searchKeywords: ['rusk', 'toast', 'elaichi toast', 'khari'] },
  { name: 'Monginis Plum Cake 200 g', nameGu: 'મોંગિનીસ પ્લમ કેક', brand: 'Monginis', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 120, searchKeywords: ['cake', 'plum cake', 'monginis'] },

  // ── Personal care ─────────────────────────────────────────────────────
  { name: 'Santoor Sandal Soap 125 g', nameGu: 'સંતૂર સાબુ ૧૨૫ ગ્રામ', brand: 'Santoor', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 42, searchKeywords: ['soap', 'sabun', 'santoor', 'nahvano sabu'] },
  { name: 'Dove Cream Beauty Bar 100 g', nameGu: 'ડવ સાબુ ૧૦૦ ગ્રામ', brand: 'Dove', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 75, searchKeywords: ['soap', 'sabun', 'dove'] },
  { name: 'Medimix Ayurvedic Soap 125 g', nameGu: 'મેડિમિક્સ સાબુ', brand: 'Medimix', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 48, searchKeywords: ['soap', 'sabun', 'medimix', 'ayurvedic soap'] },

  { name: 'Clinic Plus Strong Shampoo 340 ml', nameGu: 'ક્લિનિક પ્લસ શેમ્પૂ', brand: 'Clinic Plus', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '340 ml', mrp: 199, searchKeywords: ['shampoo', 'clinic plus', 'vaal', 'hair'] },
  { name: 'Parachute Coconut Oil 200 ml', nameGu: 'પેરાશૂટ નાળિયેર તેલ', brand: 'Parachute', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '200 ml', mrp: 105, searchKeywords: ['hair oil', 'coconut oil', 'kopra tel', 'parachute'] },
  { name: 'Dabur Amla Hair Oil 275 ml', nameGu: 'ડાબર આમળા તેલ', brand: 'Dabur', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '275 ml', mrp: 145, searchKeywords: ['hair oil', 'amla', 'dabur', 'vaal nu tel'] },

  { name: 'Pepsodent Germicheck 150 g', nameGu: 'પેપ્સોડન્ટ ૧૫૦ ગ્રામ', brand: 'Pepsodent', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '150 g', mrp: 92, searchKeywords: ['toothpaste', 'manjan', 'pepsodent', 'datan'] },
  { name: 'Dabur Red Toothpaste 200 g', nameGu: 'ડાબર રેડ ટૂથપેસ્ટ', brand: 'Dabur', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 115, searchKeywords: ['toothpaste', 'manjan', 'dabur red'] },
  { name: 'Oral-B Toothbrush Medium', nameGu: 'ઓરલ-બી બ્રશ', brand: 'Oral-B', categorySlug: 'oral-care', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['toothbrush', 'brush', 'datan', 'oral b'] },

  // ── Household ─────────────────────────────────────────────────────────
  { name: 'Vim Dishwash Bar 300 g', nameGu: 'વિમ બાર ૩૦૦ ગ્રામ', brand: 'Vim', categorySlug: 'cleaning-supplies', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 30, searchKeywords: ['vim', 'dishwash', 'vasan dhovano sabu', 'bartan'] },
  { name: 'Harpic Bathroom Cleaner 500 ml', nameGu: 'હાર્પિક ૫૦૦ મિલી', brand: 'Harpic', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 99, searchKeywords: ['harpic', 'toilet cleaner', 'bathroom cleaner'] },
  { name: 'Colin Glass Cleaner 500 ml', nameGu: 'કોલિન ગ્લાસ ક્લીનર', brand: 'Colin', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 105, searchKeywords: ['colin', 'glass cleaner', 'kanch saaf'] },

  { name: 'Rin Detergent Bar 250 g', nameGu: 'રિન બાર ૨૫૦ ગ્રામ', brand: 'Rin', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 20, searchKeywords: ['rin', 'detergent', 'kapda dhovano sabu', 'washing bar'] },
  { name: 'Ariel Matic Front Load 1 kg', nameGu: 'એરિયલ મેટિક ૧ કિલો', brand: 'Ariel', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 285, searchKeywords: ['ariel', 'detergent', 'washing powder', 'matic'] },
  { name: 'Ujala Supreme Whitener 125 ml', nameGu: 'ઉજાલા ૧૨૫ મિલી', brand: 'Ujala', categorySlug: 'laundry', unitType: 'VOLUME', defaultUnitLabel: '125 ml', mrp: 45, searchKeywords: ['ujala', 'neel', 'whitener', 'blue'] },

  { name: 'Cycle Three-in-One Agarbatti 120 g', nameGu: 'સાયકલ અગરબત્તી', brand: 'Cycle', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '120 g', mrp: 85, searchKeywords: ['agarbatti', 'incense', 'dhup', 'cycle agarbatti'] },
  { name: 'Camphor Kapur 50 g', nameGu: 'કપૂર ૫૦ ગ્રામ', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 70, searchKeywords: ['kapur', 'camphor', 'karpur', 'pooja'] },
  { name: 'Cotton Wicks Divetti 100 pc', nameGu: 'દિવેટ ૧૦૦ નંગ', categorySlug: 'pooja-items', unitType: 'PIECE', defaultUnitLabel: '100 pc', mrp: 25, searchKeywords: ['divet', 'wick', 'batti', 'pooja', 'diva'] },

  // ── Beverages ─────────────────────────────────────────────────────────
  { name: 'Wagh Bakri Premium Tea 500 g', nameGu: 'વાઘ બકરી ચા ૫૦૦ ગ્રામ', brand: 'Wagh Bakri', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 285, searchKeywords: ['chai', 'tea', 'chha', 'wagh bakri'] },
  { name: 'Nescafe Classic Coffee 50 g', nameGu: 'નેસકેફે ક્લાસિક ૫૦ ગ્રામ', brand: 'Nescafe', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 190, searchKeywords: ['coffee', 'nescafe', 'kofi'] },
  { name: 'Bru Instant Coffee 100 g', nameGu: 'બ્રૂ કોફી ૧૦૦ ગ્રામ', brand: 'Bru', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 320, searchKeywords: ['coffee', 'bru', 'kofi'] },

  { name: 'Thums Up 750 ml', nameGu: 'થમ્સ અપ ૭૫૦ મિલી', brand: 'Thums Up', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['thums up', 'cold drink', 'thanda', 'soft drink'] },
  { name: 'Sprite 750 ml', nameGu: 'સ્પ્રાઈટ ૭૫૦ મિલી', brand: 'Sprite', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['sprite', 'cold drink', 'thanda', 'lemon drink'] },
  { name: 'Limca 600 ml', nameGu: 'લિમ્કા ૬૦૦ મિલી', brand: 'Limca', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '600 ml', mrp: 40, searchKeywords: ['limca', 'cold drink', 'thanda', 'nimbu'] },

  { name: 'Real Mixed Fruit Juice 1 L', nameGu: 'રિયલ જ્યુસ ૧ લિટર', brand: 'Real', categorySlug: 'juices-health-drinks', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 125, searchKeywords: ['juice', 'real', 'fruit juice', 'ras'] },
  { name: 'Bournvita 500 g', nameGu: 'બોર્નવિટા ૫૦૦ ગ્રામ', brand: 'Bournvita', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 245, searchKeywords: ['bournvita', 'health drink', 'malt', 'chocolate drink'] },
  { name: 'Horlicks Classic Malt 500 g', nameGu: 'હોર્લિક્સ ૫૦૦ ગ્રામ', brand: 'Horlicks', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 260, searchKeywords: ['horlicks', 'health drink', 'malt'] },

  // ── Snacks ────────────────────────────────────────────────────────────
  { name: 'Nestle KitKat 4 Finger 37.3 g', nameGu: 'કિટકેટ', brand: 'Nestle', categorySlug: 'chocolates-candy', unitType: 'WEIGHT', defaultUnitLabel: '37.3 g', mrp: 40, searchKeywords: ['kitkat', 'chocolate', 'chokleti'] },
  { name: 'Alpenliebe Candy Jar 100 pc', nameGu: 'આલ્પેનલિબે કેન્ડી', brand: 'Alpenliebe', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '100 pc', mrp: 100, searchKeywords: ['candy', 'alpenliebe', 'toffee', 'goli'] },
  { name: 'Amul Dark Chocolate 150 g', nameGu: 'અમૂલ ડાર્ક ચોકલેટ', brand: 'Amul', categorySlug: 'chocolates-candy', unitType: 'WEIGHT', defaultUnitLabel: '150 g', mrp: 145, searchKeywords: ['chocolate', 'dark chocolate', 'amul', 'chokleti'] },

  { name: 'Yippee Magic Masala Noodles 60 g', nameGu: 'યિપ્પી નૂડલ્સ', brand: 'Sunfeast', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '60 g', mrp: 15, searchKeywords: ['yippee', 'noodles', 'maggi', 'instant noodles'] },
  { name: 'Top Ramen Curry Noodles 70 g', nameGu: 'ટોપ રામેન નૂડલ્સ', brand: 'Top Ramen', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '70 g', mrp: 15, searchKeywords: ['top ramen', 'noodles', 'instant noodles'] },
  { name: 'Knorr Classic Tomato Soup 53 g', nameGu: 'નોર ટોમેટો સૂપ', brand: 'Knorr', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '53 g', mrp: 65, searchKeywords: ['soup', 'knorr', 'tomato soup'] },

  // ── Stationery ────────────────────────────────────────────────────────
  { name: 'Classmate Long Notebook 172 pages', nameGu: 'ક્લાસમેટ નોટબુક', brand: 'Classmate', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 60, searchKeywords: ['notebook', 'chopdi', 'classmate', 'note'] },
  { name: 'A4 Copier Paper 500 sheets', nameGu: 'એ૪ કાગળ ૫૦૦ શીટ', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '500 sheets', mrp: 340, searchKeywords: ['a4 paper', 'copier paper', 'kagal', 'print paper'] },
  { name: 'Chart Paper White 5 pc', nameGu: 'ચાર્ટ પેપર ૫ નંગ', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '5 pc', mrp: 50, searchKeywords: ['chart paper', 'kagal', 'project paper'] },

  { name: 'Reynolds 045 Ball Pen', nameGu: 'રેનોલ્ડ્સ પેન', brand: 'Reynolds', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 10, searchKeywords: ['pen', 'ball pen', 'reynolds'] },
  { name: 'Apsara Platinum Pencil 10 pc', nameGu: 'અપ્સરા પેન્સિલ ૧૦ નંગ', brand: 'Apsara', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '10 pc', mrp: 50, searchKeywords: ['pencil', 'apsara', 'pensil'] },
  { name: 'Cello Butterflow Pen 5 pc', nameGu: 'સેલો પેન ૫ નંગ', brand: 'Cello', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '5 pc', mrp: 50, searchKeywords: ['pen', 'cello', 'ball pen'] },

  { name: 'Camlin Wax Crayons 24 shades', nameGu: 'કેમલિન ક્રેયોન', brand: 'Camlin', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '24 shades', mrp: 90, searchKeywords: ['crayon', 'camlin', 'colour', 'rang'] },
  { name: 'Fevicol MR 200 g', nameGu: 'ફેવિકોલ ૨૦૦ ગ્રામ', brand: 'Fevicol', categorySlug: 'art-craft', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 75, searchKeywords: ['fevicol', 'glue', 'gum', 'adhesive'] },
  { name: 'Camel Poster Colour Set of 6', nameGu: 'કેમલ પોસ્ટર કલર', brand: 'Camel', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '6 pc', mrp: 130, searchKeywords: ['poster colour', 'camel', 'paint', 'rang'] },

  // ── Hardware ──────────────────────────────────────────────────────────
  { name: 'Taparia Screwdriver Set 6 pc', nameGu: 'ટપારિયા સ્ક્રૂડ્રાઈવર સેટ', brand: 'Taparia', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '6 pc', mrp: 340, searchKeywords: ['screwdriver', 'pechkas', 'taparia', 'tool'] },
  { name: 'Measuring Tape 5 m', nameGu: 'માપપટ્ટી ૫ મીટર', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 165, searchKeywords: ['measuring tape', 'tape', 'inch tape', 'mappatti'] },
  { name: 'Claw Hammer 500 g', nameGu: 'હથોડી ૫૦૦ ગ્રામ', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 280, searchKeywords: ['hammer', 'hathodi', 'tool'] },

  { name: 'Havells LED Bulb 9W', nameGu: 'હેવેલ્સ એલઈડી બલ્બ ૯ વોટ', brand: 'Havells', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 140, searchKeywords: ['bulb', 'led', 'havells', 'light'] },
  { name: 'Anchor 6A Switch', nameGu: 'એન્કર સ્વિચ ૬ એમ્પ', brand: 'Anchor', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['switch', 'anchor', 'button', 'electrical'] },
  { name: 'Finolex 1 sq mm Wire 90 m', nameGu: 'ફિનોલેક્સ વાયર ૯૦ મીટર', brand: 'Finolex', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '90 m', mrp: 1450, searchKeywords: ['wire', 'cable', 'finolex', 'electrical wire'] },

  { name: 'Asian Paints Tractor Emulsion 1 L', nameGu: 'એશિયન પેઈન્ટ્સ ૧ લિટર', brand: 'Asian Paints', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 320, searchKeywords: ['paint', 'rang', 'emulsion', 'asian paints'] },
  { name: 'Fevicryl Enamel Paint 200 ml', nameGu: 'ફેવિક્રિલ ઈનેમલ ૨૦૦ મિલી', brand: 'Fevicryl', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '200 ml', mrp: 145, searchKeywords: ['enamel', 'paint', 'rang', 'fevicryl'] },
  { name: 'Paint Brush 2 inch', nameGu: 'પેઈન્ટ બ્રશ ૨ ઈંચ', categorySlug: 'paints', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 85, searchKeywords: ['brush', 'paint brush', 'rang no brush'] },

  // ── Chemist ───────────────────────────────────────────────────────────
  { name: 'Crocin Advance 15 tablets', nameGu: 'ક્રોસિન ૧૫ ગોળી', brand: 'Crocin', categorySlug: 'otc-medicines', unitType: 'PIECE', defaultUnitLabel: '15 tablets', mrp: 30, searchKeywords: ['crocin', 'paracetamol', 'fever', 'tavni goli'] },
  { name: 'Digene Antacid 15 tablets', nameGu: 'ડાયજીન ૧૫ ગોળી', brand: 'Digene', categorySlug: 'otc-medicines', unitType: 'PIECE', defaultUnitLabel: '15 tablets', mrp: 45, searchKeywords: ['digene', 'antacid', 'acidity', 'gas'] },
  { name: 'Vicks Action 500 Advance 10 tablets', nameGu: 'વિક્સ એક્શન ૫૦૦', brand: 'Vicks', categorySlug: 'otc-medicines', unitType: 'PIECE', defaultUnitLabel: '10 tablets', mrp: 55, searchKeywords: ['vicks', 'cold', 'sardi', 'action 500'] },

  { name: 'Dettol Antiseptic Liquid 210 ml', nameGu: 'ડેટોલ ૨૧૦ મિલી', brand: 'Dettol', categorySlug: 'first-aid', unitType: 'VOLUME', defaultUnitLabel: '210 ml', mrp: 145, searchKeywords: ['dettol', 'antiseptic', 'jantunashak'] },
  { name: 'Band-Aid Washproof 20 pc', nameGu: 'બેન્ડ-એઈડ ૨૦ નંગ', brand: 'Band-Aid', categorySlug: 'first-aid', unitType: 'PIECE', defaultUnitLabel: '20 pc', mrp: 90, searchKeywords: ['band aid', 'bandage', 'patti', 'plaster'] },
  { name: 'Absorbent Cotton Roll 50 g', nameGu: 'રૂ ૫૦ ગ્રામ', categorySlug: 'first-aid', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 40, searchKeywords: ['cotton', 'ru', 'cotton roll', 'first aid'] },

  { name: "Johnson's Baby Powder 200 g", nameGu: 'જોન્સન બેબી પાવડર', brand: "Johnson's", categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 199, searchKeywords: ['baby powder', 'johnson', 'powder', 'balak'] },
  { name: 'Pampers Baby Dry Pants M 8 pc', nameGu: 'પેમ્પર્સ ડાયપર ૮ નંગ', brand: 'Pampers', categorySlug: 'baby-care', unitType: 'PIECE', defaultUnitLabel: '8 pc', mrp: 199, searchKeywords: ['diaper', 'pampers', 'nappy', 'balak'] },

  // ── Vegetables & fruit ────────────────────────────────────────────────
  { name: 'Banana Kela (loose)', nameGu: 'કેળાં', categorySlug: 'fresh-fruits', unitType: 'PIECE', defaultUnitLabel: 'per dozen', searchKeywords: ['banana', 'kela', 'kelan', 'fruit'], isLooseGood: true },
  { name: 'Apple Shimla (loose)', nameGu: 'સફરજન', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['apple', 'safarjan', 'seb', 'fruit'], isLooseGood: true },
  { name: 'Papaya Papaiya (loose)', nameGu: 'પપૈયું', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['papaya', 'papaiya', 'fruit'], isLooseGood: true },

  // ── Farsan ────────────────────────────────────────────────────────────
  { name: 'Methi Khakhra (loose)', nameGu: 'મેથી ખાખરા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['khakhra', 'khakra', 'methi khakhra', 'farsan'], isLooseGood: true },
  { name: 'Fafda (loose)', nameGu: 'ફાફડા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['fafda', 'farsan', 'gathiya'], isLooseGood: true },
  { name: 'Khaman Dhokla (loose)', nameGu: 'ખમણ ઢોકળા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['dhokla', 'khaman', 'farsan'], isLooseGood: true },

  { name: 'Mohanthal (loose)', nameGu: 'મોહનથાળ', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['mohanthal', 'mithai', 'sweet'], isLooseGood: true },
  { name: 'Basundi 500 ml', nameGu: 'બાસુંદી ૫૦૦ મિલી', categorySlug: 'sweets-mithai', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 160, searchKeywords: ['basundi', 'mithai', 'sweet', 'rabdi'] },
  { name: 'Mava Penda (loose)', nameGu: 'માવા પેંડા', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['penda', 'peda', 'mithai', 'mava'], isLooseGood: true },

  // ── Dry fruits ────────────────────────────────────────────────────────
  { name: 'Almonds Badam (loose)', nameGu: 'બદામ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['badam', 'almond', 'dry fruit', 'mevo'], isLooseGood: true },
  { name: 'Pistachio Pista (loose)', nameGu: 'પિસ્તા', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['pista', 'pistachio', 'dry fruit', 'mevo'], isLooseGood: true },
  { name: 'Walnut Akhrot (loose)', nameGu: 'અખરોટ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['akhrot', 'walnut', 'dry fruit', 'mevo'], isLooseGood: true },

  { name: 'Anjeer Dried Fig (loose)', nameGu: 'અંજીર', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['anjeer', 'fig', 'dry fruit', 'mevo'], isLooseGood: true },
  { name: 'Dates Khajur (loose)', nameGu: 'ખજૂર', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['khajur', 'dates', 'dry fruit', 'mevo'], isLooseGood: true },
  { name: 'Black Raisins (loose)', nameGu: 'કાળી દ્રાક્ષ', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kismis', 'raisin', 'draksh', 'dry fruit'], isLooseGood: true },

  // ── Breakfast ─────────────────────────────────────────────────────────
  { name: "Kellogg's Corn Flakes 475 g", nameGu: 'કેલોગ્સ કોર્ન ફ્લેક્સ', brand: "Kellogg's", categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '475 g', mrp: 285, searchKeywords: ['corn flakes', 'kelloggs', 'cereal', 'breakfast'] },
  { name: 'Quaker Oats 1 kg', nameGu: 'ક્વેકર ઓટ્સ ૧ કિલો', brand: 'Quaker', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 200, searchKeywords: ['oats', 'quaker', 'cereal', 'breakfast'] },
  { name: 'Saffola Masala Oats 500 g', nameGu: 'સફોલા મસાલા ઓટ્સ', brand: 'Saffola', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 175, searchKeywords: ['oats', 'masala oats', 'saffola', 'breakfast'] },

  { name: 'Kissan Mixed Fruit Jam 700 g', nameGu: 'કિસાન જામ ૭૦૦ ગ્રામ', brand: 'Kissan', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '700 g', mrp: 245, searchKeywords: ['jam', 'kissan', 'mixed fruit jam'] },
  { name: 'Sundrop Peanut Butter 462 g', nameGu: 'સનડ્રોપ પીનટ બટર', brand: 'Sundrop', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '462 g', mrp: 275, searchKeywords: ['peanut butter', 'sundrop', 'spread'] },
  { name: 'Nutella Hazelnut Spread 290 g', nameGu: 'નુટેલા સ્પ્રેડ', brand: 'Nutella', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '290 g', mrp: 425, searchKeywords: ['nutella', 'chocolate spread', 'spread'] },

  // ── Frozen ────────────────────────────────────────────────────────────
  { name: 'Amul Vanilla Ice Cream 1 L', nameGu: 'અમૂલ વેનિલા આઈસ્ક્રીમ', brand: 'Amul', categorySlug: 'ice-cream', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 220, searchKeywords: ['ice cream', 'vanilla', 'amul', 'aiskrim'] },
  { name: 'Kwality Walls Cornetto', nameGu: 'કોર્નેટો', brand: 'Kwality Walls', categorySlug: 'ice-cream', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['cornetto', 'ice cream', 'cone', 'aiskrim'] },
  { name: 'Havmor Rajwadi Kulfi 4 pc', nameGu: 'હેવમોર રાજવાડી કુલ્ફી', brand: 'Havmor', categorySlug: 'ice-cream', unitType: 'PIECE', defaultUnitLabel: '4 pc', mrp: 150, searchKeywords: ['kulfi', 'havmor', 'ice cream', 'rajwadi'] },

  { name: 'McCain French Fries 750 g', nameGu: 'મેકેઈન ફ્રેન્ચ ફ્રાઈસ', brand: 'McCain', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '750 g', mrp: 199, searchKeywords: ['french fries', 'mccain', 'frozen', 'fries'] },
  { name: 'Yummiez Veg Nuggets 400 g', nameGu: 'યમીઝ વેજ નગેટ્સ', brand: 'Godrej Yummiez', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 210, searchKeywords: ['nuggets', 'yummiez', 'frozen', 'veg nuggets'] },
  { name: 'Frozen Green Peas 500 g', nameGu: 'ફ્રોઝન લીલા વટાણા', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 95, searchKeywords: ['green peas', 'vatana', 'matar', 'frozen'] },

  // ── Home & kitchen ────────────────────────────────────────────────────
  { name: 'Prestige Non-stick Tawa 25 cm', nameGu: 'પ્રેસ્ટિજ તવો ૨૫ સેમી', brand: 'Prestige', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 745, searchKeywords: ['tawa', 'tavo', 'non stick', 'prestige'] },
  { name: 'Stainless Steel Kadai 2 L', nameGu: 'સ્ટીલ કડાઈ ૨ લિટર', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 620, searchKeywords: ['kadai', 'kadhai', 'steel kadai', 'vasan'] },
  { name: 'Pigeon Handy Chopper 900 ml', nameGu: 'પિજન ચોપર', brand: 'Pigeon', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 350, searchKeywords: ['chopper', 'pigeon', 'vegetable cutter'] },

  { name: 'Cello Steel Dabba Set 3 pc', nameGu: 'સેલો સ્ટીલ ડબ્બા સેટ', brand: 'Cello', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '3 pc', mrp: 690, searchKeywords: ['dabba', 'container', 'steel dabba', 'cello'] },
  { name: 'Milton Water Bottle 1 L', nameGu: 'મિલ્ટન બોટલ ૧ લિટર', brand: 'Milton', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 320, searchKeywords: ['bottle', 'water bottle', 'milton', 'botal'] },
  { name: 'Tupperware Storage Set 4 pc', nameGu: 'ટપરવેર સ્ટોરેજ સેટ', brand: 'Tupperware', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '4 pc', mrp: 850, searchKeywords: ['container', 'storage', 'tupperware', 'dabba'] },

  // ── Final top-up ──────────────────────────────────────────────────────
  // The thirteen leaves that were still under ten after the four seed files
  // were deduplicated against each other. Kept separate so it stays obvious
  // which entries exist to clear the density floor rather than because the
  // aisle was genuinely missing them.
  { name: 'Go Cheese Spread 200 g', nameGu: 'ગો ચીઝ સ્પ્રેડ', brand: 'Go', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 130, searchKeywords: ['cheese spread', 'go cheese', 'cheese'] },
  { name: 'Malai Paneer Cubes 200 g', nameGu: 'મલાઈ પનીર ક્યુબ્સ', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 105, searchKeywords: ['paneer', 'panir', 'malai paneer', 'cottage cheese'] },

  { name: 'Cinthol Original Soap 100 g', nameGu: 'સિન્થોલ સાબુ', brand: 'Cinthol', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 40, searchKeywords: ['soap', 'sabun', 'cinthol'] },
  { name: 'Pears Pure & Gentle 125 g', nameGu: 'પિયર્સ સાબુ', brand: 'Pears', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 85, searchKeywords: ['soap', 'sabun', 'pears'] },

  { name: 'Cashew Kaju W240 (loose)', nameGu: 'કાજુ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kaju', 'cashew', 'dry fruit', 'mevo'], isLooseGood: true },
  { name: 'Melon Seeds Magaj (loose)', nameGu: 'મગજતરી બી', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['magaj', 'melon seeds', 'magajtari', 'dry fruit'], isLooseGood: true },

  { name: 'Val Papdi Dal (loose)', nameGu: 'વાલ પાપડી દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['val', 'papdi', 'val dal', 'dal'], isLooseGood: true },
  { name: '24 Mantra Organic Whole Moong 500 g', nameGu: 'ઓર્ગેનિક આખા મગ', brand: '24 Mantra', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 120, searchKeywords: ['moong', 'mag', 'whole moong', 'organic dal'] },

  { name: 'Tirupati Cottonseed Oil 1 L', nameGu: 'તિરુપતિ કપાસિયા તેલ', brand: 'Tirupati', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 155, searchKeywords: ['kapasiya tel', 'cottonseed oil', 'tirupati', 'tel'] },
  { name: 'Coconut Copra Oil 500 ml', nameGu: 'કોપરેલ તેલ ૫૦૦ મિલી', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 190, searchKeywords: ['kopra tel', 'coconut oil', 'copra', 'tel'] },

  { name: 'Bura Sugar 500 g', nameGu: 'બૂરું ખાંડ ૫૦૦ ગ્રામ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 48, searchKeywords: ['bura', 'buru', 'powdered sugar', 'khand'] },
  { name: 'Kolhapuri Gud Jaggery 1 kg', nameGu: 'કોલ્હાપુરી ગોળ ૧ કિલો', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 90, searchKeywords: ['gol', 'gud', 'jaggery', 'kolhapuri gol'] },

  { name: 'Maaza Mango Drink 600 ml', nameGu: 'માઝા ૬૦૦ મિલી', brand: 'Maaza', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '600 ml', mrp: 40, searchKeywords: ['maaza', 'mango drink', 'thanda', 'cold drink'] },
  { name: 'Mountain Dew 750 ml', nameGu: 'માઉન્ટેન ડ્યુ ૭૫૦ મિલી', brand: 'Mountain Dew', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['mountain dew', 'cold drink', 'thanda', 'dew'] },

  { name: 'Maggi Cuppa Mania 70 g', nameGu: 'મેગી કપ્પા મેનિયા', brand: 'Maggi', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '70 g', mrp: 50, searchKeywords: ['maggi', 'cup noodles', 'cuppa', 'instant noodles'] },
  { name: "Ching's Schezwan Hakka Noodles 140 g", nameGu: 'ચિંગ્સ હક્કા નૂડલ્સ', brand: "Ching's", categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '140 g', mrp: 60, searchKeywords: ['chings', 'hakka noodles', 'schezwan', 'noodles'] },

  { name: 'Berger Easy Clean Emulsion 1 L', nameGu: 'બર્જર ઈઝી ક્લીન ૧ લિટર', brand: 'Berger', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 380, searchKeywords: ['paint', 'berger', 'emulsion', 'rang'] },
  { name: 'Wall Putty 5 kg', nameGu: 'વોલ પુટ્ટી ૫ કિલો', categorySlug: 'paints', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 470, searchKeywords: ['putty', 'wall putty', 'primer', 'rang'] },

  { name: 'Chiku Sapota (loose)', nameGu: 'ચીકુ', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['chiku', 'sapota', 'fruit'], isLooseGood: true },
  { name: 'Mosambi Sweet Lime (loose)', nameGu: 'મોસંબી', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['mosambi', 'sweet lime', 'fruit'], isLooseGood: true },

  { name: 'Patra (loose)', nameGu: 'પાત્રા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['patra', 'alu vadi', 'farsan'], isLooseGood: true },
  { name: 'Sev Khamani (loose)', nameGu: 'સેવ ખમણી', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sev khamani', 'khamani', 'farsan'], isLooseGood: true },

  { name: "Bagrry's Crunchy Muesli 500 g", nameGu: 'બેગ્રીઝ મ્યુસલી', brand: "Bagrry's", categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 380, searchKeywords: ['muesli', 'bagrrys', 'cereal', 'breakfast'] },
  { name: 'Wheat Daliya (loose)', nameGu: 'ઘઉંનો દલિયો', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['daliya', 'dalia', 'broken wheat', 'lapsi'], isLooseGood: true },

  { name: 'Tops Mixed Fruit Jam 500 g', nameGu: 'ટોપ્સ જામ ૫૦૦ ગ્રામ', brand: 'Tops', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 175, searchKeywords: ['jam', 'tops', 'mixed fruit jam'] },
  { name: 'Dabur Honey 250 g', nameGu: 'ડાબર મધ ૨૫૦ ગ્રામ', brand: 'Dabur', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 185, searchKeywords: ['honey', 'madh', 'dabur honey', 'shahad'] },

  { name: 'Godrej No.1 Sandal Soap 100 g', nameGu: 'ગોદરેજ નં.૧ સાબુ', brand: 'Godrej', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 35, searchKeywords: ['soap', 'sabun', 'godrej no 1', 'sandal soap'] },
  { name: 'Hamam Neem Soap 150 g', nameGu: 'હમામ લીમડા સાબુ', brand: 'Hamam', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '150 g', mrp: 55, searchKeywords: ['soap', 'sabun', 'hamam', 'neem soap'] },

  { name: 'Fanta Orange 750 ml', nameGu: 'ફેન્ટા ૭૫૦ મિલી', brand: 'Fanta', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['fanta', 'orange drink', 'cold drink', 'thanda'] },
  { name: '7Up Lemon 750 ml', nameGu: 'સેવન અપ ૭૫૦ મિલી', brand: '7Up', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['7up', 'seven up', 'lemon drink', 'cold drink'] },

  { name: 'Amul Chocolate Spread 400 g', nameGu: 'અમૂલ ચોકલેટ સ્પ્રેડ', brand: 'Amul', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 210, searchKeywords: ['chocolate spread', 'amul', 'spread'] },
  { name: 'Mapro Strawberry Crush 1 L', nameGu: 'મેપ્રો સ્ટ્રોબેરી ક્રશ', brand: 'Mapro', categorySlug: 'jams-spreads', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 265, searchKeywords: ['crush', 'mapro', 'syrup', 'strawberry'] },
]
