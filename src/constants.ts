export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  hasOptions?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  // Bakmie
  {
    id: 'bakmie-kering',
    name: 'Bakmie Kering Kalimantan',
    category: 'Bakmie',
    description: 'Bakmie khas Kalimantan dengan bumbu gurih dan topping lengkap.',
  },
  {
    id: 'bakmie-kuah',
    name: 'Bakmie Kuah Kalimantan',
    category: 'Bakmie',
    description: 'Bakmie dengan kuah kaldu hangat yang segar dan nikmat.',
  },
  {
    id: 'bakmie-goreng',
    name: 'Bakmie Goreng Kalimantan',
    category: 'Bakmie',
    description: 'Bakmie goreng dengan bumbu khas yang meresap sempurna.',
  },
  // Kwetiao
  {
    id: 'kwetiao-goreng',
    name: 'Kwetiao Goreng',
    category: 'Kwetiao',
    description: 'Kwetiao goreng dengan aroma smokey yang menggugah selera.',
  },
  {
    id: 'kwetiao-kering',
    name: 'Kwetiao Kering',
    category: 'Kwetiao',
    description: 'Kwetiao tanpa kuah dengan bumbu spesial.',
  },
  {
    id: 'kwetiao-kuah',
    name: 'Kwetiao Kuah',
    category: 'Kwetiao',
    description: 'Kwetiao lembut dengan kuah kaldu bening yang gurih.',
  },
  // Capcai
  {
    id: 'capcai-kering',
    name: 'Capcai Kering',
    category: 'Capcai',
    description: 'Tumis aneka sayuran segar dengan bumbu khas.',
  },
  {
    id: 'capcai-kuah',
    name: 'Capcai Kuah',
    category: 'Capcai',
    description: 'Sayuran segar dalam kuah kental yang hangat.',
  },
  // Nasi
  {
    id: 'kaifon',
    name: 'Nasi Campur',
    category: 'Nasi',
    description: 'Nasi campur khas Kalimantan Barat dengan aneka topping daging.',
  },
  // Minuman
  {
    id: 'jeruk-nipis',
    name: 'Jeruk Nipis',
    category: 'Minuman',
    description: 'Segar dan asam manis alami.',
    hasOptions: true
  },
  {
    id: 'teh',
    name: 'Teh',
    category: 'Minuman',
    description: 'Teh manis klasik.',
    hasOptions: true
  },
  {
    id: 'susu-kedelai',
    name: 'Susu Kedelai',
    category: 'Minuman',
    description: 'Susu kedelai murni yang menyehatkan.',
    hasOptions: true
  },
  {
    id: 'kopi',
    name: 'Kopi',
    category: 'Minuman',
    description: 'Kopi hitam mantap.',
    hasOptions: true
  },
  {
    id: 'extra-joss',
    name: 'Extra Joss',
    category: 'Minuman',
    description: 'Minuman energi untuk stamina.',
    hasOptions: true
  }
];
