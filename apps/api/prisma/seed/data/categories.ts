export interface CategorySeed {
  name: string
  nameGu: string
  slug: string
  iconName: string
  children: { name: string; nameGu: string; slug: string; iconName: string }[]
}

/**
 * ~40 categories over exactly two levels (top-level + children). Slugs are
 * referenced by `categorySlug` in data/products.ts — keep them in sync.
 */
export const CATEGORY_SEED: CategorySeed[] = [
  {
    name: 'Groceries', nameGu: 'કરિયાણું', slug: 'groceries', iconName: 'basket',
    children: [
      { name: 'Flours & Grains', nameGu: 'લોટ અને અનાજ', slug: 'flours-grains', iconName: 'wheat' },
      { name: 'Pulses & Dals', nameGu: 'કઠોળ અને દાળ', slug: 'pulses-dals', iconName: 'lentil' },
      { name: 'Rice', nameGu: 'ચોખા', slug: 'rice', iconName: 'rice' },
      { name: 'Edible Oils', nameGu: 'ખાદ્ય તેલ', slug: 'edible-oils', iconName: 'bottle' },
      { name: 'Spices & Masala', nameGu: 'મસાલા', slug: 'spices-masala', iconName: 'spice' },
      { name: 'Sugar & Jaggery', nameGu: 'ખાંડ અને ગોળ', slug: 'sugar-jaggery', iconName: 'sugar' },
    ],
  },
  {
    name: 'Dairy', nameGu: 'ડેરી', slug: 'dairy', iconName: 'milk',
    children: [
      { name: 'Milk & Curd', nameGu: 'દૂધ અને દહીં', slug: 'milk-curd', iconName: 'milk' },
      { name: 'Butter & Ghee', nameGu: 'માખણ અને ઘી', slug: 'butter-ghee', iconName: 'butter' },
      { name: 'Cheese & Paneer', nameGu: 'ચીઝ અને પનીર', slug: 'cheese-paneer', iconName: 'cheese' },
    ],
  },
  {
    name: 'Bakery', nameGu: 'બેકરી', slug: 'bakery', iconName: 'bread',
    children: [
      { name: 'Bread & Buns', nameGu: 'બ્રેડ અને બન', slug: 'bread-buns', iconName: 'bread' },
      { name: 'Biscuits & Cookies', nameGu: 'બિસ્કીટ', slug: 'biscuits-cookies', iconName: 'cookie' },
      { name: 'Cakes & Rusks', nameGu: 'કેક અને ટોસ્ટ', slug: 'cakes-rusks', iconName: 'cake' },
    ],
  },
  {
    name: 'Personal Care', nameGu: 'વ્યક્તિગત સંભાળ', slug: 'personal-care', iconName: 'soap',
    children: [
      { name: 'Bath & Soap', nameGu: 'સ્નાન અને સાબુ', slug: 'bath-soap', iconName: 'soap' },
      { name: 'Shampoo & Hair Care', nameGu: 'શેમ્પૂ અને વાળની સંભાળ', slug: 'shampoo-haircare', iconName: 'bottle' },
      { name: 'Oral Care', nameGu: 'મૌખિક સંભાળ', slug: 'oral-care', iconName: 'toothbrush' },
    ],
  },
  {
    name: 'Household', nameGu: 'ઘરવપરાશ', slug: 'household', iconName: 'home',
    children: [
      { name: 'Cleaning Supplies', nameGu: 'સફાઈ સામગ્રી', slug: 'cleaning-supplies', iconName: 'spray' },
      { name: 'Laundry', nameGu: 'કપડાં ધોવાની સામગ્રી', slug: 'laundry', iconName: 'washing-machine' },
      { name: 'Pooja Items', nameGu: 'પૂજા સામગ્રી', slug: 'pooja-items', iconName: 'flame' },
    ],
  },
  {
    name: 'Beverages', nameGu: 'પીણાં', slug: 'beverages', iconName: 'cup',
    children: [
      { name: 'Tea & Coffee', nameGu: 'ચા અને કોફી', slug: 'tea-coffee', iconName: 'cup' },
      { name: 'Soft Drinks', nameGu: 'ઠંડા પીણાં', slug: 'soft-drinks', iconName: 'bottle' },
      { name: 'Juices & Health Drinks', nameGu: 'જ્યુસ અને હેલ્થ ડ્રિંક્સ', slug: 'juices-health-drinks', iconName: 'bottle' },
    ],
  },
  {
    name: 'Snacks', nameGu: 'નાસ્તા', slug: 'snacks', iconName: 'chips',
    children: [
      { name: 'Namkeen & Chips', nameGu: 'નમકીન અને ચિપ્સ', slug: 'namkeen-chips', iconName: 'chips' },
      { name: 'Chocolates & Candy', nameGu: 'ચોકલેટ અને કેન્ડી', slug: 'chocolates-candy', iconName: 'candy' },
      { name: 'Instant Noodles & Snacks', nameGu: 'ઇન્સ્ટન્ટ નૂડલ્સ', slug: 'instant-noodles', iconName: 'bowl' },
    ],
  },
  {
    name: 'Stationery', nameGu: 'સ્ટેશનરી', slug: 'stationery', iconName: 'pencil',
    children: [
      { name: 'Notebooks & Paper', nameGu: 'નોટબુક અને કાગળ', slug: 'notebooks-paper', iconName: 'notebook' },
      { name: 'Pens & Pencils', nameGu: 'પેન અને પેન્સિલ', slug: 'pens-pencils', iconName: 'pen' },
      { name: 'Art & Craft', nameGu: 'આર્ટ અને ક્રાફ્ટ', slug: 'art-craft', iconName: 'palette' },
    ],
  },
  {
    name: 'Hardware', nameGu: 'હાર્ડવેર', slug: 'hardware', iconName: 'wrench',
    children: [
      { name: 'Tools', nameGu: 'ઓજારો', slug: 'tools', iconName: 'wrench' },
      { name: 'Electrical', nameGu: 'ઇલેક્ટ્રિકલ', slug: 'electrical', iconName: 'bulb' },
      { name: 'Paints', nameGu: 'રંગ', slug: 'paints', iconName: 'paint' },
    ],
  },
  {
    name: 'Chemist', nameGu: 'કેમિસ્ટ', slug: 'chemist', iconName: 'pill',
    children: [
      { name: 'OTC Medicines', nameGu: 'ઓટીસી દવાઓ', slug: 'otc-medicines', iconName: 'pill' },
      { name: 'First Aid', nameGu: 'પ્રાથમિક સારવાર', slug: 'first-aid', iconName: 'bandage' },
      { name: 'Baby Care', nameGu: 'બાળ સંભાળ', slug: 'baby-care', iconName: 'baby' },
    ],
  },
  {
    name: 'Vegetables', nameGu: 'શાકભાજી', slug: 'vegetables', iconName: 'carrot',
    children: [
      { name: 'Fresh Vegetables', nameGu: 'તાજા શાકભાજી', slug: 'fresh-vegetables', iconName: 'carrot' },
      { name: 'Fresh Fruits', nameGu: 'તાજા ફળો', slug: 'fresh-fruits', iconName: 'apple' },
    ],
  },
  {
    name: 'Farsan', nameGu: 'ફરસાણ', slug: 'farsan', iconName: 'bowl',
    children: [
      { name: 'Namkeen Farsan', nameGu: 'નમકીન ફરસાણ', slug: 'namkeen-farsan', iconName: 'bowl' },
      { name: 'Sweets & Mithai', nameGu: 'મીઠાઈ', slug: 'sweets-mithai', iconName: 'sweet' },
    ],
  },
]
