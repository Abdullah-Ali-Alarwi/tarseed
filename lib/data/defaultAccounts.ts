export type DefaultAccount = {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  nature: "debit" | "credit";
  parentCode: string | null;
  isGroup: boolean;
};

export const defaultAccounts: DefaultAccount[] = [
  // ==================================
  // الأصول
  // ==================================

  {
    code: "1000",
    name: "الأصول",
    type: "asset",
    nature: "debit",
    parentCode: null,
    isGroup: true,
  },
  {
    code: "1100",
    name: "الأصول المتداولة",
    type: "asset",
    nature: "debit",
    parentCode: "1000",
    isGroup: true,
  },
  {
    code: "1101",
    name: "الصندوق",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1102",
    name: "البنوك",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1103",
    name: "العملاء",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1104",
    name: "المخزون",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1105",
    name: "ضريبة القيمة المضافة المدخلة",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1106",
    name: "العهد والسلف",
    type: "asset",
    nature: "debit",
    parentCode: "1100",
    isGroup: false,
  },
  {
    code: "1200",
    name: "الأصول الثابتة",
    type: "asset",
    nature: "debit",
    parentCode: "1000",
    isGroup: true,
  },
  {
    code: "1201",
    name: "الأثاث والمعدات",
    type: "asset",
    nature: "debit",
    parentCode: "1200",
    isGroup: false,
  },
  {
    code: "1202",
    name: "مجمع الإهلاك",
    type: "asset",
    nature: "credit",
    parentCode: "1200",
    isGroup: false,
  },

  // ==================================
  // الالتزامات
  // ==================================

  {
    code: "2000",
    name: "الالتزامات",
    type: "liability",
    nature: "credit",
    parentCode: null,
    isGroup: true,
  },
  {
    code: "2100",
    name: "الالتزامات المتداولة",
    type: "liability",
    nature: "credit",
    parentCode: "2000",
    isGroup: true,
  },
  {
    code: "2101",
    name: "الموردون",
    type: "liability",
    nature: "credit",
    parentCode: "2100",
    isGroup: false,
  },
  {
    code: "2102",
    name: "ضريبة القيمة المضافة المخرجة",
    type: "liability",
    nature: "credit",
    parentCode: "2100",
    isGroup: false,
  },
  {
    code: "2103",
    name: "المصروفات المستحقة",
    type: "liability",
    nature: "credit",
    parentCode: "2100",
    isGroup: false,
  },
  {
    code: "2200",
    name: "الالتزامات طويلة الأجل",
    type: "liability",
    nature: "credit",
    parentCode: "2000",
    isGroup: true,
  },
  {
    code: "2201",
    name: "القروض طويلة الأجل",
    type: "liability",
    nature: "credit",
    parentCode: "2200",
    isGroup: false,
  },

  // ==================================
  // حقوق الملكية
  // ==================================

  {
    code: "3000",
    name: "حقوق الملكية",
    type: "equity",
    nature: "credit",
    parentCode: null,
    isGroup: true,
  },
  {
    code: "3101",
    name: "رأس المال",
    type: "equity",
    nature: "credit",
    parentCode: "3000",
    isGroup: false,
  },
  {
    code: "3102",
    name: "الأرباح المحتجزة",
    type: "equity",
    nature: "credit",
    parentCode: "3000",
    isGroup: false,
  },

  // ==================================
  // الإيرادات
  // ==================================

  {
    code: "4000",
    name: "الإيرادات",
    type: "revenue",
    nature: "credit",
    parentCode: null,
    isGroup: true,
  },
  {
    code: "4100",
    name: "إيرادات المبيعات",
    type: "revenue",
    nature: "credit",
    parentCode: "4000",
    isGroup: true,
  },
  {
    code: "4101",
    name: "مبيعات العسل",
    type: "revenue",
    nature: "credit",
    parentCode: "4100",
    isGroup: false,
  },
  {
    code: "4102",
    name: "مبيعات الزيوت",
    type: "revenue",
    nature: "credit",
    parentCode: "4100",
    isGroup: false,
  },
  {
    code: "4103",
    name: "إيرادات خدمات العمرة",
    type: "revenue",
    nature: "credit",
    parentCode: "4100",
    isGroup: false,
  },
  {
    code: "4200",
    name: "مردودات المبيعات",
    type: "revenue",
    nature: "debit",
    parentCode: "4000",
    isGroup: true,
  },
  {
    code: "4201",
    name: "مردودات المبيعات",
    type: "revenue",
    nature: "debit",
    parentCode: "4200",
    isGroup: false,
  },

  // ==================================
  // المصروفات
  // ==================================

  {
    code: "5000",
    name: "المصروفات",
    type: "expense",
    nature: "debit",
    parentCode: null,
    isGroup: true,
  },
  {
    code: "5100",
    name: "تكلفة البضاعة المباعة",
    type: "expense",
    nature: "debit",
    parentCode: "5000",
    isGroup: true,
  },
  {
    code: "5101",
    name: "تكلفة البضاعة المباعة",
    type: "expense",
    nature: "debit",
    parentCode: "5100",
    isGroup: false,
  },
  {
    code: "5200",
    name: "المصروفات التشغيلية",
    type: "expense",
    nature: "debit",
    parentCode: "5000",
    isGroup: true,
  },
  {
    code: "5201",
    name: "الرواتب",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
  {
    code: "5202",
    name: "الإيجارات",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
  {
    code: "5203",
    name: "الكهرباء والمياه",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
  {
    code: "5204",
    name: "النقل",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
  {
    code: "5205",
    name: "الإهلاك",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
  {
    code: "5206",
    name: "العمولات والمصاريف البنكية",
    type: "expense",
    nature: "debit",
    parentCode: "5200",
    isGroup: false,
  },
];