/**
 * Specialized Automotive Taxonomy & Arabic Synonyms Normalizer
 * Tailored for Commercial Transport Vehicles, Pickup Trucks, Microbuses, Vans & Heavy/Light Trucks:
 * (شيفروليه الدبابة والجامبو، إيسوزو ديماكس، تويوتا هيلوكس والميكروباص، كانتر، سوزوكي فان ونصف نقل، هيونداي H100 و HD).
 */

export const CAR_MAKES = {
  // 1. شيفروليه / شفر (الملك الأول لسيارات النقل في مصر)
  chevrolet: {
    nameAr: 'شيفروليه',
    synonyms: ['شيفروليه', 'شفروليه', 'شفر', 'chevrolet', 'chevy', 'شيفورليه'],
    models: {
      dababa: {
        nameAr: 'الدبابة (نصف نقل)',
        synonyms: [
          'الدبابة', 'دبابة', 'نص نقل', 'بيك اب', 't-series', 'tfr', 'tfs', 
          'دبابه', 'شفر دبابة', 'دبابة باور', 'وش خشب', 'كريستال', 'الشكل الجديد', 'ديماكس شفر'
        ],
      },
      jumbo: {
        nameAr: 'الجامبو (نقل جامبو)',
        synonyms: [
          'جامبو', 'الجامبو', 'jumbo', 'شفر جامبو', 'npr', 'nqr', 'nhr',
          'جامبو 7000', 'جامبو 8000', 'جامبو 5000', 'جامبو 6000', 'شاسية طويل', 'شاسية قصير'
        ],
      },
      n300: {
        nameAr: 'الجوكر N300 (فان 8 راكب)',
        synonyms: ['n300', 'الجوكر', 'فان شفر', 'موف', 'move', 'توناية شفر', 'شيفروليه فان'],
      },
      optra: { nameAr: 'أوبترا', synonyms: ['أوبترا', 'اوبترا', 'optra'] },
      aveo: { nameAr: 'أفيو', synonyms: ['أفيو', 'افيو', 'aveo'] },
      lanos: { nameAr: 'لانوس', synonyms: ['لانوس', 'lanos', 'دايو لانوس'] },
    },
  },

  // 2. إيسوزو (Isuzu) - الديزل والنقل الأصلي
  isuzu: {
    nameAr: 'إيسوزو',
    synonyms: ['إيسوزو', 'ايسوزو', 'isuzu', 'اسوزو'],
    models: {
      dmax: {
        nameAr: 'إيسوزو ديماكس (D-Max)',
        synonyms: ['ديماكس', 'dmax', 'd-max', 'ايسوزو بيك اب', 'دي ماكس', 'ديماكس دبل', 'ديماكس سنجل'],
      },
      elf: {
        nameAr: 'إيسوزو إلف / جامبو (ELF)',
        synonyms: ['elf', 'الف', 'إلف', 'isuzu npr', 'isuzu nqr', 'فوروارد', 'forward', 'إيسوزو نقل'],
      },
    },
  },

  // 3. تويوتا (تويوتا هيلوكس، ميكروباص هايس، لاندكروزر شاص)
  toyota: {
    nameAr: 'تويوتا',
    synonyms: ['تويوتا', 'toyota', 'طويوطا'],
    models: {
      hilux: {
        nameAr: 'تويوتا هيلوكس (Hilux)',
        synonyms: [
          'هيلوكس', 'hilux', 'هايلكس', 'هايلوكس', 'تويوتا نص نقل', 'هيلوكس دبل', 'هيلوكس سنجل', 
          'هيلوكس بنزين', 'هيلوكس ديزل', '2kd', '1gd', 'ديلوكس'
        ],
      },
      hiace: {
        nameAr: 'ميكروباص تويوتا (HiAce)',
        synonyms: [
          'ميكروباص', 'هايس', 'hiace', 'تويوتا ميكروباص', 'سقف عالي', 'سقف واطي',
          'ميكروباص 2l', 'ميكروباص 5l', 'ميكروباص ديزل', 'باص تويوتا'
        ],
      },
      landcruiser_shas: {
        nameAr: 'تويوتا شاص / بيك أب',
        synonyms: ['شاص', 'لاندكروزر بيك اب', 'شاسيه', 'كبسولة', 'land cruiser pickup'],
      },
      corolla: { nameAr: 'كورولا', synonyms: ['كورولا', 'corolla', 'كرولا'] },
      yaris: { nameAr: 'يارس', synonyms: ['يارس', 'yaris'] },
    },
  },

  // 4. ميتسوبيشي فوسو (كانتر و L200 و L300)
  mitsubishi: {
    nameAr: 'ميتسوبيشي فوسو',
    synonyms: ['ميتسوبيشي', 'mitsubishi', 'فوسو', 'fuso', 'مستوبيشي'],
    models: {
      canter: {
        nameAr: 'ميتسوبيشي كانتر (Canter)',
        synonyms: [
          'كانتر', 'canter', 'كانتر 3 طن', 'كانتر 4.5 طن', 'كانتر شاسية', 'فوسو كانتر', 'ريفر'
        ],
      },
      l200: {
        nameAr: 'ميتسوبيشي L200 (نصف نقل)',
        synonyms: ['l200', 'ميتسوبيشي بيك اب', 'ال 200', 'l 200 ديزل'],
      },
      l300: {
        nameAr: 'ميكروباص ميتسوبيشي L300',
        synonyms: ['l300', 'ميكروباص ميتسوبيشي', 'ال 300 فان', 'l 300'],
      },
      lancer: { nameAr: 'لانسر', synonyms: ['لانسر', 'lancer', 'بومة', 'شارك'] },
    },
  },

  // 5. سوزوكي (التُمناية ونصف نقل كاري)
  suzuki: {
    nameAr: 'سوزوكي',
    synonyms: ['سوزوكي', 'suzuki', 'سوزوكى'],
    models: {
      van: {
        nameAr: 'سوزوكي فان (التُمناية)',
        synonyms: ['تمناية', 'التُمناية', 'سوزوكي فان', 'van', 'تمنايه', 'سوزوكي 7 راكب', 'فان 7 راكب'],
      },
      carry: {
        nameAr: 'سوزوكي نص نقل (Carry بيك أب)',
        synonyms: ['سوزوكي كاري', 'carry', 'سوزوكي نص نقل', 'سوزوكي بيك اب', 'كاري نص نقل'],
      },
    },
  },

  // 6. هيونداي (H100 بورتر، شاحنات HD، ميكروباص H1)
  hyundai: {
    nameAr: 'هيونداي',
    synonyms: ['هيونداي', 'hyundai', 'هيونداى'],
    models: {
      h100: {
        nameAr: 'هيونداي H100 (بورتر)',
        synonyms: ['h100', 'h-100', 'بورتر', 'porter', 'اتش 100', 'هيونداي نص نقل'],
      },
      hd: {
        nameAr: 'شاحنات هيونداي HD (HD65 / HD72 / HD78)',
        synonyms: ['hd65', 'hd72', 'hd78', 'hd', 'هيونداي جامبو', 'شاحنة هيونداي'],
      },
      h1: {
        nameAr: 'هيونداي H1 (ميكروباص / فان)',
        synonyms: ['h1', 'h-1', 'اتش ون', 'اتش 1', 'جراند ستاركس', 'starex'],
      },
      elantra: { nameAr: 'إلنترا', synonyms: ['إلنترا', 'elantra'] },
      verna: { nameAr: 'فيرنا', synonyms: ['فيرنا', 'verna'] },
    },
  },

  // 7. نيسان (الداتسون ونيسان بيك أب وميكروباص أورفان)
  nissan: {
    nameAr: 'نيسان',
    synonyms: ['نيسان', 'nissan'],
    models: {
      pickup: {
        nameAr: 'نيسان بيك أب (الداتسون)',
        synonyms: ['نيسان نص نقل', 'داتسون', 'datsun', 'd21', 'd22', 'نيسان بيك اب', 'صني نص نقل', 'دير'],
      },
      urvan: {
        nameAr: 'نيسان أورفان ميكروباص (Urvan)',
        synonyms: ['اورفان', 'urvan', 'نيسان ميكروباص', 'أورفان'],
      },
      sunny: { nameAr: 'صني', synonyms: ['صني', 'sunny'] },
    },
  },

  // 8. ميكروباص ونقل صيني (كينج لونج، فوتون، جولدن دراجون)
  chinese_trucks: {
    nameAr: 'نقل وميكروباص صيني',
    synonyms: ['صيني', 'كينج لونج', 'فوتون', 'جولدن دراجون', 'king long', 'foton', 'golden dragon'],
    models: {
      kinglong: {
        nameAr: 'ميكروباص كينج لونج (King Long)',
        synonyms: ['كينج لونج', 'king long', 'كينج لونغ', 'ميكروباص صيني'],
      },
      foton: {
        nameAr: 'فوتون (Foton بيك أب وتراكس)',
        synonyms: ['فوتون', 'foton', 'بيك اب فوتون', 'فوتون نقل'],
      },
      goldendragon: {
        nameAr: 'جولدن دراجون (Golden Dragon)',
        synonyms: ['جولدن دراجون', 'golden dragon', 'دراجون'],
      },
    },
  },
}

