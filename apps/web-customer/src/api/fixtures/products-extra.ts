import type { ProductSeed } from './products'

/**
 * Demo-density catalogue top-up — NOT from the API seed.
 *
 * The transcribed seed in `products.ts` left several leaf categories with
 * only two or three items, so tapping "Dairy → Butter & Ghee" returned a
 * grid with two tiles in it and the app read as a stub. Everything below is
 * written in the same style as the real seed (authentic Indian retail SKUs,
 * MRPs in the right band, Hindi/Gujarati transliteration keywords) and
 * brings **every leaf category to at least eight products**, so any category
 * a customer taps fills a real grid.
 */
export const EXTRA_PRODUCT_SEED: ProductSeed[] = [
  // ── Groceries ─────────────────────────────────────────────────────────
  { name: 'Rajma Chitra (loose)', nameGu: 'રાજમા', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['rajma', 'kidney beans', 'chitra rajma'], isLooseGood: true },
  { name: 'Kabuli Chana (loose)', nameGu: 'કાબુલી ચણા', categorySlug: 'pulses-dals', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['chana', 'kabuli chana', 'chickpea', 'chole'], isLooseGood: true },

  { name: 'Kolam Rice 5 kg', nameGu: 'કોલમ ચોખા ૫ કિલો', brand: 'Kohinoor', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 340, searchKeywords: ['rice', 'chokha', 'kolam', 'chawal'] },
  { name: 'Gujarati Rice (loose)', nameGu: 'ગુજરાતી ચોખા', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['rice', 'chokha', 'chawal', 'gujarati rice'], isLooseGood: true },
  { name: 'Kohinoor Basmati Rice 1 kg', nameGu: 'કોહિનૂર બાસમતી ૧ કિલો', brand: 'Kohinoor', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 185, searchKeywords: ['basmati', 'rice', 'chokha', 'kohinoor'] },
  { name: 'Poha Flattened Rice 500 g', nameGu: 'પૌંઆ ૫૦૦ ગ્રામ', categorySlug: 'rice', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 45, searchKeywords: ['poha', 'pauva', 'flattened rice', 'chivda'] },

  { name: 'Dhara Mustard Oil 1 L', nameGu: 'ધારા સરસવ તેલ ૧ લિટર', brand: 'Dhara', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 165, searchKeywords: ['mustard oil', 'sarso tel', 'rai tel', 'dhara'] },
  { name: 'Patanjali Kachi Ghani Mustard Oil 1 L', nameGu: 'પતંજલિ કચ્ચી ઘાણી તેલ', brand: 'Patanjali', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 175, searchKeywords: ['mustard oil', 'kachi ghani', 'sarso tel', 'patanjali'] },
  { name: 'Sesame Til Oil 500 ml', nameGu: 'તલ તેલ ૫૦૦ મિલી', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 210, searchKeywords: ['til oil', 'sesame oil', 'tal tel'] },
  { name: 'Cotton Seed Oil (loose)', nameGu: 'કપાસિયા તેલ', categorySlug: 'edible-oils', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['kapasiya tel', 'cotton seed oil', 'tel'], isLooseGood: true },

  { name: 'Sugar Khand (loose)', nameGu: 'ખાંડ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['sugar', 'khand', 'cheeni', 'shakkar'], isLooseGood: true },
  { name: 'Organic Jaggery Powder 500 g', nameGu: 'ઓર્ગેનિક ગોળ પાવડર', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 95, searchKeywords: ['gol', 'jaggery', 'gud', 'organic gol'] },
  { name: 'Trust Sugar Cubes 500 g', nameGu: 'સુગર ક્યુબ્સ', brand: 'Trust', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 78, searchKeywords: ['sugar cubes', 'khand', 'cheeni'] },
  { name: 'Bura Sugar 500 g', nameGu: 'બુરું ખાંડ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 62, searchKeywords: ['bura', 'boora', 'sugar', 'khand'] },
  { name: 'Mishri Rock Sugar 200 g', nameGu: 'મિશ્રી ૨૦૦ ગ્રામ', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 55, searchKeywords: ['mishri', 'rock sugar', 'sakar'] },
  { name: 'Dabur Honey 250 g', nameGu: 'ડાબર મધ ૨૫૦ ગ્રામ', brand: 'Dabur', categorySlug: 'sugar-jaggery', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 175, searchKeywords: ['honey', 'madh', 'shahad', 'dabur honey'] },

  // ── Dairy ─────────────────────────────────────────────────────────────
  { name: 'Amul Masti Dahi 400 g', nameGu: 'અમૂલ મસ્તી દહીં', brand: 'Amul', categorySlug: 'milk-curd', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 45, searchKeywords: ['dahi', 'curd', 'yogurt', 'amul dahi'] },
  { name: 'Buffalo Milk (loose)', nameGu: 'ભેંસનું દૂધ', categorySlug: 'milk-curd', unitType: 'VOLUME', defaultUnitLabel: 'per litre', searchKeywords: ['doodh', 'milk', 'bhens doodh', 'buffalo milk'], isLooseGood: true },

  { name: 'Amul Ghee 500 ml', nameGu: 'અમૂલ ઘી ૫૦૦ મિલી', brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 340, searchKeywords: ['ghee', 'ghi', 'amul ghee'] },
  { name: 'Britannia Salted Butter 500 g', nameGu: 'બ્રિટાનિયા બટર', brand: 'Britannia', categorySlug: 'butter-ghee', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 275, searchKeywords: ['butter', 'makhan', 'britannia butter'] },
  { name: 'Nutralite Table Spread 250 g', nameGu: 'ન્યુટ્રાલાઇટ સ્પ્રેડ', brand: 'Nutralite', categorySlug: 'butter-ghee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 130, searchKeywords: ['butter', 'spread', 'margarine', 'nutralite'] },
  { name: 'Buffalo Ghee (loose)', nameGu: 'ભેંસનું ઘી', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: 'per kg', searchKeywords: ['ghee', 'ghi', 'bhens ghee'], isLooseGood: true },
  { name: 'Amul Lite Butter 100 g', nameGu: 'અમૂલ લાઇટ બટર', brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 58, searchKeywords: ['butter', 'makhan', 'amul lite'] },
  { name: 'Patanjali Cow Ghee 500 ml', nameGu: 'પતંજલિ ગાયનું ઘી', brand: 'Patanjali', categorySlug: 'butter-ghee', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 315, searchKeywords: ['ghee', 'cow ghee', 'gay ghee', 'patanjali'] },

  { name: 'Amul Cheese Spread 200 g', nameGu: 'અમૂલ ચીઝ સ્પ્રેડ', brand: 'Amul', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 110, searchKeywords: ['cheese', 'cheese spread', 'amul cheese'] },
  { name: 'Britannia Cheese Cubes 200 g', nameGu: 'બ્રિટાનિયા ચીઝ ક્યુબ્સ', brand: 'Britannia', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 125, searchKeywords: ['cheese', 'cheese cubes', 'britannia cheese'] },
  { name: 'Go Cheese Slices 200 g', nameGu: 'ગો ચીઝ સ્લાઇસ', brand: 'Go', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 130, searchKeywords: ['cheese', 'cheese slice', 'go cheese'] },
  { name: 'Paneer (loose)', nameGu: 'પનીર', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['paneer', 'cottage cheese', 'panir'], isLooseGood: true },
  { name: 'Amul Mozzarella Cheese 200 g', nameGu: 'અમૂલ મોઝેરેલા ચીઝ', brand: 'Amul', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 145, searchKeywords: ['cheese', 'mozzarella', 'pizza cheese'] },
  { name: 'Malai Paneer Fresh 500 g', nameGu: 'મલાઈ પનીર', categorySlug: 'cheese-paneer', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 210, searchKeywords: ['paneer', 'malai paneer', 'panir'] },

  // ── Bakery ────────────────────────────────────────────────────────────
  { name: 'Harvest Gold Sandwich Bread 400 g', nameGu: 'હાર્વેસ્ટ ગોલ્ડ બ્રેડ', brand: 'Harvest Gold', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 50, searchKeywords: ['bread', 'pav', 'sandwich bread'] },
  { name: 'Britannia Multigrain Bread 400 g', nameGu: 'મલ્ટીગ્રેન બ્રેડ', brand: 'Britannia', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 60, searchKeywords: ['bread', 'multigrain', 'brown bread'] },
  { name: 'Burger Buns 4 pc', nameGu: 'બર્ગર બન ૪ નંગ', categorySlug: 'bread-buns', unitType: 'PACK', defaultUnitLabel: '4 pc', mrp: 40, searchKeywords: ['bun', 'burger bun', 'pav'] },
  { name: 'Milk Bread Sweet 400 g', nameGu: 'મિલ્ક બ્રેડ', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 48, searchKeywords: ['bread', 'milk bread', 'sweet bread'] },
  { name: 'Garlic Bread Stick 200 g', nameGu: 'ગાર્લિક બ્રેડ સ્ટિક', categorySlug: 'bread-buns', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 65, searchKeywords: ['garlic bread', 'bread stick', 'bread'] },

  { name: 'Sunfeast Dark Fantasy 75 g', nameGu: 'ડાર્ક ફેન્ટસી', brand: 'Sunfeast', categorySlug: 'biscuits-cookies', unitType: 'WEIGHT', defaultUnitLabel: '75 g', mrp: 40, searchKeywords: ['biscuit', 'cookies', 'dark fantasy', 'chocolate biscuit'] },
  { name: 'Good Day Cashew 200 g', nameGu: 'ગુડ ડે કાજુ', brand: 'Britannia', categorySlug: 'biscuits-cookies', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 50, searchKeywords: ['biscuit', 'good day', 'cashew biscuit', 'kaju'] },
  { name: 'Krackjack Biscuits 200 g', nameGu: 'ક્રેકજેક બિસ્કીટ', brand: 'Parle', categorySlug: 'biscuits-cookies', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 35, searchKeywords: ['biscuit', 'krackjack', 'parle'] },
  { name: 'Monaco Salted Biscuits 200 g', nameGu: 'મોનેકો બિસ્કીટ', brand: 'Parle', categorySlug: 'biscuits-cookies', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 35, searchKeywords: ['biscuit', 'monaco', 'salted biscuit', 'namkeen biscuit'] },
  { name: 'Oreo Chocolate Cream 120 g', nameGu: 'ઓરિયો બિસ્કીટ', brand: 'Cadbury', categorySlug: 'biscuits-cookies', unitType: 'WEIGHT', defaultUnitLabel: '120 g', mrp: 40, searchKeywords: ['biscuit', 'oreo', 'cream biscuit'] },

  { name: 'Parle Rusk Elaichi 200 g', nameGu: 'પારલે ટોસ્ટ ઇલાયચી', brand: 'Parle', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 45, searchKeywords: ['rusk', 'toast', 'khari', 'elaichi rusk'] },
  { name: 'Britannia Plum Cake 250 g', nameGu: 'પ્લમ કેક', brand: 'Britannia', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 120, searchKeywords: ['cake', 'plum cake', 'britannia cake'] },
  { name: 'Winkies Chocolate Cake 250 g', nameGu: 'વિન્કીઝ ચોકલેટ કેક', brand: 'Winkies', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 140, searchKeywords: ['cake', 'chocolate cake', 'winkies'] },
  { name: 'Milk Toast 300 g', nameGu: 'મિલ્ક ટોસ્ટ', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 55, searchKeywords: ['toast', 'rusk', 'milk toast'] },
  { name: 'Cup Cake Vanilla 4 pc', nameGu: 'કપ કેક વેનીલા', categorySlug: 'cakes-rusks', unitType: 'PACK', defaultUnitLabel: '4 pc', mrp: 60, searchKeywords: ['cup cake', 'cake', 'vanilla cake'] },
  { name: 'Bakery Khari Puff 200 g', nameGu: 'ખારી ૨૦૦ ગ્રામ', categorySlug: 'cakes-rusks', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 50, searchKeywords: ['khari', 'puff', 'bakery khari'] },

  // ── Personal Care ─────────────────────────────────────────────────────
  { name: 'Santoor Sandal Soap 125 g', nameGu: 'સંતૂર સાબુ', brand: 'Santoor', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 42, searchKeywords: ['soap', 'sabun', 'santoor', 'nahane ka sabun'] },
  { name: 'Cinthol Original Soap 100 g', nameGu: 'સિન્થોલ સાબુ', brand: 'Godrej', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '100 g', mrp: 38, searchKeywords: ['soap', 'sabun', 'cinthol'] },
  { name: 'Medimix Ayurvedic Soap 125 g', nameGu: 'મેડિમિક્સ સાબુ', brand: 'Medimix', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 45, searchKeywords: ['soap', 'sabun', 'medimix', 'ayurvedic soap'] },
  { name: 'Pears Pure & Gentle Soap 125 g', nameGu: 'પિયર્સ સાબુ', brand: 'Pears', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 65, searchKeywords: ['soap', 'sabun', 'pears'] },
  { name: 'Dettol Original Soap 125 g', nameGu: 'ડેટોલ સાબુ', brand: 'Dettol', categorySlug: 'bath-soap', unitType: 'WEIGHT', defaultUnitLabel: '125 g', mrp: 48, searchKeywords: ['soap', 'sabun', 'dettol soap'] },

  { name: 'Dove Hair Fall Rescue Shampoo 180 ml', nameGu: 'ડવ શેમ્પૂ', brand: 'Dove', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '180 ml', mrp: 220, searchKeywords: ['shampoo', 'dove', 'hair fall'] },
  { name: 'Sunsilk Black Shine Shampoo 180 ml', nameGu: 'સનસિલ્ક શેમ્પૂ', brand: 'Sunsilk', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '180 ml', mrp: 165, searchKeywords: ['shampoo', 'sunsilk', 'vaal'] },
  { name: 'Bajaj Almond Drops Hair Oil 200 ml', nameGu: 'બજાજ બદામ તેલ', brand: 'Bajaj', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '200 ml', mrp: 145, searchKeywords: ['hair oil', 'tel', 'badam tel', 'bajaj'] },
  { name: 'Dabur Amla Hair Oil 180 ml', nameGu: 'ડાબર આમળા તેલ', brand: 'Dabur', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '180 ml', mrp: 110, searchKeywords: ['hair oil', 'amla', 'tel', 'dabur'] },
  { name: 'Indulekha Bringha Oil 100 ml', nameGu: 'ઇન્દુલેખા તેલ', brand: 'Indulekha', categorySlug: 'shampoo-haircare', unitType: 'VOLUME', defaultUnitLabel: '100 ml', mrp: 235, searchKeywords: ['hair oil', 'indulekha', 'bringha', 'tel'] },

  { name: 'Pepsodent Germicheck Toothpaste 150 g', nameGu: 'પેપ્સોડેન્ટ ટૂથપેસ્ટ', brand: 'Pepsodent', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '150 g', mrp: 95, searchKeywords: ['toothpaste', 'manjan', 'pepsodent', 'dant'] },
  { name: 'Closeup Red Hot Gel 150 g', nameGu: 'ક્લોઝઅપ ટૂથપેસ્ટ', brand: 'Closeup', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '150 g', mrp: 99, searchKeywords: ['toothpaste', 'closeup', 'manjan'] },
  { name: 'Dabur Red Toothpaste 200 g', nameGu: 'ડાબર રેડ ટૂથપેસ્ટ', brand: 'Dabur', categorySlug: 'oral-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 115, searchKeywords: ['toothpaste', 'dabur red', 'manjan'] },
  { name: 'Oral-B Toothbrush Soft 2 pc', nameGu: 'ઓરલ-બી બ્રશ', brand: 'Oral-B', categorySlug: 'oral-care', unitType: 'PACK', defaultUnitLabel: '2 pc', mrp: 85, searchKeywords: ['toothbrush', 'brush', 'datan'] },
  { name: 'Listerine Mouthwash 250 ml', nameGu: 'લિસ્ટરિન માઉથવોશ', brand: 'Listerine', categorySlug: 'oral-care', unitType: 'VOLUME', defaultUnitLabel: '250 ml', mrp: 175, searchKeywords: ['mouthwash', 'listerine', 'kulla'] },

  // ── Household ─────────────────────────────────────────────────────────
  { name: 'Domex Disinfectant Cleaner 500 ml', nameGu: 'ડોમેક્સ ક્લીનર', brand: 'Domex', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 105, searchKeywords: ['toilet cleaner', 'domex', 'cleaner', 'safai'] },
  { name: 'Scotch-Brite Scrub Pad 3 pc', nameGu: 'સ્કોચ બ્રાઇટ સ્ક્રબ', brand: 'Scotch-Brite', categorySlug: 'cleaning-supplies', unitType: 'PACK', defaultUnitLabel: '3 pc', mrp: 55, searchKeywords: ['scrub', 'scrubber', 'safai', 'bartan'] },
  { name: 'Phenyl White 1 L', nameGu: 'ફિનાઇલ ૧ લિટર', categorySlug: 'cleaning-supplies', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 70, searchKeywords: ['phenyl', 'floor cleaner', 'safai'] },
  { name: 'Broom Soft Jhadu', nameGu: 'ઝાડુ', categorySlug: 'cleaning-supplies', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 90, searchKeywords: ['jhadu', 'broom', 'safai', 'sav'] },

  { name: 'Rin Detergent Bar 250 g', nameGu: 'રિન સાબુ', brand: 'Rin', categorySlug: 'laundry', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 22, searchKeywords: ['detergent', 'sabun', 'kapda dhovano sabun', 'rin'] },
  { name: 'Ariel Matic Liquid 1 L', nameGu: 'એરિયલ મેટિક લિક્વિડ', brand: 'Ariel', categorySlug: 'laundry', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 320, searchKeywords: ['detergent', 'liquid detergent', 'ariel', 'kapda'] },
  { name: 'Comfort Fabric Conditioner 800 ml', nameGu: 'કમ્ફર્ટ ફેબ્રિક કંડિશનર', brand: 'Comfort', categorySlug: 'laundry', unitType: 'VOLUME', defaultUnitLabel: '800 ml', mrp: 210, searchKeywords: ['fabric conditioner', 'comfort', 'softener'] },
  { name: 'Ujala Supreme Whitener 75 ml', nameGu: 'ઉજાલા ૭૫ મિલી', brand: 'Ujala', categorySlug: 'laundry', unitType: 'VOLUME', defaultUnitLabel: '75 ml', mrp: 30, searchKeywords: ['ujala', 'neel', 'whitener', 'kapda'] },

  { name: 'Diya Terracotta 12 pc', nameGu: 'દીવા ૧૨ નંગ', categorySlug: 'pooja-items', unitType: 'PACK', defaultUnitLabel: '12 pc', mrp: 60, searchKeywords: ['diya', 'divo', 'deepak', 'pooja'] },
  { name: 'Kumkum Roli 50 g', nameGu: 'કંકુ ૫૦ ગ્રામ', categorySlug: 'pooja-items', unitType: 'WEIGHT', defaultUnitLabel: '50 g', mrp: 30, searchKeywords: ['kumkum', 'kanku', 'roli', 'pooja'] },
  { name: 'Coconut Shrifal 1 pc', nameGu: 'શ્રીફળ', categorySlug: 'pooja-items', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['nariyal', 'shrifal', 'coconut', 'pooja'] },

  // ── Beverages ─────────────────────────────────────────────────────────
  { name: 'Taj Mahal Tea 250 g', nameGu: 'તાજમહલ ચા', brand: 'Taj Mahal', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 165, searchKeywords: ['tea', 'chai', 'cha', 'taj mahal'] },
  { name: 'Girnar Masala Tea 250 g', nameGu: 'ગિરનાર મસાલા ચા', brand: 'Girnar', categorySlug: 'tea-coffee', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 155, searchKeywords: ['tea', 'chai', 'masala chai', 'girnar'] },

  { name: 'Pepsi 750 ml', nameGu: 'પેપ્સી ૭૫૦ મિલી', brand: 'Pepsi', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['cold drink', 'pepsi', 'thanda', 'soft drink'] },
  { name: 'Mountain Dew 750 ml', nameGu: 'માઉન્ટેન ડ્યુ', brand: 'Mountain Dew', categorySlug: 'soft-drinks', unitType: 'VOLUME', defaultUnitLabel: '750 ml', mrp: 45, searchKeywords: ['cold drink', 'mountain dew', 'thanda'] },

  { name: 'Paper Boat Aam Panna 250 ml', nameGu: 'પેપર બોટ આમ પન્ના', brand: 'Paper Boat', categorySlug: 'juices-health-drinks', unitType: 'VOLUME', defaultUnitLabel: '250 ml', mrp: 35, searchKeywords: ['juice', 'aam panna', 'paper boat', 'ras'] },
  { name: 'Complan Health Drink 500 g', nameGu: 'કોમ્પ્લાન', brand: 'Complan', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 340, searchKeywords: ['health drink', 'complan', 'doodh powder'] },
  { name: 'Glucon-D Orange 400 g', nameGu: 'ગ્લુકોન-ડી', brand: 'Glucon-D', categorySlug: 'juices-health-drinks', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 130, searchKeywords: ['glucose', 'glucon d', 'energy drink'] },

  // ── Snacks ────────────────────────────────────────────────────────────
  { name: 'Haldiram Aloo Bhujia 200 g', nameGu: 'હલ્દીરામ આલૂ ભુજિયા', brand: 'Haldiram', categorySlug: 'namkeen-chips', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 60, searchKeywords: ['namkeen', 'bhujia', 'haldiram', 'nasto'] },
  { name: 'Uncle Chipps Spicy Treat 52 g', nameGu: 'અંકલ ચિપ્સ', brand: 'Uncle Chipps', categorySlug: 'namkeen-chips', unitType: 'WEIGHT', defaultUnitLabel: '52 g', mrp: 20, searchKeywords: ['chips', 'wafer', 'uncle chipps', 'nasto'] },
  { name: 'Bingo Mad Angles 66 g', nameGu: 'બિન્ગો મેડ એંગલ્સ', brand: 'Bingo', categorySlug: 'namkeen-chips', unitType: 'WEIGHT', defaultUnitLabel: '66 g', mrp: 30, searchKeywords: ['chips', 'bingo', 'mad angles', 'nasto'] },
  { name: 'Chana Chor Garam (loose)', nameGu: 'ચણા ચોર ગરમ', categorySlug: 'namkeen-chips', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['namkeen', 'chana chor', 'nasto'], isLooseGood: true },

  { name: 'Perk Chocolate 24 g', nameGu: 'પર્ક ચોકલેટ', brand: 'Cadbury', categorySlug: 'chocolates-candy', unitType: 'WEIGHT', defaultUnitLabel: '24 g', mrp: 20, searchKeywords: ['chocolate', 'perk', 'cadbury'] },
  { name: 'Eclairs Toffee 10 pc', nameGu: 'ઇક્લેર્સ ટોફી', brand: 'Cadbury', categorySlug: 'chocolates-candy', unitType: 'PACK', defaultUnitLabel: '10 pc', mrp: 30, searchKeywords: ['toffee', 'candy', 'eclairs', 'chocolate'] },
  { name: 'Parle Melody Toffee 10 pc', nameGu: 'મેલોડી ટોફી', brand: 'Parle', categorySlug: 'chocolates-candy', unitType: 'PACK', defaultUnitLabel: '10 pc', mrp: 25, searchKeywords: ['toffee', 'candy', 'melody', 'chocolate'] },

  { name: 'Yippee Magic Masala Noodles 70 g', nameGu: 'યિપ્પી નૂડલ્સ', brand: 'Sunfeast', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '70 g', mrp: 15, searchKeywords: ['noodles', 'yippee', 'maggi', 'instant noodles'] },
  { name: 'Top Ramen Curry Noodles 70 g', nameGu: 'ટોપ રામેન નૂડલ્સ', brand: 'Top Ramen', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '70 g', mrp: 15, searchKeywords: ['noodles', 'top ramen', 'instant noodles'] },
  { name: 'Knorr Classic Tomato Soup 53 g', nameGu: 'નોર ટોમેટો સૂપ', brand: 'Knorr', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '53 g', mrp: 60, searchKeywords: ['soup', 'knorr', 'tomato soup', 'instant'] },
  { name: 'Maggi Cuppa Mania 70 g', nameGu: 'મેગી કપ્પા મેનિયા', brand: 'Maggi', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '70 g', mrp: 45, searchKeywords: ['noodles', 'maggi', 'cup noodles', 'instant noodles'] },
  { name: 'Chings Secret Schezwan Noodles 60 g', nameGu: 'ચિંગ્સ નૂડલ્સ', brand: 'Chings', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '60 g', mrp: 20, searchKeywords: ['noodles', 'chings', 'schezwan', 'instant noodles'] },
  { name: 'Wai Wai Instant Noodles 75 g', nameGu: 'વાઈ વાઈ નૂડલ્સ', brand: 'Wai Wai', categorySlug: 'instant-noodles', unitType: 'WEIGHT', defaultUnitLabel: '75 g', mrp: 20, searchKeywords: ['noodles', 'wai wai', 'instant noodles'] },

  // ── Stationery ────────────────────────────────────────────────────────
  { name: 'Graph Paper Book 40 pg', nameGu: 'ગ્રાફ પેપર બુક', categorySlug: 'notebooks-paper', unitType: 'PIECE', defaultUnitLabel: '40 pg', mrp: 30, searchKeywords: ['graph paper', 'notebook', 'chopdi'] },
  { name: 'File Folder A4 5 pc', nameGu: 'ફાઇલ ફોલ્ડર', categorySlug: 'notebooks-paper', unitType: 'PACK', defaultUnitLabel: '5 pc', mrp: 75, searchKeywords: ['file', 'folder', 'a4 file'] },
  { name: 'Sticky Notes 3x3 100 sheets', nameGu: 'સ્ટીકી નોટ્સ', categorySlug: 'notebooks-paper', unitType: 'PACK', defaultUnitLabel: '100 sheets', mrp: 55, searchKeywords: ['sticky notes', 'post it', 'notes'] },

  { name: 'Apsara Platinum Pencil 10 pc', nameGu: 'અપ્સરા પેન્સિલ', brand: 'Apsara', categorySlug: 'pens-pencils', unitType: 'PACK', defaultUnitLabel: '10 pc', mrp: 50, searchKeywords: ['pencil', 'apsara', 'pensil'] },
  { name: 'Luxor Highlighter 2 pc', nameGu: 'હાઇલાઇટર', brand: 'Luxor', categorySlug: 'pens-pencils', unitType: 'PACK', defaultUnitLabel: '2 pc', mrp: 60, searchKeywords: ['highlighter', 'marker', 'pen'] },

  { name: 'Chart Paper A2 5 sheets', nameGu: 'ચાર્ટ પેપર', categorySlug: 'art-craft', unitType: 'PACK', defaultUnitLabel: '5 sheets', mrp: 40, searchKeywords: ['chart paper', 'craft', 'paper'] },
  { name: 'Fevicryl Acrylic Colour Kit', nameGu: 'ફેવિક્રિલ કલર કિટ', brand: 'Fevicryl', categorySlug: 'art-craft', unitType: 'PIECE', defaultUnitLabel: '1 kit', mrp: 210, searchKeywords: ['acrylic colour', 'paint', 'craft', 'fevicryl'] },
  { name: 'Sketch Pens 12 Shades', nameGu: 'સ્કેચ પેન ૧૨ રંગ', categorySlug: 'art-craft', unitType: 'PACK', defaultUnitLabel: '12 pc', mrp: 70, searchKeywords: ['sketch pen', 'colour pen', 'craft'] },

  // ── Hardware ──────────────────────────────────────────────────────────
  { name: 'Allen Key Set 9 pc', nameGu: 'એલન કી સેટ', categorySlug: 'tools', unitType: 'PACK', defaultUnitLabel: '9 pc', mrp: 190, searchKeywords: ['allen key', 'tool', 'ojar', 'hex key'] },
  { name: 'Nose Plier 6 inch', nameGu: 'નોઝ પ્લાયર', categorySlug: 'tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 230, searchKeywords: ['plier', 'nose plier', 'tool', 'ojar'] },

  { name: 'Anchor 3-Pin Plug Top 6A', nameGu: 'એન્કર પ્લગ ટોપ', brand: 'Anchor', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 45, searchKeywords: ['plug', 'plug top', 'electrical', 'anchor'] },
  { name: 'Copper Wire 1 sq mm 5 m', nameGu: 'કોપર વાયર', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '5 m', mrp: 180, searchKeywords: ['wire', 'copper wire', 'electrical', 'taar'] },
  { name: 'Orpat Table Fan Regulator', nameGu: 'ફેન રેગ્યુલેટર', brand: 'Orpat', categorySlug: 'electrical', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 155, searchKeywords: ['regulator', 'fan regulator', 'electrical'] },

  { name: 'Asian Paints Apcolite Enamel 500 ml', nameGu: 'એપ્કોલાઇટ ઇનેમલ', brand: 'Asian Paints', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 340, searchKeywords: ['paint', 'enamel', 'rang', 'asian paints'] },
  { name: 'Nerolac Impressions Emulsion 1 L', nameGu: 'નેરોલેક ઇમલ્શન', brand: 'Nerolac', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 480, searchKeywords: ['paint', 'emulsion', 'rang', 'nerolac'] },
  { name: 'Paint Roller 7 inch', nameGu: 'પેઈન્ટ રોલર', categorySlug: 'paints', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 120, searchKeywords: ['roller', 'paint roller', 'rang'] },
  { name: 'Turpentine Oil 500 ml', nameGu: 'ટર્પેન્ટાઇન તેલ', categorySlug: 'paints', unitType: 'VOLUME', defaultUnitLabel: '500 ml', mrp: 95, searchKeywords: ['turpentine', 'thinner', 'paint'] },

  // ── Chemist ───────────────────────────────────────────────────────────
  { name: 'Dolo 650 mg 15 tab', nameGu: 'ડોલો ૬૫૦', brand: 'Dolo', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '15 tab', mrp: 35, searchKeywords: ['dolo', 'paracetamol', 'fever', 'tavi', 'bukhar'] },
  { name: 'Cetirizine 10 mg 10 tab', nameGu: 'સેટ્રિઝિન', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '10 tab', mrp: 28, searchKeywords: ['cetirizine', 'allergy', 'cold', 'shardi'] },
  { name: 'Pudin Hara Pearls 10 pc', nameGu: 'પુદીન હરા', brand: 'Dabur', categorySlug: 'otc-medicines', unitType: 'PACK', defaultUnitLabel: '10 pc', mrp: 45, searchKeywords: ['pudin hara', 'acidity', 'gas', 'pet dard'] },

  { name: 'Savlon Antiseptic Liquid 100 ml', nameGu: 'સેવલોન', brand: 'Savlon', categorySlug: 'first-aid', unitType: 'VOLUME', defaultUnitLabel: '100 ml', mrp: 75, searchKeywords: ['antiseptic', 'savlon', 'dettol', 'first aid'] },
  { name: 'Crepe Bandage 6 cm', nameGu: 'ક્રેપ બેન્ડેજ', categorySlug: 'first-aid', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 90, searchKeywords: ['bandage', 'patti', 'first aid'] },
  { name: 'Digital Thermometer', nameGu: 'ડિજિટલ થર્મોમીટર', categorySlug: 'first-aid', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 190, searchKeywords: ['thermometer', 'fever', 'bukhar', 'first aid'] },
  { name: 'Burnol Cream 20 g', nameGu: 'બર્નોલ ક્રીમ', brand: 'Burnol', categorySlug: 'first-aid', unitType: 'WEIGHT', defaultUnitLabel: '20 g', mrp: 65, searchKeywords: ['burnol', 'burn cream', 'first aid'] },

  { name: 'Cerelac Wheat Apple 300 g', nameGu: 'સેરેલેક', brand: 'Nestle', categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 310, searchKeywords: ['cerelac', 'baby food', 'baby'] },
  { name: 'Himalaya Baby Powder 200 g', nameGu: 'હિમાલય બેબી પાવડર', brand: 'Himalaya', categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 165, searchKeywords: ['baby powder', 'himalaya', 'baby'] },
  { name: 'Mamy Poko Pants L 30 pc', nameGu: 'મેમી પોકો પેન્ટ્સ', brand: 'MamyPoko', categorySlug: 'baby-care', unitType: 'PACK', defaultUnitLabel: '30 pc', mrp: 649, searchKeywords: ['diaper', 'mamy poko', 'baby', 'pants'] },
  { name: 'Baby Wipes 72 pc', nameGu: 'બેબી વાઇપ્સ', categorySlug: 'baby-care', unitType: 'PACK', defaultUnitLabel: '72 pc', mrp: 199, searchKeywords: ['wipes', 'baby wipes', 'baby'] },
  { name: 'Nan Pro Infant Formula 400 g', nameGu: 'નેન પ્રો', brand: 'Nestle', categorySlug: 'baby-care', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 780, searchKeywords: ['infant formula', 'nan pro', 'baby milk', 'baby'] },
  { name: 'Baby Feeding Bottle 250 ml', nameGu: 'ફીડિંગ બોટલ', categorySlug: 'baby-care', unitType: 'PIECE', defaultUnitLabel: '250 ml', mrp: 240, searchKeywords: ['feeding bottle', 'baby bottle', 'baby'] },

  // ── Vegetables & Fruits ───────────────────────────────────────────────
  { name: 'Orange Santra (loose)', nameGu: 'સંતરા', categorySlug: 'fresh-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['orange', 'santra', 'fruit', 'phal'], isLooseGood: true },

  // ── Farsan ────────────────────────────────────────────────────────────
  { name: 'Patra (loose)', nameGu: 'પાત્રા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['patra', 'farsan', 'nasto'], isLooseGood: true },
  { name: 'Khatta Dhokla (loose)', nameGu: 'ખાટા ઢોકળા', categorySlug: 'namkeen-farsan', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['dhokla', 'khatta dhokla', 'farsan'], isLooseGood: true },

  { name: 'Basundi (loose)', nameGu: 'બાસુંદી', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['basundi', 'mithai', 'sweet'], isLooseGood: true },
  { name: 'Penda Mava (loose)', nameGu: 'પેંડા', categorySlug: 'sweets-mithai', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['penda', 'peda', 'mithai', 'sweet'], isLooseGood: true },
]
