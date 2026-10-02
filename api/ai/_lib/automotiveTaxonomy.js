/**
 * Comprehensive Automotive Taxonomy & Arabic Synonyms Normalizer
 * Designed specifically for Auto Spare Parts in the Arab / Egyptian Market.
 */

export const CAR_MAKES = {
  toyota: {
    nameAr: 'تويوتا',
    synonyms: ['تويوتا', 'toyota', 'طويوطا'],
    models: {
      corolla: { nameAr: 'كورولا', synonyms: ['كورولا', 'corolla', 'كرولا', 'كورلا', 'جمل', 'مسطرة', 'جنوب أفريقي'] },
      yaris: { nameAr: 'يارس', synonyms: ['يارس', 'yaris', 'ياريس'] },
      hilux: { nameAr: 'هيلوكس', synonyms: ['هيلوكس', 'hilux', 'هايلكس', 'هايلوكس'] },
      fortuner: { nameAr: 'فورتشنر', synonyms: ['فورتشنر', 'fortuner', 'فورتشنير'] },
      camry: { nameAr: 'كامري', synonyms: ['كامري', 'camry', 'كمري'] },
      rav4: { nameAr: 'راف فور', synonyms: ['راف 4', 'rav4', 'rav 4', 'راف فور'] },
    },
  },
  hyundai: {
    nameAr: 'هيونداي',
    synonyms: ['هيونداي', 'hyundai', 'هيونداى', 'هيوندي'],
    models: {
      elantra: { nameAr: 'إلنترا', synonyms: ['إلنترا', 'النترا', 'elantra', 'hd', 'md', 'ad', 'cn7', 'جمل'] },
      accent: { nameAr: 'أكسنت', synonyms: ['أكسنت', 'اكسنت', 'accent', 'rb', 'hcr'] },
      verna: { nameAr: 'فيرنا', synonyms: ['فيرنا', 'verna', 'فرنا'] },
      tucson: { nameAr: 'توسان', synonyms: ['توسان', 'tucson', 'تكسون', 'توسون'] },
      i10: { nameAr: 'آي 10', synonyms: ['i10', 'آي 10', 'اي 10', 'جراند i10'] },
      matrix: { nameAr: 'ماتريكس', synonyms: ['ماتريكس', 'matrix', 'ماتركس'] },
    },
  },
  kia: {
    nameAr: 'كيا',
    synonyms: ['كيا', 'kia'],
    models: {
      cerato: { nameAr: 'سيراتو', synonyms: ['سيراتو', 'cerato', 'forte', 'سراتو', 'k3'] },
      sportage: { nameAr: 'سبورتاج', synonyms: ['سبورتاج', 'sportage', 'سبورتج'] },
      rio: { nameAr: 'ريو', synonyms: ['ريو', 'rio'] },
      picanto: { nameAr: 'بيكانتو', synonyms: ['بيكانتو', 'picanto', 'بكانتو'] },
      carens: { nameAr: 'كارنز', synonyms: ['كارنز', 'carens', 'كارنس'] },
    },
  },
  mitsubishi: {
    nameAr: 'ميتسوبيشي',
    synonyms: ['ميتسوبيشي', 'mitsubishi', 'مستوبيشي', 'ميتسوبيشى'],
    models: {
      lancer_poma: { nameAr: 'لانسر بومة', synonyms: ['لانسر بومة', 'بومة', 'lancer poma', 'بومه'] },
      lancer_shark: { nameAr: 'لانسر شارك', synonyms: ['لانسر شارك', 'شارك', 'lancer shark', 'ex'] },
      pajero: { nameAr: 'باجيرو', synonyms: ['باجيرو', 'pajero', 'باجيرو'] },
      attrage: { nameAr: 'أتراج', synonyms: ['أتراج', 'attrage', 'اتراج'] },
    },
  },
  chevrolet: {
    nameAr: 'شيفروليه',
    synonyms: ['شيفروليه', 'chevrolet', 'شيفورليه', 'شفروليه', 'شفر'],
    models: {
      optra: { nameAr: 'أوبترا', synonyms: ['أوبترا', 'اوبترا', 'optra'] },
      aveo: { nameAr: 'أفيو', synonyms: ['أفيو', 'افيو', 'aveo'] },
      cruze: { nameAr: 'كروز', synonyms: ['كروز', 'cruze'] },
      lanos: { nameAr: 'لانوس', synonyms: ['لانوس', 'lanos', 'دايو لانوس'] },
      tseries: { nameAr: 'الدبابة', synonyms: ['الدبابة', 'دبابة', 't-series', 'جامبو'] },
    },
  },
  nissan: {
    nameAr: 'نيسان',
    synonyms: ['نيسان', 'nissan', 'نيصان'],
    models: {
      sunny: { nameAr: 'صني', synonyms: ['صني', 'sunny', 'n16', 'n17', 'صنى'] },
      sentra: { nameAr: 'سنترا', synonyms: ['سنترا', 'sentra', 'b17'] },
      qashqai: { nameAr: 'قشقاي', synonyms: ['قشقاي', 'qashqai', 'كشكاي', 'قشقاى'] },
      tiida: { nameAr: 'تيدا', synonyms: ['تيدا', 'tiida'] },
    },
  },
  renault: {
    nameAr: 'رينو',
    synonyms: ['رينو', 'renault', 'رينولت'],
    models: {
      logan: { nameAr: 'لوجان', synonyms: ['لوجان', 'logan', 'لوغان'] },
      megane: { nameAr: 'ميجان', synonyms: ['ميجان', 'megane', 'ميجان 2', 'ميجان 3', 'ميجان 4'] },
      duster: { nameAr: 'داستر', synonyms: ['داستر', 'duster', 'دستر'] },
      sandero: { nameAr: 'سانديرو', synonyms: ['سانديرو', 'sandero', 'ستيب واي', 'stepway'] },
      fluence: { nameAr: 'فلوانس', synonyms: ['فلوانس', 'fluence', 'فلونس'] },
    },
  },
  fiat: {
    nameAr: 'فيات',
    synonyms: ['فيات', 'fiat'],
    models: {
      tipo: { nameAr: 'تيبو', synonyms: ['تيبو', 'tipo', 'تيبو سيدان', 'تيبو هاتشباك'] },
      punto: { nameAr: 'بونتو', synonyms: ['بونتو', 'punto', 'جراند بونتو'] },
      shaheen: { nameAr: 'شاهين', synonyms: ['شاهين', 'shaheen'] },
      fiat128: { nameAr: '128', synonyms: ['128', 'فيات 128'] },
    },
  },
  skoda: {
    nameAr: 'سكودا',
    synonyms: ['سكودا', 'skoda', 'اشكودا'],
    models: {
      octavia: { nameAr: 'أوكتافيا', synonyms: ['أوكتافيا', 'اوكتافيا', 'octavia', 'a4', 'a5', 'a7', 'a8'] },
      kodiaq: { nameAr: 'كودياك', synonyms: ['كودياك', 'kodiaq'] },
      superb: { nameAr: 'سوبيرب', synonyms: ['سوبيرب', 'superb', 'سوبرب'] },
    },
  },
  volkswagen: {
    nameAr: 'فولكس فاجن',
    synonyms: ['فولكس', 'volkswagen', 'vw', 'فولكس واجن', 'فولكس فاجن'],
    models: {
      golf: { nameAr: 'جولف', synonyms: ['جولف', 'golf', 'جولف 4', 'جولف 5', 'جولف 6', 'جولف 7'] },
      passat: { nameAr: 'باسات', synonyms: ['باسات', 'passat'] },
      jetta: { nameAr: 'جيتا', synonyms: ['جيتا', 'jetta'] },
      polo: { nameAr: 'بولو', synonyms: ['بولو', 'polo'] },
    },
  },
}

