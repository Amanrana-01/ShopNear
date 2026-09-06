import type { ProductSeed } from './products'

/**
 * The four demo-only aisles — dry fruits, breakfast, frozen, home & kitchen.
 *
 * Added alongside the twelve seeded categories so the "shop by category" grid
 * fills two complete rows on a wide screen rather than trailing off, and
 * because a real Ahmedabad kirana does sell dry fruit, cereal, kulfi and steel
 * dabbas. Written in the same style as the rest of the catalogue, eight
 * products per leaf so every one of these aisles opens onto a full grid.
 */
export const AISLE_PRODUCT_SEED: ProductSeed[] = [
  // ── Dry Fruits · Nuts & Seeds ─────────────────────────────────────────
  { name: 'Almonds Badam (loose)', nameGu: 'બદામ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['badam', 'almond', 'dry fruit', 'suko mevo'], isLooseGood: true },
  { name: 'Cashew Kaju (loose)', nameGu: 'કાજુ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kaju', 'cashew', 'dry fruit'], isLooseGood: true },
  { name: 'Pistachio Pista (loose)', nameGu: 'પિસ્તા', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['pista', 'pistachio', 'dry fruit'], isLooseGood: true },
  { name: 'Walnut Akhrot (loose)', nameGu: 'અખરોટ', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['akhrot', 'walnut', 'dry fruit'], isLooseGood: true },
  { name: 'Peanut Singdana (loose)', nameGu: 'સીંગદાણા', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['singdana', 'peanut', 'mungfali', 'shing'], isLooseGood: true },
  { name: 'Happilo Premium Almonds 200 g', nameGu: 'હેપ્પીલો બદામ', brand: 'Happilo', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 340, searchKeywords: ['badam', 'almond', 'happilo', 'dry fruit'] },
  { name: 'Nutraj Cashews 200 g', nameGu: 'નટરાજ કાજુ', brand: 'Nutraj', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 320, searchKeywords: ['kaju', 'cashew', 'nutraj'] },
  { name: 'Mixed Dry Fruits 250 g', nameGu: 'મિક્સ સૂકો મેવો', categorySlug: 'nuts-seeds', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 420, searchKeywords: ['dry fruit', 'mixed dry fruit', 'suko mevo', 'mevo'] },

  // ── Dry Fruits · Dried Fruits ─────────────────────────────────────────
  { name: 'Raisins Kishmish (loose)', nameGu: 'કિસમિસ', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['kishmish', 'raisin', 'draksh', 'dry fruit'], isLooseGood: true },
  { name: 'Dates Khajur (loose)', nameGu: 'ખજૂર', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['khajur', 'dates', 'khajoor'], isLooseGood: true },
  { name: 'Dried Figs Anjeer (loose)', nameGu: 'અંજીર', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['anjeer', 'fig', 'dry fruit'], isLooseGood: true },
  { name: 'Apricot Jardalu (loose)', nameGu: 'જરદાળુ', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: 'per kg', searchKeywords: ['jardalu', 'apricot', 'khubani'], isLooseGood: true },
  { name: 'Black Raisins 250 g', nameGu: 'કાળી કિસમિસ', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 180, searchKeywords: ['kishmish', 'black raisin', 'draksh'] },
  { name: 'Medjool Dates 500 g', nameGu: 'મેડજૂલ ખજૂર', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 560, searchKeywords: ['khajur', 'dates', 'medjool'] },
  { name: 'Dried Cranberries 200 g', nameGu: 'ક્રેનબેરી', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 240, searchKeywords: ['cranberry', 'dry fruit', 'berries'] },
  { name: 'Prunes Dried Plum 200 g', nameGu: 'સૂકા આલુ', categorySlug: 'dried-fruits', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 275, searchKeywords: ['prunes', 'dried plum', 'alu bukhara'] },

  // ── Breakfast · Cereals & Flakes ──────────────────────────────────────
  { name: 'Kelloggs Corn Flakes 475 g', nameGu: 'કોર્ન ફ્લેક્સ', brand: 'Kelloggs', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '475 g', mrp: 320, searchKeywords: ['corn flakes', 'cereal', 'kelloggs', 'nasto'] },
  { name: 'Kelloggs Chocos 375 g', nameGu: 'ચોકોસ', brand: 'Kelloggs', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '375 g', mrp: 285, searchKeywords: ['chocos', 'cereal', 'kelloggs', 'chocolate cereal'] },
  { name: 'Quaker Oats 1 kg', nameGu: 'ક્વેકર ઓટ્સ', brand: 'Quaker', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 245, searchKeywords: ['oats', 'quaker', 'cereal', 'nasto'] },
  { name: 'Saffola Masala Oats 500 g', nameGu: 'સેફોલા મસાલા ઓટ્સ', brand: 'Saffola', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 175, searchKeywords: ['oats', 'masala oats', 'saffola'] },
  { name: 'Bagrrys Crunchy Muesli 500 g', nameGu: 'મ્યુસલી', brand: 'Bagrrys', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 399, searchKeywords: ['muesli', 'cereal', 'bagrrys', 'nasto'] },
  { name: 'Nestle Koko Krunch 300 g', nameGu: 'કોકો ક્રંચ', brand: 'Nestle', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 260, searchKeywords: ['koko krunch', 'cereal', 'nestle'] },
  { name: 'Poha Chivda Ready Mix 400 g', nameGu: 'પૌંઆ ચેવડો', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 120, searchKeywords: ['poha', 'chivda', 'nasto', 'breakfast'] },
  { name: 'Upma Rava Mix 500 g', nameGu: 'ઉપમા રવા મિક્સ', categorySlug: 'cereals-flakes', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 95, searchKeywords: ['upma', 'rava', 'suji', 'breakfast'] },

  // ── Breakfast · Jams & Spreads ────────────────────────────────────────
  { name: 'Kissan Mixed Fruit Jam 700 g', nameGu: 'કિસાન જામ', brand: 'Kissan', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '700 g', mrp: 265, searchKeywords: ['jam', 'kissan', 'mixed fruit jam'] },
  { name: 'Sundrop Peanut Butter 462 g', nameGu: 'પીનટ બટર', brand: 'Sundrop', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '462 g', mrp: 285, searchKeywords: ['peanut butter', 'sundrop', 'spread'] },
  { name: 'Nutella Hazelnut Spread 350 g', nameGu: 'નુટેલા', brand: 'Nutella', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '350 g', mrp: 475, searchKeywords: ['nutella', 'chocolate spread', 'spread'] },
  { name: 'Kissan Orange Marmalade 500 g', nameGu: 'મુરબ્બો', brand: 'Kissan', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 210, searchKeywords: ['marmalade', 'jam', 'kissan', 'orange'] },
  { name: 'Amul Chocolate Spread 200 g', nameGu: 'અમૂલ ચોકલેટ સ્પ્રેડ', brand: 'Amul', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '200 g', mrp: 145, searchKeywords: ['chocolate spread', 'amul', 'spread'] },
  { name: 'Mapro Strawberry Crush 1 kg', nameGu: 'સ્ટ્રોબેરી ક્રશ', brand: 'Mapro', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '1 kg', mrp: 320, searchKeywords: ['crush', 'strawberry', 'mapro', 'sharbat'] },
  { name: 'Del Monte Mayonnaise 250 g', nameGu: 'મેયોનીઝ', brand: 'Del Monte', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '250 g', mrp: 110, searchKeywords: ['mayonnaise', 'mayo', 'spread'] },
  { name: 'Tops Mixed Fruit Jam 500 g', nameGu: 'ટોપ્સ જામ', brand: 'Tops', categorySlug: 'jams-spreads', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 175, searchKeywords: ['jam', 'tops', 'mixed fruit'] },

  // ── Frozen · Ice Cream ────────────────────────────────────────────────
  { name: 'Amul Vanilla Ice Cream 1 L', nameGu: 'અમૂલ વેનીલા આઈસ્ક્રીમ', brand: 'Amul', categorySlug: 'ice-cream', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 220, searchKeywords: ['ice cream', 'vanilla', 'amul', 'aiskrim'] },
  { name: 'Amul Butterscotch Ice Cream 700 ml', nameGu: 'બટરસ્કોચ આઈસ્ક્રીમ', brand: 'Amul', categorySlug: 'ice-cream', unitType: 'VOLUME', defaultUnitLabel: '700 ml', mrp: 180, searchKeywords: ['ice cream', 'butterscotch', 'amul'] },
  { name: 'Vadilal Kesar Pista Ice Cream 1 L', nameGu: 'વાડીલાલ કેસર પિસ્તા', brand: 'Vadilal', categorySlug: 'ice-cream', unitType: 'VOLUME', defaultUnitLabel: '1 L', mrp: 260, searchKeywords: ['ice cream', 'kesar pista', 'vadilal'] },
  { name: 'Havmor Chocolate Ice Cream 700 ml', nameGu: 'હેવમોર ચોકલેટ', brand: 'Havmor', categorySlug: 'ice-cream', unitType: 'VOLUME', defaultUnitLabel: '700 ml', mrp: 195, searchKeywords: ['ice cream', 'chocolate', 'havmor'] },
  { name: 'Kwality Walls Cornetto 4 pc', nameGu: 'કોર્નેટો', brand: 'Kwality Walls', categorySlug: 'ice-cream', unitType: 'PACK', defaultUnitLabel: '4 pc', mrp: 160, searchKeywords: ['cornetto', 'ice cream', 'cone'] },
  { name: 'Amul Kulfi 6 pc', nameGu: 'અમૂલ કુલ્ફી', brand: 'Amul', categorySlug: 'ice-cream', unitType: 'PACK', defaultUnitLabel: '6 pc', mrp: 150, searchKeywords: ['kulfi', 'ice cream', 'amul'] },
  { name: 'Vadilal Mango Duet 1 pc', nameGu: 'મેંગો ડ્યુએટ', brand: 'Vadilal', categorySlug: 'ice-cream', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 40, searchKeywords: ['ice cream', 'mango', 'vadilal', 'duet'] },
  { name: 'Ice Cream Cone Family Pack 4 pc', nameGu: 'આઈસ્ક્રીમ કોન', categorySlug: 'ice-cream', unitType: 'PACK', defaultUnitLabel: '4 pc', mrp: 130, searchKeywords: ['ice cream', 'cone', 'aiskrim'] },

  // ── Frozen · Frozen Snacks ────────────────────────────────────────────
  { name: 'McCain French Fries 420 g', nameGu: 'ફ્રેન્ચ ફ્રાઈસ', brand: 'McCain', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '420 g', mrp: 145, searchKeywords: ['french fries', 'frozen', 'mccain', 'fries'] },
  { name: 'McCain Aloo Tikki 400 g', nameGu: 'આલૂ ટિક્કી', brand: 'McCain', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 135, searchKeywords: ['aloo tikki', 'frozen', 'mccain', 'tikki'] },
  { name: 'Frozen Green Peas 500 g', nameGu: 'ફ્રોઝન વટાણા', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 95, searchKeywords: ['matar', 'vatana', 'green peas', 'frozen'] },
  { name: 'Frozen Malabar Paratha 5 pc', nameGu: 'ફ્રોઝન પરોઠા', categorySlug: 'frozen-snacks', unitType: 'PACK', defaultUnitLabel: '5 pc', mrp: 110, searchKeywords: ['paratha', 'frozen', 'parotha'] },
  { name: 'Frozen Samosa 12 pc', nameGu: 'ફ્રોઝન સમોસા', categorySlug: 'frozen-snacks', unitType: 'PACK', defaultUnitLabel: '12 pc', mrp: 160, searchKeywords: ['samosa', 'frozen', 'nasto'] },
  { name: 'Sumeru Corn Kernels 500 g', nameGu: 'સ્વીટ કોર્ન', brand: 'Sumeru', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '500 g', mrp: 120, searchKeywords: ['corn', 'sweet corn', 'frozen', 'makai'] },
  { name: 'Frozen Spring Roll 300 g', nameGu: 'સ્પ્રિંગ રોલ', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '300 g', mrp: 150, searchKeywords: ['spring roll', 'frozen', 'nasto'] },
  { name: 'ITC Master Chef Veg Nuggets 400 g', nameGu: 'વેજ નગેટ્સ', brand: 'ITC', categorySlug: 'frozen-snacks', unitType: 'WEIGHT', defaultUnitLabel: '400 g', mrp: 175, searchKeywords: ['nuggets', 'frozen', 'itc'] },

  // ── Home & Kitchen · Kitchen Tools ────────────────────────────────────
  { name: 'Steel Kadai 2 L', nameGu: 'સ્ટીલ કઢાઈ', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 640, searchKeywords: ['kadai', 'kadhai', 'vasan', 'utensil'] },
  { name: 'Pressure Cooker 3 L', nameGu: 'કૂકર ૩ લિટર', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '3 L', mrp: 1450, searchKeywords: ['cooker', 'pressure cooker', 'vasan'] },
  { name: 'Non-stick Tawa 26 cm', nameGu: 'નોન-સ્ટીક તવો', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '26 cm', mrp: 720, searchKeywords: ['tawa', 'tavo', 'non stick', 'vasan'] },
  { name: 'Steel Serving Spoon Set 6 pc', nameGu: 'ચમચી સેટ', categorySlug: 'kitchen-tools', unitType: 'PACK', defaultUnitLabel: '6 pc', mrp: 280, searchKeywords: ['spoon', 'chamchi', 'serving spoon', 'vasan'] },
  { name: 'Chopping Board Plastic', nameGu: 'ચોપિંગ બોર્ડ', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 190, searchKeywords: ['chopping board', 'cutting board', 'kitchen'] },
  { name: 'Vegetable Peeler Steel', nameGu: 'છોલણી', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 85, searchKeywords: ['peeler', 'cholni', 'kitchen'] },
  { name: 'Steel Grater 4-Side', nameGu: 'છીણી', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 175, searchKeywords: ['grater', 'chini', 'kitchen'] },
  { name: 'Milk Strainer Steel', nameGu: 'ગરણી', categorySlug: 'kitchen-tools', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 70, searchKeywords: ['strainer', 'garni', 'chalni', 'kitchen'] },

  // ── Home & Kitchen · Storage & Containers ─────────────────────────────
  { name: 'Airtight Container 1 L', nameGu: 'એરટાઈટ ડબ્બો', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '1 L', mrp: 230, searchKeywords: ['container', 'dabba', 'airtight', 'storage'] },
  { name: 'Steel Dabba Set 3 pc', nameGu: 'સ્ટીલ ડબ્બા સેટ', categorySlug: 'storage-containers', unitType: 'PACK', defaultUnitLabel: '3 pc', mrp: 540, searchKeywords: ['dabba', 'container', 'steel dabba', 'storage'] },
  { name: 'Plastic Water Bottle 1 L', nameGu: 'પાણીની બોટલ', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '1 L', mrp: 150, searchKeywords: ['bottle', 'water bottle', 'pani ni botal'] },
  { name: 'Casserole Hot Pot 2.5 L', nameGu: 'કેસરોલ', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '2.5 L', mrp: 690, searchKeywords: ['casserole', 'hot pot', 'roti box'] },
  { name: 'Masala Dabba 7 Compartment', nameGu: 'મસાલા ડબ્બો', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '1 pc', mrp: 420, searchKeywords: ['masala dabba', 'spice box', 'dabba'] },
  { name: 'Lunch Box Steel 3 Tier', nameGu: 'લંચ બોક્સ', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '3 tier', mrp: 480, searchKeywords: ['lunch box', 'tiffin', 'dabba'] },
  { name: 'Storage Jar Glass 750 ml', nameGu: 'કાચની બરણી', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '750 ml', mrp: 195, searchKeywords: ['jar', 'barni', 'glass jar', 'storage'] },
  { name: 'Cling Film Roll 30 m', nameGu: 'ક્લિંગ ફિલ્મ', categorySlug: 'storage-containers', unitType: 'PIECE', defaultUnitLabel: '30 m', mrp: 165, searchKeywords: ['cling film', 'wrap', 'kitchen'] },
]
