import type { Product, UnitType } from '@shopnear/shared'
import { slugToId, placeholderSvgDataUri } from './helpers'
import { hueForCategorySlug } from './categories'

/** Names, brands, MRPs and searchKeywords below are transcribed from the
 * real seed at apps/api/prisma/seed/data/products.ts (read-only reference —
 * that app is untouched) so the demo catalogue looks and searches like the
 * genuine ~342-product dataset. A handful of items per category that weren't
 * sampled from the real file are written in the same authentic style to
 * round out the assortment. */
interface ProductSeed {
  name: string; nameGu: string; brand?: string; categorySlug: string
  unitType: UnitType; defaultUnitLabel: string; mrp?: number
  searchKeywords: string[]; isLooseGood?: boolean
}

const P: ProductSeed[] = [
  // Flours & Grains
  { name: 'Aashirvaad Superior MP Atta 5 kg', nameGu: 'આશીર્વાદ લોટ ૫ કિલો', brand: 'Aashirvaad', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 285, searchKeywords: ['atta', 'aata', 'ata', 'lot', 'ghau no lot', 'wheat flour', 'aashirvaad'] },
  { name: 'Fortune Chakki Fresh Atta 5 kg', nameGu: 'ફોર્ચ્યુન લોટ ૫ કિલો', brand: 'Fortune', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 265, searchKeywords: ['atta', 'aata', 'lot', 'ghau no lot', 'fortune atta'] },
  { name: 'Wheat Flour (loose)', nameGu: 'ઘઉંનો લોટ', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['atta', 'aata', 'lot', 'ghau no lot', 'wheat flour'], isLooseGood: true },
  { name: 'Rajdhani Besan 1 kg', nameGu: 'રાજધાની બેસન ૧ કિલો', brand: 'Rajdhani', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 110, searchKeywords: ['besan', 'chana no lot', 'gram flour'] },
  { name: 'Maida (loose)', nameGu: 'મેંદો', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['maida', 'maido', 'refined flour'], isLooseGood: true },
  { name: 'Suji Rava 1 kg', nameGu: 'સૂજી રવો ૧ કિલો', brand: 'Gits', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 55, searchKeywords: ['suji', 'rava', 'sooji', 'ravo'] },
  { name: 'Bajra Flour (loose)', nameGu: 'બાજરીનો લોટ', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['bajra', 'bajri', 'pearl millet flour'], isLooseGood: true },
  { name: 'Jowar Flour (loose)', nameGu: 'જુવારનો લોટ', categorySlug: 'flours-grains', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['jowar', 'juvar', 'sorghum flour'], isLooseGood: true },

  // Pulses & Dals
  { name: 'Toor Dal (loose)', nameGu: 'તુવેર દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['toor dal', 'tuver dal', 'tuvar', 'arhar dal', 'dal'], isLooseGood: true },
  { name: 'Chana Dal (loose)', nameGu: 'ચણાની દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['chana dal', 'split chickpea', 'bengal gram'], isLooseGood: true },
  { name: 'Moong Dal (loose)', nameGu: 'મગની દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['moong dal', 'mag ni dal', 'mung dal'], isLooseGood: true },
  { name: 'Tata Sampann Toor Dal 1 kg', nameGu: 'ટાટા સંપન્ન તુવેર દાળ', brand: 'Tata', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 165, searchKeywords: ['toor dal', 'tuver dal', 'tata sampann'] },
  { name: 'Masoor Dal (loose)', nameGu: 'મસૂરની દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['masoor dal', 'red lentil'], isLooseGood: true },
  { name: 'Urad Dal (loose)', nameGu: 'અડદની દાળ', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['urad dal', 'black gram'], isLooseGood: true },

  // Rice
  { name: 'India Gate Basmati Rice 5 kg', nameGu: 'ઇન્ડિયા ગેટ બાસમતી ચોખા', brand: 'India Gate', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 650, searchKeywords: ['basmati rice', 'chokha', 'chawal'] },
  { name: 'Daawat Basmati Rice 1 kg', nameGu: 'દાવત બાસમતી ચોખા', brand: 'Daawat', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 145, searchKeywords: ['basmati rice', 'chawal', 'daawat'] },
  { name: 'Basmati Rice Premium 5 kg', nameGu: 'કોહિનૂર બાસમતી ચોખા', brand: 'Kohinoor', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 590, searchKeywords: ['basmati rice', 'chawal', 'kohinoor'] },
  { name: 'Sona Masoori Rice (loose)', nameGu: 'સોના મસૂરી ચોખા', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sona masoori', 'chawal', 'rice loose'], isLooseGood: true },

  // Edible oils
  { name: 'Fortune Sunflower Oil 1 L', nameGu: 'ફોર્ચ્યુન સનફ્લાવર તેલ', brand: 'Fortune', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 165, searchKeywords: ['sunflower oil', 'tel', 'suryamukhi tel'] },
  { name: 'Gemini Sunflower Oil 1 L', nameGu: 'જેમિની સનફ્લાવર તેલ', brand: 'Gemini', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 160, searchKeywords: ['sunflower oil', 'tel'] },
  { name: 'Saffola Gold Oil 1 L', nameGu: 'સેફોલા ગોલ્ડ તેલ', brand: 'Saffola', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 195, searchKeywords: ['saffola', 'tel', 'cooking oil'] },
  { name: 'Groundnut Oil (loose)', nameGu: 'સીંગતેલ', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['singtel', 'groundnut oil', 'peanut oil'], isLooseGood: true },

  // Spices & masala
  { name: 'Tata Salt 1 kg', nameGu: 'ટાટા મીઠું ૧ કિલો', brand: 'Tata', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 28, searchKeywords: ['namak', 'mithu', 'salt', 'tata salt'] },
  { name: 'Everest Turmeric Powder 200 g', nameGu: 'એવરેસ્ટ હળદર પાવડર', brand: 'Everest', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 55, searchKeywords: ['haldi', 'haldar', 'turmeric powder'] },
  { name: 'MDH Red Chilli Powder 200 g', nameGu: 'એમડીએચ લાલ મરચું પાવડર', brand: 'MDH', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 65, searchKeywords: ['mirch powder', 'lal marchu', 'red chilli powder'] },
  { name: 'Everest Coriander Powder 200 g', nameGu: 'એવરેસ્ટ ધાણા પાવડર', brand: 'Everest', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 50, searchKeywords: ['dhaniya powder', 'coriander powder'] },
  { name: 'MDH Garam Masala 100 g', nameGu: 'એમડીએચ ગરમ મસાલા', brand: 'MDH', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 75, searchKeywords: ['garam masala', 'masala'] },
  { name: 'Everest Kitchen King Masala 100 g', nameGu: 'એવરેસ્ટ કિચન કિંગ મસાલા', brand: 'Everest', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 68, searchKeywords: ['kitchen king masala', 'masala'] },
  { name: 'Cumin Seeds Jeera (loose)', nameGu: 'જીરું', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['jeeru', 'jeera', 'cumin seeds'], isLooseGood: true },
  { name: 'MDH Chana Masala 100 g', nameGu: 'એમડીએચ ચણા મસાલા', brand: 'MDH', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 60, searchKeywords: ['chana masala', 'chole masala'] },
  { name: 'Badshah Biryani Masala 100 g', nameGu: 'બાદશાહ બિરયાની મસાલા', brand: 'Badshah', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 62, searchKeywords: ['biryani masala', 'masala'] },
  { name: 'Curry Leaves (loose)', nameGu: 'મીઠો લીમડો', categorySlug: 'spices-masala', unitType: 'WEIGHT', defaultUnitLabel: 'per 100 g', searchKeywords: ['mitho limdo', 'curry leaves'], isLooseGood: true },

  // Sugar & jaggery
  { name: 'Madhur Pure Sugar 1 kg', nameGu: 'મધુર ખાંડ ૧ કિલો', brand: 'Madhur', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 48, searchKeywords: ['khand', 'sugar', 'cheeni'] },
  { name: 'Jaggery Gol (loose)', nameGu: 'ગોળ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['gol', 'gud', 'jaggery'], isLooseGood: true },

  // Milk & curd
  { name: 'Amul Gold Milk 500 ml', nameGu: 'અમૂલ ગોલ્ડ દૂધ', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 33, searchKeywords: ['doodh', 'dudh', 'milk', 'amul gold'] },
  { name: 'Amul Taaza Milk 500 ml', nameGu: 'અમૂલ તાજા દૂધ', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 27, searchKeywords: ['doodh', 'dudh', 'milk', 'taaza'] },
  { name: 'Amul Curd 400 g', nameGu: 'અમૂલ દહીં', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 45, searchKeywords: ['dahi', 'curd', 'yogurt'] },
  { name: 'Amul Buttermilk Chaas 200 ml', nameGu: 'અમૂલ છાશ', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: '200 ml', mrp: 15, searchKeywords: ['chaas', 'chhash', 'buttermilk'] },
  { name: 'Milk (loose)', nameGu: 'છૂટક દૂધ', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['doodh', 'dudh', 'milk loose'], isLooseGood: true },
  { name: 'Nandini Milk 500 ml', nameGu: 'નંદિની દૂધ', brand: 'Nandini', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 26, searchKeywords: ['doodh', 'dudh', 'milk'] },

  // Butter, ghee, cheese, paneer
  { name: 'Amul Butter 500 g', nameGu: 'અમૂલ માખણ ૫૦૦ ગ્રામ', brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 285, searchKeywords: ['butter', 'makhan', 'amul butter'] },
  { name: 'Amul Pure Ghee 1 L', nameGu: 'અમૂલ ઘી ૧ લિટર', brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 620, searchKeywords: ['ghee', 'ghi', 'amul ghee'] },
  { name: 'Amul Cheese Slices 200 g', nameGu: 'અમૂલ ચીઝ સ્લાઈસ', brand: 'Amul', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 125, searchKeywords: ['cheese', 'cheese slices'] },
  { name: 'Amul Paneer 200 g', nameGu: 'અમૂલ પનીર', brand: 'Amul', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 95, searchKeywords: ['paneer', 'cottage cheese'] },

  // Bakery
  { name: 'Britannia White Bread 400 g', nameGu: 'બ્રિટાનિયા વ્હાઇટ બ્રેડ', brand: 'Britannia', categorySlug: 'bread-buns', unitType: 'PIECE', defaultUnitLabel: '400 g', mrp: 45, searchKeywords: ['bread', 'pav', 'double roti'] },
  { name: 'Modern Brown Bread 400 g', nameGu: 'મોડર્ન બ્રાઉન બ્રેડ', brand: 'Modern', categorySlug: 'bread-buns', unitType: 'PIECE', defaultUnitLabel: '400 g', mrp: 50, searchKeywords: ['brown bread', 'pav'] },
  { name: 'Pav Buns 6 pc', nameGu: 'પાવ', categorySlug: 'bread-buns', unitType: 'PACK', defaultUnitLabel: '6 pc', mrp: 30, searchKeywords: ['pav', 'buns', 'ladi pav'] },
  { name: 'Parle-G Biscuits 200 g', nameGu: 'પારલે-જી બિસ્કીટ', brand: 'Parle', categorySlug: 'biscuits-cookies', unitType: 'PACK', defaultUnitLabel: '200 g', mrp: 20, searchKeywords: ['parle g', 'biscuit', 'glucose biscuit'] },
  { name: "Britannia Good Day Cashew 200 g", nameGu: 'બ્રિટાનિયા ગુડ ડે', brand: 'Britannia', categorySlug: 'biscuits-cookies', unitType: 'PACK', defaultUnitLabel: '200 g', mrp: 40, searchKeywords: ['good day', 'biscuit'] },
  { name: 'Britannia Marie Gold 250 g', nameGu: 'બ્રિટાનિયા મેરી ગોલ્ડ', brand: 'Britannia', categorySlug: 'biscuits-cookies', unitType: 'PACK', defaultUnitLabel: '250 g', mrp: 45, searchKeywords: ['marie biscuit', 'tea biscuit'] },
  { name: "Parle Hide & Seek 120 g", nameGu: 'પારલે હાઈડ એન્ડ સીક', brand: 'Parle', categorySlug: 'biscuits-cookies', unitType: 'PACK', defaultUnitLabel: '120 g', mrp: 35, searchKeywords: ['hide and seek', 'chocolate chip biscuit'] },
  { name: 'Britannia Bourbon 150 g', nameGu: 'બ્રિટાનિયા બોર્બોન', brand: 'Britannia', categorySlug: 'biscuits-cookies', unitType: 'PACK', defaultUnitLabel: '150 g', mrp: 35, searchKeywords: ['bourbon biscuit', 'chocolate biscuit'] },
  { name: 'Britannia Rusk 200 g', nameGu: 'બ્રિટાનિયા ટોસ્ટ', brand: 'Britannia', categorySlug: 'cakes-rusks', unitType: 'PACK', defaultUnitLabel: '200 g', mrp: 40, searchKeywords: ['rusk', 'toast', 'tost'] },
  { name: 'Britannia Fruit Cake 250 g', nameGu: 'બ્રિટાનિયા ફ્રૂટ કેક', brand: 'Britannia', categorySlug: 'cakes-rusks', unitType: 'PACK', defaultUnitLabel: '250 g', mrp: 85, searchKeywords: ['fruit cake', 'cake'] },

  // Personal care
  { name: 'Nirma Bath Soap 100 g', nameGu: 'નિરમા સાબુ', brand: 'Nirma', categorySlug: 'bath-soap', unitType: 'PIECE', defaultUnitLabel: '100 g', mrp: 22, searchKeywords: ['sabun', 'soap', 'nirma'] },
  { name: 'Lifebuoy Soap 125 g', nameGu: 'લાઈફબોય સાબુ', brand: 'Lifebuoy', categorySlug: 'bath-soap', unitType: 'PIECE', defaultUnitLabel: '125 g', mrp: 38, searchKeywords: ['sabun', 'soap', 'lifebuoy'] },
  { name: 'Dove Cream Beauty Bar 100 g', nameGu: 'ડવ સાબુ', brand: 'Dove', categorySlug: 'bath-soap', unitType: 'PIECE', defaultUnitLabel: '100 g', mrp: 65, searchKeywords: ['sabun', 'soap', 'dove'] },
  { name: 'Clinic Plus Shampoo 175 ml', nameGu: 'ક્લિનિક પ્લસ શેમ્પૂ', brand: 'Clinic Plus', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '175 ml', mrp: 95, searchKeywords: ['shampoo', 'clinic plus'] },
  { name: 'Head & Shoulders Shampoo 180 ml', nameGu: 'હેડ એન્ડ શોલ્ડર્સ', brand: 'Head & Shoulders', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '180 ml', mrp: 175, searchKeywords: ['shampoo', 'anti dandruff'] },
  { name: 'Parachute Coconut Oil 250 ml', nameGu: 'પેરાશૂટ નાળિયેર તેલ', brand: 'Parachute', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '250 ml', mrp: 115, searchKeywords: ['coconut oil', 'hair oil', 'nariyal tel'] },
  { name: 'Colgate Strong Teeth Toothpaste 200 g', nameGu: 'કોલગેટ ટૂથપેસ્ટ', brand: 'Colgate', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 105, searchKeywords: ['toothpaste', 'colgate', 'dant manjan'] },
  { name: 'Colgate Toothbrush', nameGu: 'કોલગેટ ટૂથબ્રશ', brand: 'Colgate', categorySlug: 'oral-care', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 35, searchKeywords: ['toothbrush', 'brush'] },
  { name: 'Colgate Dental Floss', nameGu: 'કોલગેટ ડેન્ટલ ફ્લોસ', brand: 'Colgate', categorySlug: 'oral-care', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 60, searchKeywords: ['dental floss', 'floss'] },

  // Household
  { name: 'Harpic Toilet Cleaner 500 ml', nameGu: 'હાર્પિક', brand: 'Harpic', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 99, searchKeywords: ['harpic', 'toilet cleaner'] },
  { name: 'Vim Dishwash Bar 200 g', nameGu: 'વિમ બાર', brand: 'Vim', categorySlug: 'cleaning-supplies', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 20, searchKeywords: ['vim', 'dishwash bar', 'bartan sabun'] },
  { name: 'Lizol Floor Cleaner 500 ml', nameGu: 'લિઝોલ', brand: 'Lizol', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 130, searchKeywords: ['lizol', 'floor cleaner'] },
  { name: 'Colin Glass Cleaner 500 ml', nameGu: 'કોલિન', brand: 'Colin', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 95, searchKeywords: ['colin', 'glass cleaner'] },
  { name: 'Surf Excel Easy Wash 1 kg', nameGu: 'સર્ફ એક્સેલ ડિટર્જન્ટ', brand: 'Surf Excel', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 140, searchKeywords: ['surf', 'detergent powder', 'kapda dho'] },
  { name: 'Nirma Washing Powder 1 kg', nameGu: 'નિરમા વોશિંગ પાવડર', brand: 'Nirma', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 75, searchKeywords: ['nirma', 'detergent powder'] },
  { name: 'Wheel Detergent Powder 1 kg', nameGu: 'વ્હીલ ડિટર્જન્ટ પાવડર', brand: 'Wheel', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 65, searchKeywords: ['wheel', 'detergent powder'] },
  { name: 'Tide Detergent Powder 1 kg', nameGu: 'ટાઈડ ડિટર્જન્ટ પાવડર', brand: 'Tide', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 150, searchKeywords: ['tide', 'detergent powder'] },
  { name: 'Cycle Agarbatti 100 g', nameGu: 'સાયકલ અગરબત્તી', brand: 'Cycle', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 45, searchKeywords: ['agarbatti', 'dhoop dandi', 'incense sticks'] },
  { name: 'Camphor Kapoor 50 g', nameGu: 'કપૂર ૫૦ ગ્રામ', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 40, searchKeywords: ['kapoor', 'camphor'] },
  { name: 'Cotton Wick Batti', nameGu: 'દિવા બત્તી', categorySlug: 'pooja-items', unitType: 'PACK', defaultUnitLabel: '1 pack', mrp: 25, searchKeywords: ['diva batti', 'cotton wick'] },
  { name: 'Havan Samagri 200 g', nameGu: 'હવન સામગ્રી', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 80, searchKeywords: ['havan samagri', 'hom samagri'] },
  { name: 'Puja Thali Set', nameGu: 'પૂજા થાળી સેટ', categorySlug: 'pooja-items', unitType: 'PIECE', defaultUnitLabel: '1 set', mrp: 250, searchKeywords: ['puja thali', 'pooja ni thali'] },

  // Beverages
  { name: 'Tata Tea Gold 250 g', nameGu: 'ટાટા ટી ગોલ્ડ', brand: 'Tata', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 140, searchKeywords: ['chai', 'cha', 'tea', 'tata tea'] },
  { name: 'Wagh Bakri Tea 250 g', nameGu: 'વાઘ બકરી ચા', brand: 'Wagh Bakri', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 130, searchKeywords: ['chai', 'cha', 'tea', 'wagh bakri'] },
  { name: 'Red Label Tea 250 g', nameGu: 'રેડ લેબલ ચા', brand: 'Brooke Bond', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 125, searchKeywords: ['chai', 'cha', 'tea', 'red label'] },
  { name: 'Nescafe Classic Coffee 50 g', nameGu: 'નેસ્કેફે કોફી', brand: 'Nescafe', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 165, searchKeywords: ['coffee', 'kafi', 'nescafe'] },
  { name: 'Bru Instant Coffee 50 g', nameGu: 'બ્રૂ કોફી', brand: 'Bru', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 145, searchKeywords: ['coffee', 'kafi', 'bru'] },
  { name: 'Society Tea 250 g', nameGu: 'સોસાયટી ચા', brand: 'Society', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 120, searchKeywords: ['chai', 'cha', 'tea', 'society tea'] },
  { name: 'Coca-Cola 750 ml', nameGu: 'કોકા-કોલા', brand: 'Coca-Cola', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 40, searchKeywords: ['coke', 'cold drink', 'thanda'] },
  { name: 'Thums Up 750 ml', nameGu: 'થમ્સ અપ', brand: 'Thums Up', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 40, searchKeywords: ['thums up', 'cold drink', 'thanda'] },
  { name: 'Sprite 750 ml', nameGu: 'સ્પ્રાઈટ', brand: 'Sprite', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 40, searchKeywords: ['sprite', 'cold drink'] },
  { name: 'Limca 750 ml', nameGu: 'લિમ્કા', brand: 'Limca', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 40, searchKeywords: ['limca', 'cold drink'] },
  { name: 'Maaza Mango Drink 600 ml', nameGu: 'માઝા', brand: 'Maaza', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '600 ml', mrp: 40, searchKeywords: ['maaza', 'aam ras', 'mango drink'] },
  { name: 'Bisleri Soda 750 ml', nameGu: 'બિસલેરી સોડા', brand: 'Bisleri', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 25, searchKeywords: ['soda', 'club soda'] },
  { name: 'Real Fruit Juice Mixed Fruit 1 L', nameGu: 'રિયલ ફ્રૂટ જ્યુસ', brand: 'Real', categorySlug: 'juices-health-drinks', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 120, searchKeywords: ['juice', 'ras', 'real juice'] },
  { name: 'Tropicana Orange Juice 1 L', nameGu: 'ટ્રોપિકાના ઓરેન્જ જ્યુસ', brand: 'Tropicana', categorySlug: 'juices-health-drinks', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 130, searchKeywords: ['juice', 'orange juice'] },
  { name: 'Frooti Mango Drink 200 ml', nameGu: 'ફ્રુટી', brand: 'Frooti', categorySlug: 'juices-health-drinks', unitType: 'VOLUME', defaultUnitLabel: '200 ml', mrp: 20, searchKeywords: ['frooti', 'mango drink', 'aam ras'] },
  { name: 'Horlicks Health Drink 500 g', nameGu: 'હોર્લિક્સ', brand: 'Horlicks', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 240, searchKeywords: ['horlicks', 'health drink'] },
  { name: 'Bournvita Health Drink 500 g', nameGu: 'બોર્નવીટા', brand: 'Bournvita', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 230, searchKeywords: ['bournvita', 'health drink', 'chocolate drink'] },

  // Snacks
  { name: "Lay's Classic Salted 52 g", nameGu: 'લેઝ ચિપ્સ', brand: "Lay's", categorySlug: 'namkeen-chips', unitType: 'PACK', defaultUnitLabel: '52 g', mrp: 20, searchKeywords: ['chips', 'lays', 'batata chips'] },
  { name: "Haldiram's Aloo Bhujia 200 g", nameGu: 'હલદીરામ આલૂ ભુજિયા', brand: "Haldiram's", categorySlug: 'namkeen-chips', unitType: 'PACK', defaultUnitLabel: '200 g', mrp: 55, searchKeywords: ['bhujia', 'aloo bhujia', 'namkeen'] },
  { name: 'Bikaji Bhujia 200 g', nameGu: 'બિકાજી ભુજિયા', brand: 'Bikaji', categorySlug: 'namkeen-chips', unitType: 'PACK', defaultUnitLabel: '200 g', mrp: 58, searchKeywords: ['bhujia', 'namkeen', 'bikaji'] },
  { name: 'Kurkure Masala Munch 90 g', nameGu: 'કુરકુરે', brand: 'Kurkure', categorySlug: 'namkeen-chips', unitType: 'PACK', defaultUnitLabel: '90 g', mrp: 20, searchKeywords: ['kurkure', 'chips', 'namkeen'] },
  { name: 'Balaji Wafers 150 g', nameGu: 'બાલાજી વેફર', brand: 'Balaji', categorySlug: 'namkeen-chips', unitType: 'PACK', defaultUnitLabel: '150 g', mrp: 30, searchKeywords: ['wafers', 'chips', 'balaji'] },
  { name: 'Mixture Namkeen (loose)', nameGu: 'મિક્સ્ચર નમકીન', categorySlug: 'namkeen-chips', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['mixture', 'namkeen loose'], isLooseGood: true },
  { name: 'Cadbury Dairy Milk 55 g', nameGu: 'કેડબરી ડેરી મિલ્ક', brand: 'Cadbury', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '55 g', mrp: 45, searchKeywords: ['chocolate', 'dairy milk', 'cadbury'] },
  { name: 'Nestle Kit Kat 4 Finger', nameGu: 'કીટ કેટ', brand: 'Nestle', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['kit kat', 'chocolate'] },
  { name: 'Amul Dark Chocolate 40 g', nameGu: 'અમૂલ ડાર્ક ચોકલેટ', brand: 'Amul', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '40 g', mrp: 60, searchKeywords: ['chocolate', 'amul chocolate'] },
  { name: 'Cadbury 5 Star 1 pc', nameGu: 'કેડબરી ફાઈવ સ્ટાર', brand: 'Cadbury', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 10, searchKeywords: ['5 star', 'chocolate', 'toffee'] },
  { name: 'Mentos Mint 1 pc', nameGu: 'મેન્ટોસ', brand: 'Mentos', categorySlug: 'chocolates-candy', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 10, searchKeywords: ['mentos', 'candy', 'mint'] },
  { name: 'Maggi 2-Minute Noodles 70 g', nameGu: 'મેગી નૂડલ્સ', brand: 'Maggi', categorySlug: 'instant-noodles', unitType: 'PACK', defaultUnitLabel: '70 g', mrp: 14, searchKeywords: ['maggi', 'noodles', 'magi'] },
  { name: 'Maggi Masala Oats 72 g', nameGu: 'મેગી મસાલા ઓટ્સ', brand: 'Maggi', categorySlug: 'instant-noodles', unitType: 'PACK', defaultUnitLabel: '72 g', mrp: 40, searchKeywords: ['oats', 'maggi oats', 'masala oats'] },

  // Stationery
  { name: 'Classmate Notebook 172 pg Single Line', nameGu: 'ક્લાસમેટ નોટબુક', brand: 'Classmate', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['notebook', 'chopdi', 'vahi'] },
  { name: 'Navneet Notebook 200 pg', nameGu: 'નવનીત નોટબુક', brand: 'Navneet', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 55, searchKeywords: ['notebook', 'navneet chopdi'] },
  { name: 'A4 Ruled Paper 100 sheets', nameGu: 'એ૪ કાગળ', brand: 'JK', categorySlug: 'notebooks-paper', unitType: 'PACK', defaultUnitLabel: '100 sheets', mrp: 90, searchKeywords: ['paper', 'a4 paper', 'kagad'] },
  { name: 'Long Book Register 172 pg', nameGu: 'લોંગ બુક રજિસ્ટર', brand: 'Classmate', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 65, searchKeywords: ['long book', 'register', 'vahi'] },
  { name: 'Drawing Book', nameGu: 'ડ્રોઈંગ બુક', brand: 'Navneet', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 35, searchKeywords: ['drawing book', 'chitra chopdi'] },
  { name: 'Reynolds Jetter Ball Pen', nameGu: 'રેનોલ્ડ્સ પેન', brand: 'Reynolds', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 10, searchKeywords: ['pen', 'ball pen', 'reynolds'] },
  { name: 'Cello Butterflow Pen', nameGu: 'સેલો પેન', brand: 'Cello', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 10, searchKeywords: ['pen', 'ball pen', 'cello'] },
  { name: 'Natraj Pencil HB', nameGu: 'નટરાજ પેન્સિલ', brand: 'Natraj', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 5, searchKeywords: ['pencil', 'natraj pencil'] },
  { name: 'Nataraj Eraser', nameGu: 'રબર', brand: 'Natraj', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 3, searchKeywords: ['eraser', 'rubber'] },
  { name: 'Camlin Geometry Box', nameGu: 'કેમલિન ભૂમિતિ બોક્સ', brand: 'Camlin', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 55, searchKeywords: ['geometry box', 'compass box'] },
  { name: 'Flair Gel Pen Blue', nameGu: 'ફ્લેર જેલ પેન', brand: 'Flair', categorySlug: 'pens-pencils', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 15, searchKeywords: ['gel pen', 'flair pen'] },
  { name: 'Camlin Wax Crayons 12 Shades', nameGu: 'કેમલિન ક્રેયોન્સ', brand: 'Camlin', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 pack', mrp: 40, searchKeywords: ['crayons', 'wax crayons'] },
  { name: 'Camlin Oil Pastels 25 Shades', nameGu: 'કેમલિન ઓઈલ પેસ્ટલ', brand: 'Camlin', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 pack', mrp: 90, searchKeywords: ['oil pastels', 'pastels'] },
  { name: 'Fevicol Glue Stick', nameGu: 'ફેવિકોલ ગ્લુ સ્ટિક', brand: 'Fevicol', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 20, searchKeywords: ['glue', 'fevicol', 'gum stick'] },
  { name: 'Camel Water Colour Box', nameGu: 'વોટર કલર બોક્સ', brand: 'Camlin', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 pack', mrp: 65, searchKeywords: ['water colour', 'paint box'] },
  { name: 'Craft Scissors', nameGu: 'કાતર', brand: 'Kangaro', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 30, searchKeywords: ['scissors', 'kaichi', 'kainchi'] },

  // Hardware
  { name: 'Taparia Combination Plier 8 inch', nameGu: 'તાપરિયા પ્લાયર', brand: 'Taparia', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 180, searchKeywords: ['plier', 'pakkad'] },
  { name: 'Stanley Claw Hammer', nameGu: 'સ્ટેનલી હેમર', brand: 'Stanley', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 250, searchKeywords: ['hammer', 'hathodi'] },
  { name: 'Bosch Measuring Tape 5 m', nameGu: 'બોશ મેઝરિંગ ટેપ', brand: 'Bosch', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 150, searchKeywords: ['measuring tape', 'fitta'] },
  { name: 'Screwdriver Set 6 pc', nameGu: 'સ્ક્રુડ્રાઈવર સેટ', brand: 'Taparia', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 set', mrp: 220, searchKeywords: ['screwdriver', 'penchvi'] },
  { name: 'Adjustable Wrench 10 inch', nameGu: 'પાનું', brand: 'Taparia', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 240, searchKeywords: ['wrench', 'pana'] },
  { name: 'Hand Saw', nameGu: 'કરવત', brand: 'Stanley', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 190, searchKeywords: ['saw', 'karvat'] },
  { name: 'Havells LED Bulb 9W', nameGu: 'હેવેલ્સ એલઈડી બલ્બ', brand: 'Havells', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 90, searchKeywords: ['led bulb', 'bulb', 'batti'] },
  { name: 'Philips LED Bulb 12W', nameGu: 'ફિલિપ્સ એલઈડી બલ્બ', brand: 'Philips', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 120, searchKeywords: ['led bulb', 'bulb'] },
  { name: 'Anchor Switch 6A', nameGu: 'એન્કર સ્વિચ', brand: 'Anchor', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 35, searchKeywords: ['switch', 'switch board'] },
  { name: 'Extension Board 4 Socket', nameGu: 'એક્સટેન્શન બોર્ડ', brand: 'Anchor', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 250, searchKeywords: ['extension board', 'extension cord'] },
  { name: 'Torch LED Rechargeable', nameGu: 'ટોર્ચ', brand: 'Eveready', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 250, searchKeywords: ['torch', 'batti', 'flashlight'] },
  { name: 'Asian Paints Tractor Emulsion 1 L', nameGu: 'એશિયન પેઈન્ટ્સ ટ્રેક્ટર', brand: 'Asian Paints', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 320, searchKeywords: ['paint', 'rang', 'emulsion paint'] },
  { name: 'Berger Weathercoat Paint 1 L', nameGu: 'બર્ગર વેધરકોટ પેઈન્ટ', brand: 'Berger', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 350, searchKeywords: ['paint', 'rang', 'weathercoat'] },
  { name: 'Paint Brush 2 inch', nameGu: 'પેઈન્ટ બ્રશ', categorySlug: 'paints', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 40, searchKeywords: ['paint brush', 'brush'] },
  { name: 'Wall Putty 1 kg', nameGu: 'વોલ પુટ્ટી', brand: 'Birla', categorySlug: 'paints', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 60, searchKeywords: ['wall putty', 'putty'] },

  // Chemist
  { name: 'Crocin Advance 500 mg 15 tab', nameGu: 'ક્રોસિન', brand: 'Crocin', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '15 tab', mrp: 30, searchKeywords: ['crocin', 'paracetamol'] },
  { name: 'Disprin Tablet 10 pc', nameGu: 'ડિસ્પ્રિન', brand: 'Disprin', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '10 tab', mrp: 20, searchKeywords: ['disprin', 'headache tablet'] },
  { name: 'Digene Antacid 15 tab', nameGu: 'ડાયજીન', brand: 'Digene', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '15 tab', mrp: 45, searchKeywords: ['digene', 'antacid', 'gas ni dava'] },
  { name: 'ORS Electral Sachet', nameGu: 'ઇલેક્ટ્રલ', brand: 'Electral', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '1 sachet', mrp: 20, searchKeywords: ['ors', 'electral', 'dehydration'] },
  { name: 'Vicks Vaporub 50 ml', nameGu: 'વિક્સ', brand: 'Vicks', categorySlug: 'otc-medicines', unitType: 'VOLUME', defaultUnitLabel: '50 ml', mrp: 95, searchKeywords: ['vicks', 'vaporub', 'sardi ni dava'] },
  { name: 'Band-Aid Strips 10 pc', nameGu: 'બેન્ડ એઇડ', brand: 'Band-Aid', categorySlug: 'first-aid', unitType: 'PACK', defaultUnitLabel: '10 pc', mrp: 40, searchKeywords: ['band aid', 'plaster', 'bandage'] },
  { name: 'Dettol Antiseptic Liquid 100 ml', nameGu: 'ડેટોલ', brand: 'Dettol', categorySlug: 'first-aid', unitType: 'VOLUME', defaultUnitLabel: '100 ml', mrp: 60, searchKeywords: ['dettol', 'antiseptic'] },
  { name: 'Cotton Roll 100 g', nameGu: 'રૂ', categorySlug: 'first-aid', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 45, searchKeywords: ['cotton', 'rui'] },
  { name: 'Volini Pain Relief Spray 55 g', nameGu: 'વોલિની સ્પ્રે', brand: 'Volini', categorySlug: 'first-aid', unitType: 'VOLUME', defaultUnitLabel: '55 g', mrp: 190, searchKeywords: ['volini', 'pain relief spray'] },
  { name: 'Johnson\'s Baby Powder 200 g', nameGu: 'જોન્સન બેબી પાવડર', brand: "Johnson's", categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 145, searchKeywords: ['baby powder', 'johnson'] },
  { name: 'Pampers Baby Diapers M 26 pc', nameGu: 'પેમ્પર્સ ડાયપર', brand: 'Pampers', categorySlug: 'baby-care', unitType: 'PACK', defaultUnitLabel: '26 pc', mrp: 399, searchKeywords: ['diapers', 'pampers'] },
  { name: "Cerelac Baby Food 300 g", nameGu: 'સેરેલેક', brand: 'Cerelac', categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 220, searchKeywords: ['cerelac', 'baby food'] },

  // Vegetables & fruits
  { name: 'Potato Batata (loose)', nameGu: 'બટાટા', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['batata', 'aloo', 'potato'], isLooseGood: true },
  { name: 'Onion Kanda (loose)', nameGu: 'ડુંગળી', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kanda', 'pyaz', 'onion'], isLooseGood: true },
  { name: 'Tomato Tameta (loose)', nameGu: 'ટામેટા', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['tameta', 'tamatar', 'tomato'], isLooseGood: true },
  { name: 'Brinjal Ringan (loose)', nameGu: 'રીંગણ', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['ringan', 'baingan', 'brinjal'], isLooseGood: true },
  { name: 'Cauliflower Flower (loose)', nameGu: 'ફ્લાવર', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['flower', 'gobi', 'cauliflower'], isLooseGood: true },
  { name: 'Cabbage Kobi (loose)', nameGu: 'કોબી', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kobi', 'patta gobi', 'cabbage'], isLooseGood: true },
  { name: 'Okra Bhindi (loose)', nameGu: 'ભીંડા', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['bhinda', 'bhindi', 'okra'], isLooseGood: true },
  { name: 'Green Chilli Marchu (loose)', nameGu: 'લીલા મરચાં', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['marchu', 'mirch', 'green chilli'], isLooseGood: true },
  { name: 'Ginger Adu (loose)', nameGu: 'આદુ', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['adu', 'adrak', 'ginger'], isLooseGood: true },
  { name: 'Garlic Lasan (loose)', nameGu: 'લસણ', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['lasan', 'lehsun', 'garlic'], isLooseGood: true },
  { name: 'Carrot Gajar (loose)', nameGu: 'ગાજર', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['gajar', 'carrot'], isLooseGood: true },
  { name: 'Spinach Palak (loose)', nameGu: 'પાલક', categorySlug: 'fresh-vegetables', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['palak', 'spinach', 'bhaji'], isLooseGood: true },
  { name: 'Banana Kela (loose)', nameGu: 'કેળા', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per dozen', searchKeywords: ['kela', 'banana'], isLooseGood: true },
  { name: 'Apple Seb (loose)', nameGu: 'સફરજન', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['seb', 'apple', 'safarjan'], isLooseGood: true },
  { name: 'Mango Keri (loose)', nameGu: 'કેરી', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['keri', 'aam', 'mango'], isLooseGood: true },
  { name: 'Papaya Papaiya (loose)', nameGu: 'પપૈયા', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['papaiya', 'papita', 'papaya'], isLooseGood: true },
  { name: 'Pomegranate Dadam (loose)', nameGu: 'દાડમ', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['dadam', 'anar', 'pomegranate'], isLooseGood: true },
  { name: 'Grapes Draksh (loose)', nameGu: 'દ્રાક્ષ', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['draksh', 'angur', 'grapes'], isLooseGood: true },
  { name: 'Watermelon Tarbuj (loose)', nameGu: 'તડબૂચ', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['tarbuj', 'watermelon'], isLooseGood: true },

  // Farsan & sweets
  { name: 'Gathiya (loose)', nameGu: 'ગાંઠિયા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['gathiya', 'farsan'], isLooseGood: true },
  { name: 'Fafda (loose)', nameGu: 'ફાફડા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['fafda', 'farsan'], isLooseGood: true },
  { name: 'Khaman Dhokla (loose)', nameGu: 'ખમણ ઢોકળા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['khaman', 'dhokla', 'farsan'], isLooseGood: true },
  { name: 'Sev (loose)', nameGu: 'સેવ', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sev', 'farsan'], isLooseGood: true },
  { name: 'Khakhra Plain (loose)', nameGu: 'ખાખરા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['khakhra', 'farsan'], isLooseGood: true },
  { name: 'Samosa (loose)', nameGu: 'સમોસા', categorySlug: 'namkeen-farsan', unitType: 'PIECE', defaultUnitLabel: 'per piece', searchKeywords: ['samosa', 'farsan snack'], isLooseGood: true },
  { name: 'Mohanthal (loose)', nameGu: 'મોહનથાળ', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['mohanthal', 'mithai', 'sweet'], isLooseGood: true },
  { name: 'Gujarati Sukhdi (loose)', nameGu: 'સુખડી', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sukhdi', 'gol papdi', 'mithai'], isLooseGood: true },
  { name: 'Ladva Motichoor (loose)', nameGu: 'લાડવા', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['ladu', 'laddu', 'motichoor', 'mithai'], isLooseGood: true },
  { name: 'Kaju Katli (loose)', nameGu: 'કાજુ કતરી', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kaju katli', 'mithai', 'cashew sweet'], isLooseGood: true },
  { name: 'Gulab Jamun (loose)', nameGu: 'ગુલાબ જાંબુ', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['gulab jamun', 'mithai'], isLooseGood: true },
  { name: 'Jalebi (loose)', nameGu: 'જલેબી', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['jalebi', 'mithai'], isLooseGood: true },
]

export const PRODUCTS: Product[] = P.map((p) => {
  const id = slugToId('prod', p.name)
  return {
    id,
    name: p.name,
    nameGu: p.nameGu,
    brand: p.brand ?? null,
    categoryId: slugToId('cat', p.categorySlug),
    categorySlug: p.categorySlug,
    unitType: p.unitType,
    defaultUnitLabel: p.defaultUnitLabel,
    mrp: p.mrp ?? null,
    imageUrl: placeholderSvgDataUri(p.name, hueForCategorySlug(p.categorySlug)),
    isLooseGood: Boolean(p.isLooseGood),
  }
})

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))

/** Base reference price used to derive each shop's ±8% inventory price —
 * loose goods (no MRP) get a plausible per-kg market rate instead. */
export function basePriceFor(product: Product): number {
  if (product.mrp) return product.mrp
  // Loose-goods market rates, roughly authentic for Ahmedabad kirana prices.
  const looseRates: Record<string, number> = {
    'flours-grains': 42, 'pulses-dals': 130, 'rice': 60, 'edible-oils': 145,
    'spices-masala': 320, 'sugar-jaggery': 55, 'milk-curd': 58,
    'fresh-vegetables': 35, 'fresh-fruits': 90, 'namkeen-chips': 320,
    'namkeen-farsan': 260, 'sweets-mithai': 480,
  }
  return looseRates[product.categorySlug] ?? 80
}

/** Search keywords are kept alongside the product in a side map (not on the
 * contract type — they're a mock-search implementation detail). */
export const SEARCH_KEYWORDS_BY_PRODUCT_ID = new Map(
  P.map((p) => [slugToId('prod', p.name), [p.name.toLowerCase(), ...p.searchKeywords.map((k) => k.toLowerCase())]]),
)