/**
 * Commercial Vehicle & Truck Spare Parts Taxonomy (سست، عفشة نقل، كرونة، دفرنس، جاز، دبرياج)
 */
export const PART_TAXONOMY = {
  leaf_springs: {
    code: 'leaf_springs',
    nameAr: 'سوست وورق سوست (عفشة نقل)',
    synonyms: [
      'سوست', 'سوسته', 'ورق سوست', 'ورقة سوستة', 'ورقة اولى', 'ورقة تانية', 'ورقة تالتة',
      'قنطرة سوست', 'بنز سوستة', 'جلب سوست', 'كراسي سوست', 'شناكل', 'صدادات سوست', 'أفيز سوستة',
      'leaf spring', 'spring bushing', 'u-bolt'
    ],
    relatedParts: ['shock_absorbers', 'leaf_spring_bushings', 'u_bolts', 'differential_axle'],
  },
  brake_pads_heavy: {
    code: 'brake_pads',
    nameAr: 'تيل فرامل (أمامي / خلفي / طبلة)',
    synonyms: [
      'تيل فرامل', 'تيل', 'تيل دبابة', 'تيل جامبو', 'تيل خلفي طبلة', 'لقم فرامل',
      'تيل هواء', 'تيل باكم', 'فحمات', 'brake pads', 'brake shoes'
    ],
    relatedParts: ['brake_discs', 'brake_drums', 'brake_master_cylinder', 'wheel_cylinder'],
  },
  brake_drums_discs: {
    code: 'brake_discs',
    nameAr: 'طنابير وطبلة فرامل ثقيلة',
    synonyms: [
      'طنابير', 'طنبورة', 'طبلة فرامل', 'ديسكات', 'طبلة خلفي', 'طنابير امامي',
      'brake drums', 'brake rotors', 'brake discs'
    ],
    relatedParts: ['brake_pads_heavy', 'wheel_bearings'],
  },
  clutch_kit: {
    code: 'clutch_kit',
    nameAr: 'طقم دبرياج (ديسك وأسطوانة وبلية)',
    synonyms: [
      'دبرياج', 'ديسك دبرياج', 'اسطوانة دبرياج', 'اسطوانه', 'ديسك', 'بلية دبرياج',
      'طقم دبرياج نحاس', 'دبرياج مقوى', 'ماستر دبرياج علوي', 'ماستر دبرياج سفلي', 'clutch kit', 'clutch plate'
    ],
    relatedParts: ['flywheel', 'clutch_master_cylinder', 'release_bearing'],
  },
  differential_crown: {
    code: 'differential_crown',
    nameAr: 'كرونة ودفرنس وتروس',
    synonyms: [
      'كرونة', 'كرونه', 'دفرنس', 'تاجي وبنيون', 'تروس اقمار', 'بنيون', 'تاج',
      'سيل كرونة', 'زيت دفرنس', 'differential', 'crown and pinion'
    ],
    relatedParts: ['propeller_shaft_cross', 'axle_shaft', 'differential_oil'],
  },
  propeller_shaft_cross: {
    code: 'propeller_shaft_cross',
    nameAr: 'صلايب وعمود كردان وكراسي نص',
    synonyms: [
      'صلايب كردان', 'صليبة كردان', 'عمود كردان', 'كرسي نص عمود', 'كرسي نص',
      'صليبه', 'حامل كردان', 'universal joint', 'center bearing', 'drive shaft'
    ],
    relatedParts: ['differential_crown', 'transmission_mounts'],
  },
  wheel_bearings: {
    code: 'wheel_bearings',
    nameAr: 'بلي عجل وصرر (أمامي وخلفي)',
    synonyms: [
      'بلي عجل', 'بلية عجل', 'بلي صرة', 'صرة عجل', 'بلي خلفي', 'بلي امامي داخلي', 'بلي خارجي',
      'wheel bearing', 'hub bearing', 'wheel hub'
    ],
    relatedParts: ['grease_heavy', 'oil_seals', 'brake_drums_discs'],
  },
  diesel_fuel_system: {
    code: 'diesel_fuel_system',
    nameAr: 'رشاشات ديزل وطلمبة جاز وفلتر فاصل',
    synonyms: [
      'رشاشات ديزل', 'رشاشات', 'طلمبة جاز', 'فلتر جاز', 'فلتر فاصل مياه', 'طلمبة حقن',
      'طلمبة تغذية', 'بلف راجع', 'ديزل', 'diesel injectors', 'fuel water separator', 'diesel filter'
    ],
    relatedParts: ['engine_oil', 'glow_plugs', 'air_filter_heavy'],
  },
  glow_plugs: {
    code: 'glow_plugs',
    nameAr: 'سخانات ديزل وبوجيهات تسخين',
    synonyms: [
      'سخانات ديزل', 'سخانات', 'شمعات تسخين', 'سخان ديزل', 'glow plugs', 'heater plugs'
    ],
    relatedParts: ['diesel_fuel_system', 'battery_heavy'],
  },
  oil_filter_heavy: {
    code: 'oil_filter',
    nameAr: 'فلتر زيت ديزل / شاحنات',
    synonyms: ['فلتر زيت', 'فلتر زيت ديزل', 'صفاية زيت', 'oil filter'],
    relatedParts: ['engine_oil_diesel', 'diesel_fuel_system', 'air_filter_heavy'],
  },
  air_filter_heavy: {
    code: 'air_filter',
    nameAr: 'فلتر هواء برميل ونقل',
    synonyms: ['فلتر هواء', 'فلتر هواء برميل', 'فلتر هوا دبابة', 'air filter'],
    relatedParts: ['oil_filter_heavy', 'turbocharger'],
  },
  engine_oil_diesel: {
    code: 'engine_oil',
    nameAr: 'زيت محرك ديزل وثقيل (15W40 / 20W50)',
    synonyms: ['زيت ديزل', 'زيت محرك ديزل', '15w40', '20w50', 'زيت شل ريمولا', 'موبيل ديلمvac', 'توتال ربيك'],
    relatedParts: ['oil_filter_heavy'],
  },
  radiator_cooling: {
    code: 'radiator_cooling',
    nameAr: 'ريداتير نحاس 3/4 ماسورة ومروحة كلتش',
    synonyms: [
      'ريداتير', 'ردياتير', 'ريداتير نحاس', 'ريداتير 3 ماسورة', 'ريداتير 4 ماسورة',
      'مروحة كلتش', 'كلتش مروحة', 'طلمبة مياه ديزل', 'ثيرموستات', 'radiator', 'water pump', 'fan clutch'
    ],
    relatedParts: ['coolant_heavy', 'fan_belt'],
  },
  shock_absorbers: {
    code: 'shock_absorbers',
    nameAr: 'مساعدين زيت وغاز ثقيل (أمامي وخلفي)',
    synonyms: [
      'مساعدين', 'مساعد', 'مساعدين امامي', 'مساعدين خلفي', 'مساعدين نقل', 'مساعدين ياباني',
      'shock absorber', 'struts'
    ],
    relatedParts: ['leaf_springs'],
  },
  engine_rebuild_parts: {
    code: 'engine_rebuild_parts',
    nameAr: 'طقم شنبر وبساتم وجلب ووش سلندر ديزل',
    synonyms: [
      'طقم شنبر', 'بساتم', 'بستم', 'جلب بستم', 'وش سلندر', 'جوان وش سلندر', 'سبائك كرنك',
      'عمود كرنك', 'تيربو', 'turbo', 'piston rings', 'cylinder head gasket'
    ],
    relatedParts: ['engine_oil_diesel', 'oil_filter_heavy'],
  },
  battery_heavy: {
    code: 'battery',
    nameAr: 'بطاريات شاحنات ونقل (70 - 100 - 150 أمبير)',
    synonyms: ['بطارية', 'بطارية 70 امبير', 'بطارية 90 امبير', 'بطارية 100 امبير', 'بطارية ديزل', 'battery'],
    relatedParts: [],
  },
}

