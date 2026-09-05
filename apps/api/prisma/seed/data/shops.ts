import type { ShopType } from '@shopnear/shared'

export interface ShopSeed {
  name: string
  nameGu: string
  type: ShopType
  ownerName: string
  /** Fixed phone so the demo script can rely on it. Two phones repeat across
   *  entries — those owners run a second shop — which is why there are 14
   *  shops but only 12 distinct merchant phones/accounts. */
  ownerPhone: string
  /** Placement relative to the Navrangpura anchor — reproducible by design. */
  distanceMetres: number
  bearing: number
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  acceptsDelivery: boolean
  address: string
  description: string
}

/**
 * 14 shops: 5 kirana, 2 general, and one each of the seven specialist types.
 * Two PENDING (so the approval queue has content) and one SUSPENDED.
 * The first three sit within 150 m of the default customer address, which is
 * what makes the "shop next door" story land in the first ten seconds.
 */
export const SHOP_SEED: ShopSeed[] = [
  {
    name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા', type: 'KIRANA',
    ownerName: 'Rajesh Patel', ownerPhone: '9000000010',
    distanceMetres: 80, bearing: 35, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Shop 4, Vijay Cross Road, Navrangpura',
    description: 'Family-run kirana stocking daily essentials since 1998.',
  },
  {
    name: 'Patel General Store', nameGu: 'પટેલ જનરલ સ્ટોર', type: 'GENERAL',
    ownerName: 'Kiran Patel', ownerPhone: '9000000011',
    distanceMetres: 340, bearing: 120, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Near Navrangpura Post Office',
    description: 'General store with household and personal-care range.',
  },
  {
    name: 'Navrangpura Kirana Stores', nameGu: 'નવરંગપુરા કિરાણા સ્ટોર્સ', type: 'KIRANA',
    ownerName: 'Bharat Shah', ownerPhone: '9000000012',
    distanceMetres: 120, bearing: 200, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Opp. Municipal Garden, Navrangpura',
    description: 'Long-standing neighbourhood kirana with a loyal customer base.',
  },
  {
    name: 'Vijay Kirana', nameGu: 'વિજય કિરાણા', type: 'KIRANA',
    ownerName: 'Vijay Thakkar', ownerPhone: '9000000013',
    distanceMetres: 140, bearing: 300, status: 'ACTIVE', acceptsDelivery: false,
    address: 'C-12, Sardar Patel Society, Navrangpura',
    description: 'Compact kirana specialising in dry-fruits and spices.',
  },
  {
    name: 'Ambica Kirana', nameGu: 'અંબિકા કિરાણા', type: 'KIRANA',
    ownerName: 'Deepak Solanki', ownerPhone: '9000000014',
    distanceMetres: 500, bearing: 45, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Ambica Chowk, Navrangpura',
    description: 'Everyday grocery and staples at neighbourhood prices.',
  },
  {
    name: 'Shree Ganesh General Store', nameGu: 'શ્રી ગણેશ જનરલ સ્ટોર', type: 'GENERAL',
    ownerName: 'Mahesh Vyas', ownerPhone: '9000000015',
    distanceMetres: 650, bearing: 270, status: 'PENDING', acceptsDelivery: false,
    address: 'Ganesh Nagar Road, Navrangpura',
    description: 'Newly registered general store awaiting approval.',
  },
  {
    name: 'Navkar Stationery', nameGu: 'નવકાર સ્ટેશનરી', type: 'STATIONERY',
    ownerName: 'Paresh Jain', ownerPhone: '9000000016',
    distanceMetres: 800, bearing: 10, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Opp. Gujarat College, Navrangpura',
    description: 'Stationery, school supplies, and printed forms.',
  },
  {
    name: 'Ahmedabad Hardware Mart', nameGu: 'અમદાવાદ હાર્ડવેર માર્ટ', type: 'HARDWARE',
    ownerName: 'Sanjay Chauhan', ownerPhone: '9000000017',
    distanceMetres: 950, bearing: 160, status: 'ACTIVE', acceptsDelivery: false,
    address: 'Hardware Lane, Navrangpura',
    description: 'Tools, fittings, and everyday hardware supplies.',
  },
  {
    name: 'Shivam Medical & Chemist', nameGu: 'શિવમ મેડિકલ એન્ડ કેમિસ્ટ', type: 'CHEMIST',
    ownerName: 'Dr. Alpesh Trivedi', ownerPhone: '9000000018',
    distanceMetres: 1100, bearing: 90, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Near C.U. Shah Hospital, Navrangpura',
    description: 'Neighbourhood chemist with a 24x7 emergency counter.',
  },
  {
    name: 'Anand Bakery', nameGu: 'આનંદ બેકરી', type: 'BAKERY',
    ownerName: 'Ramesh Gohil', ownerPhone: '9000000019',
    distanceMetres: 1300, bearing: 220, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Anand Bakery Lane, Navrangpura',
    description: 'Fresh bread, cakes, and bakery snacks daily.',
  },
  {
    name: 'Amul Dairy Parlour', nameGu: 'અમૂલ ડેરી પાર્લર', type: 'DAIRY',
    ownerName: 'Jignesh Barot', ownerPhone: '9000000020',
    distanceMetres: 1500, bearing: 310, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Amul Parlour, Navrangpura Char Rasta',
    description: 'Milk, curd, and dairy products delivered fresh each morning.',
  },
  {
    name: 'Gujarat Farsan Mart', nameGu: 'ગુજરાત ફરસાણ માર્ટ', type: 'FARSAN',
    ownerName: 'Hitesh Modi', ownerPhone: '9000000021',
    distanceMetres: 1800, bearing: 60, status: 'SUSPENDED', acceptsDelivery: false,
    address: 'Farsan Bazaar, Navrangpura',
    description: 'Suspended pending a licence renewal review.',
  },
  {
    name: 'Fresh Veggie Corner', nameGu: 'ફ્રેશ વેજી કોર્નર', type: 'VEGETABLE',
    ownerName: 'Bharat Shah', ownerPhone: '9000000012',
    distanceMetres: 2100, bearing: 140, status: 'PENDING', acceptsDelivery: false,
    address: 'Veggie Market, off Ashram Road',
    description: 'New vegetable stall awaiting admin approval.',
  },
  {
    name: 'Krishna Kirana Stores', nameGu: 'કૃષ્ણ કિરાણા સ્ટોર્સ', type: 'KIRANA',
    ownerName: 'Dr. Alpesh Trivedi', ownerPhone: '9000000018',
    distanceMetres: 2400, bearing: 200, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Krishna Society, off Ashram Road',
    description: 'Second-generation kirana serving the wider Navrangpura area.',
  },
]
