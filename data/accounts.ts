
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "cost"
  | "expense";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  level: number;
  isGroup: boolean;
  isActive: boolean;
}

export const accounts: Account[] = [
  // =====================================================
  // الأصول
  // =====================================================

  {
    id: "1000",
    code: "1000",
    name: "الأصول",
    type: "asset",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1100",
    code: "1100",
    name: "الأصول المتداولة",
    type: "asset",
    parentId: "1000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1110",
    code: "1110",
    name: "الصندوق",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1111",
    code: "1111",
    name: "الصندوق الرئيسي",
    type: "asset",
    parentId: "1110",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1112",
    code: "1112",
    name: "الصندوق الفرعي",
    type: "asset",
    parentId: "1110",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1120",
    code: "1120",
    name: "البنوك",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1121",
    code: "1121",
    name: "البنك الرئيسي",
    type: "asset",
    parentId: "1120",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1122",
    code: "1122",
    name: "حساب بنكي آخر",
    type: "asset",
    parentId: "1120",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1130",
    code: "1130",
    name: "العملاء",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1131",
    code: "1131",
    name: "عملاء محليون",
    type: "asset",
    parentId: "1130",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1132",
    code: "1132",
    name: "عملاء آجلون",
    type: "asset",
    parentId: "1130",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1140",
    code: "1140",
    name: "أوراق القبض",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1150",
    code: "1150",
    name: "المخزون",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1151",
    code: "1151",
    name: "مخزون المنتجات",
    type: "asset",
    parentId: "1150",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1152",
    code: "1152",
    name: "مخزون المواد الخام",
    type: "asset",
    parentId: "1150",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1153",
    code: "1153",
    name: "مخزون قطع الغيار",
    type: "asset",
    parentId: "1150",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1160",
    code: "1160",
    name: "المصروفات المدفوعة مقدمًا",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1170",
    code: "1170",
    name: "السلف والعهد",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1180",
    code: "1180",
    name: "الضرائب والرسوم القابلة للاسترداد",
    type: "asset",
    parentId: "1100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // الأصول غير المتداولة

  {
    id: "1200",
    code: "1200",
    name: "الأصول غير المتداولة",
    type: "asset",
    parentId: "1000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1210",
    code: "1210",
    name: "الأراضي",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1220",
    code: "1220",
    name: "المباني",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1230",
    code: "1230",
    name: "السيارات والمركبات",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1240",
    code: "1240",
    name: "الأثاث والتجهيزات",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1250",
    code: "1250",
    name: "أجهزة الكمبيوتر",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1260",
    code: "1260",
    name: "المعدات والآلات",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1270",
    code: "1270",
    name: "مجمع الإهلاك",
    type: "asset",
    parentId: "1200",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "1271",
    code: "1271",
    name: "مجمع إهلاك المباني",
    type: "asset",
    parentId: "1270",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1272",
    code: "1272",
    name: "مجمع إهلاك السيارات",
    type: "asset",
    parentId: "1270",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1273",
    code: "1273",
    name: "مجمع إهلاك الأثاث",
    type: "asset",
    parentId: "1270",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "1274",
    code: "1274",
    name: "مجمع إهلاك المعدات",
    type: "asset",
    parentId: "1270",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  // =====================================================
  // الالتزامات
  // =====================================================

  {
    id: "2000",
    code: "2000",
    name: "الالتزامات",
    type: "liability",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "2100",
    code: "2100",
    name: "الالتزامات المتداولة",
    type: "liability",
    parentId: "2000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "2110",
    code: "2110",
    name: "الموردون",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: true,
    isActive: true,
  },

  {
    id: "2111",
    code: "2111",
    name: "موردون محليون",
    type: "liability",
    parentId: "2110",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2112",
    code: "2112",
    name: "موردون خارجيون",
    type: "liability",
    parentId: "2110",
    level: 4,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2120",
    code: "2120",
    name: "أوراق الدفع",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2130",
    code: "2130",
    name: "المصروفات المستحقة",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2140",
    code: "2140",
    name: "الرواتب والأجور المستحقة",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2150",
    code: "2150",
    name: "الضرائب المستحقة",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2160",
    code: "2160",
    name: "القروض قصيرة الأجل",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2170",
    code: "2170",
    name: "دفعات مقدمة من العملاء",
    type: "liability",
    parentId: "2100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // الالتزامات غير المتداولة

  {
    id: "2200",
    code: "2200",
    name: "الالتزامات غير المتداولة",
    type: "liability",
    parentId: "2000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "2210",
    code: "2210",
    name: "القروض طويلة الأجل",
    type: "liability",
    parentId: "2200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "2220",
    code: "2220",
    name: "التزامات أخرى طويلة الأجل",
    type: "liability",
    parentId: "2200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // =====================================================
  // حقوق الملكية
  // =====================================================

  {
    id: "3000",
    code: "3000",
    name: "حقوق الملكية",
    type: "equity",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "3100",
    code: "3100",
    name: "رأس المال",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "3200",
    code: "3200",
    name: "جاري المالك",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "3300",
    code: "3300",
    name: "المسحوبات الشخصية",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "3400",
    code: "3400",
    name: "الأرباح المحتجزة",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "3500",
    code: "3500",
    name: "الاحتياطي القانوني",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "3600",
    code: "3600",
    name: "صافي الربح / الخسارة",
    type: "equity",
    parentId: "3000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  // =====================================================
  // الإيرادات
  // =====================================================

  {
    id: "4000",
    code: "4000",
    name: "الإيرادات",
    type: "revenue",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "4100",
    code: "4100",
    name: "إيرادات المبيعات",
    type: "revenue",
    parentId: "4000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "4110",
    code: "4110",
    name: "مبيعات المنتجات",
    type: "revenue",
    parentId: "4100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4120",
    code: "4120",
    name: "مبيعات الخدمات",
    type: "revenue",
    parentId: "4100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4130",
    code: "4130",
    name: "مبيعات أخرى",
    type: "revenue",
    parentId: "4100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4200",
    code: "4200",
    name: "مردودات المبيعات",
    type: "revenue",
    parentId: "4000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4300",
    code: "4300",
    name: "الخصم المسموح به",
    type: "revenue",
    parentId: "4000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4400",
    code: "4400",
    name: "إيرادات أخرى",
    type: "revenue",
    parentId: "4000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "4410",
    code: "4410",
    name: "إيرادات استثمارية",
    type: "revenue",
    parentId: "4400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4420",
    code: "4420",
    name: "إيرادات إيجارات",
    type: "revenue",
    parentId: "4400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "4430",
    code: "4430",
    name: "إيرادات متنوعة",
    type: "revenue",
    parentId: "4400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // =====================================================
  // تكلفة المبيعات
  // =====================================================

  {
    id: "5000",
    code: "5000",
    name: "تكلفة المبيعات",
    type: "cost",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "5100",
    code: "5100",
    name: "تكلفة البضاعة المباعة",
    type: "cost",
    parentId: "5000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "5200",
    code: "5200",
    name: "تكلفة المواد",
    type: "cost",
    parentId: "5000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "5300",
    code: "5300",
    name: "تكلفة الخدمات",
    type: "cost",
    parentId: "5000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  {
    id: "5400",
    code: "5400",
    name: "مصاريف الشحن والنقل للمشتريات",
    type: "cost",
    parentId: "5000",
    level: 2,
    isGroup: false,
    isActive: true,
  },

  // =====================================================
  // المصروفات
  // =====================================================

  {
    id: "6000",
    code: "6000",
    name: "المصروفات",
    type: "expense",
    parentId: null,
    level: 1,
    isGroup: true,
    isActive: true,
  },

  {
    id: "6100",
    code: "6100",
    name: "المصروفات الإدارية والعمومية",
    type: "expense",
    parentId: "6000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "6110",
    code: "6110",
    name: "الرواتب والأجور",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6120",
    code: "6120",
    name: "إيجار المبنى",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6130",
    code: "6130",
    name: "الكهرباء والمياه",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6140",
    code: "6140",
    name: "الاتصالات والإنترنت",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6150",
    code: "6150",
    name: "القرطاسية والمطبوعات",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6160",
    code: "6160",
    name: "الصيانة",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6170",
    code: "6170",
    name: "مصاريف النقل",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6180",
    code: "6180",
    name: "مصاريف السفر",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6190",
    code: "6190",
    name: "مصاريف متنوعة",
    type: "expense",
    parentId: "6100",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // مصروفات البيع والتسويق

  {
    id: "6200",
    code: "6200",
    name: "مصروفات البيع والتسويق",
    type: "expense",
    parentId: "6000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "6210",
    code: "6210",
    name: "الإعلانات",
    type: "expense",
    parentId: "6200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6220",
    code: "6220",
    name: "التسويق",
    type: "expense",
    parentId: "6200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6230",
    code: "6230",
    name: "عمولات البيع",
    type: "expense",
    parentId: "6200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6240",
    code: "6240",
    name: "مصاريف التوصيل",
    type: "expense",
    parentId: "6200",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // المصروفات المالية

  {
    id: "6300",
    code: "6300",
    name: "مصروفات مالية",
    type: "expense",
    parentId: "6000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "6310",
    code: "6310",
    name: "فوائد القروض",
    type: "expense",
    parentId: "6300",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6320",
    code: "6320",
    name: "عمولات بنكية",
    type: "expense",
    parentId: "6300",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6330",
    code: "6330",
    name: "فروقات عملة",
    type: "expense",
    parentId: "6300",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  // مصروفات الإهلاك

  {
    id: "6400",
    code: "6400",
    name: "مصروفات الإهلاك",
    type: "expense",
    parentId: "6000",
    level: 2,
    isGroup: true,
    isActive: true,
  },

  {
    id: "6410",
    code: "6410",
    name: "إهلاك المباني",
    type: "expense",
    parentId: "6400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6420",
    code: "6420",
    name: "إهلاك السيارات",
    type: "expense",
    parentId: "6400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6430",
    code: "6430",
    name: "إهلاك الأثاث",
    type: "expense",
    parentId: "6400",
    level: 3,
    isGroup: false,
    isActive: true,
  },

  {
    id: "6440",
    code: "6440",
    name: "إهلاك المعدات",
    type: "expense",
    parentId: "6400",
    level: 3,
    isGroup: false,
    isActive: true,
  },
];