export const PART_TAXONOMY = {
  brake_pads: {
    code: 'brake_pads',
    nameAr: 'تيل فرامل',
    synonyms: ['تيل فرامل', 'تيل', 'قماشات', 'فرامل', 'brake pads', 'brakes', 'تيل امامي', 'تيل خلفي', 'فحمات'],
    relatedParts: ['brake_discs', 'brake_fluid', 'brake_caliper'],
  },
  brake_discs: {
    code: 'brake_discs',
    nameAr: 'طنابير فرامل',
    synonyms: ['طنابير', 'طنبورة', 'ديسكات', 'هوبات', 'brake rotors', 'brake discs', 'طنابير امامي', 'طنابير خلفي'],
    relatedParts: ['brake_pads', 'wheel_bearing'],
  },
  oil_filter: {
    code: 'oil_filter',
    nameAr: 'فلتر زيت',
    synonyms: ['فلتر زيت', 'فلتر الزيت', 'صفاية زيت', 'oil filter'],
    relatedParts: ['engine_oil', 'air_filter', 'cabin_filter', 'drain_plug_washer'],
  },
  air_filter: {
    code: 'air_filter',
    nameAr: 'فلتر هواء',
    synonyms: ['فلتر هواء', 'فلتر هوا', 'صفاية هواء', 'air filter'],
    relatedParts: ['oil_filter', 'cabin_filter', 'spark_plugs'],
  },
  cabin_filter: {
    code: 'cabin_filter',
    nameAr: 'فلتر تكييف',
    synonyms: ['فلتر تكييف', 'فلتر صالون', 'فلتر مكيف', 'cabin filter', 'ac filter'],
    relatedParts: ['air_filter', 'oil_filter'],
  },
  fuel_filter: {
    code: 'fuel_filter',
    nameAr: 'فلتر بنزين',
    synonyms: ['فلتر بنزين', 'فلتر وقود', 'صفاية بنزين', 'fuel filter'],
    relatedParts: ['spark_plugs', 'fuel_pump'],
  },
  spark_plugs: {
    code: 'spark_plugs',
    nameAr: 'بوجيهات',
    synonyms: ['بوجيهات', 'بوجيه', 'شمعات احتراق', 'شمعات', 'spark plugs', 'spark plug', 'بواجي', 'إيريديوم', 'بلاتينيوم'],
    relatedParts: ['ignition_coils', 'air_filter', 'fuel_filter'],
  },
  shock_absorbers: {
    code: 'shock_absorbers',
    nameAr: 'مساعدين',
    synonyms: ['مساعدين', 'مساعد', 'مساعدين امامي', 'مساعدين خلفي', 'جامبينات', 'shock absorber', 'struts', 'عفشة'],
    relatedParts: ['strut_mounts', 'bump_stops', 'control_arms', 'sway_bar_links'],
  },
  engine_oil: {
    code: 'engine_oil',
    nameAr: 'زيت محرك',
    synonyms: ['زيت موتور', 'زيت محرك', 'زيت', 'engine oil', 'motor oil', '5w30', '5w40', '10w40', 'تخليقي', 'موبيل', 'شل', 'كاسترول', 'توتال'],
    relatedParts: ['oil_filter'],
  },
  timing_belt: {
    code: 'timing_belt',
    nameAr: 'سير كاتينة',
    synonyms: ['سير كاتينة', 'طقم كاتينة', 'كاتينة', 'timing belt', 'timing chain'],
    relatedParts: ['water_pump', 'tensioner_pulley', 'drive_belt'],
  },
  drive_belt: {
    code: 'drive_belt',
    nameAr: 'سير دينامو ومجموعة',
    synonyms: ['سير دينامو', 'سير تكييف', 'سير مجموعة', 'serpentine belt', 'drive belt', 'v-belt'],
    relatedParts: ['tensioner_pulley', 'idler_pulley'],
  },
  water_pump: {
    code: 'water_pump',
    nameAr: 'طلمبة مياه',
    synonyms: ['طلمبة مياه', 'مضخة ماء', 'طلمبة ماء', 'water pump'],
    relatedParts: ['coolant', 'thermostat', 'timing_belt'],
  },
  coolant: {
    code: 'coolant',
    nameAr: 'مياه ريداتير',
    synonyms: ['مياه ريداتير', 'مية خضرا', 'مية حمرا', 'ماء رادياتير', 'coolant', 'antifreeze', 'مبرد'],
    relatedParts: ['water_pump', 'radiator_cap', 'thermostat'],
  },
  control_arms: {
    code: 'control_arms',
    nameAr: 'مقصات وعفشة',
    synonyms: ['مقصات', 'مقص', 'جلب مقص', 'بيض مقص', 'control arm', 'ball joint'],
    relatedParts: ['tie_rod_ends', 'sway_bar_links', 'shock_absorbers'],
  },
  engine_mounts: {
    code: 'engine_mounts',
    nameAr: 'قواعد موتور وفتيس',
    synonyms: ['قواعد موتور', 'قاعدة موتور', 'قاعدة فتيس', 'engine mounts', 'motor mount', 'transmission mount'],
    relatedParts: [],
  },
  battery: {
    code: 'battery',
    nameAr: 'بطارية سيارة',
    synonyms: ['بطارية', 'بطاريات', 'battery', '70 امبير', '60 امبير', '55 امبير'],
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
 * Fast entity extractor from natural language query
 */
export function extractAutomotiveEntities(rawQuery = '') {
  const norm = normalizeArabic(rawQuery)
  const result = {
    make: null,
    model: null,
    year: null,
    partType: null,
    placement: null, // front, rear, left, right
    rawQuery,
    cleanedKeywords: [],
  }

  // 1. Extract Year (4-digit year between 1980 and 2030, or 2-digit like 18 -> 2018)
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

  // 3. Extract Make and Model
  for (const [makeKey, makeData] of Object.entries(CAR_MAKES)) {
    const makeMatched = makeData.synonyms.some(s => norm.includes(normalizeArabic(s)))
    if (makeMatched) {
      result.make = {
        key: makeKey,
        nameAr: makeData.nameAr,
      }
      // Look for model under this make
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

  // If model was mentioned without make (e.g. "تيل فرامل كورولا 2018" without typing "تويوتا")
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