/**
 * Normalizes Arabic text (removes diacritics, unifies alef, yaa, etc.)
 */
export function normalizeArabic(text = '') {
  if (!text) return ''
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * Specialized entity extractor for commercial transport & auto parts queries
 */
export function extractAutomotiveEntities(rawQuery = '') {
  const norm = normalizeArabic(rawQuery)
  const result = {
    make: null,
    model: null,
    year: null,
    partType: null,
    placement: null,
    rawQuery,
    isCommercial: true,
  }

  // 1. Extract Year
  const yearMatch = norm.match(/\b(19\d\d|20\d\d)\b/)
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10)
  }

  // 2. Extract Placement
  if (norm.includes('امامي') || norm.includes('قدام') || norm.includes('front')) {
    result.placement = 'front'
  } else if (norm.includes('خلفي') || norm.includes('ورا') || norm.includes('rear')) {
    result.placement = 'rear'
  }

  // 3. Extract Make and Model (Prioritizing Commercial Trucks & Pickups)
  for (const [makeKey, makeData] of Object.entries(CAR_MAKES)) {
    const makeMatched = makeData.synonyms.some(s => norm.includes(normalizeArabic(s)))
    if (makeMatched) {
      result.make = {
        key: makeKey,
        nameAr: makeData.nameAr,
      }
      for (const [modelKey, modelData] of Object.entries(makeData.models)) {
        const modelMatched = modelData.synonyms.some(s => norm.includes(normalizeArabic(s)))
        if (modelMatched) {
          result.model = {
            key: modelKey,
            nameAr: modelData.nameAr,
          }
          break
        }
      }
      break
    }
  }

  // If model was mentioned without make (e.g. "تيل فرامل دبابة 2020" or "سوست جامبو 7000")
  if (!result.model) {
    for (const [makeKey, makeData] of Object.entries(CAR_MAKES)) {
      for (const [modelKey, modelData] of Object.entries(makeData.models)) {
        const modelMatched = modelData.synonyms.some(s => norm.includes(normalizeArabic(s)))
        if (modelMatched) {
          result.make = { key: makeKey, nameAr: makeData.nameAr }
          result.model = { key: modelKey, nameAr: modelData.nameAr }
          break
        }
      }
      if (result.model) break
    }
  }

  // 4. Extract Part Category
  for (const [partKey, partData] of Object.entries(PART_TAXONOMY)) {
    const partMatched = partData.synonyms.some(s => norm.includes(normalizeArabic(s)))
    if (partMatched) {
      result.partType = {
        code: partData.code,
        nameAr: partData.nameAr,
        relatedParts: partData.relatedParts,
      }
      break
    }
  }

  return result
}
