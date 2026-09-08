/* =========================================================================
   SABRE TRAINING SIMULATOR — AIRPORT / AIRLINE DATABASE
   Independent educational tool — no affiliation with Sabre Corporation.
   Mirrors Amaduce's airports.js coverage (60+ hubs), region-tagged so
   sb-availability.js can decide direct vs connecting routing.
   ========================================================================= */

const SB_AIRPORTS = {
  // Bangladesh
  DAC: { name: "HAZRAT SHAHJALAL INTL", city: "DHAKA", country: "BANGLADESH", region: "BD" },
  CGP: { name: "SHAH AMANAT INTL", city: "CHITTAGONG", country: "BANGLADESH", region: "BD" },
  ZYL: { name: "OSMANI INTL", city: "SYLHET", country: "BANGLADESH", region: "BD" },
  CXB: { name: "COX'S BAZAR INTL", city: "COX'S BAZAR", country: "BANGLADESH", region: "BD" },
  JSR: { name: "JASHORE AIRPORT", city: "JASHORE", country: "BANGLADESH", region: "BD" },
  BZL: { name: "BARISHAL AIRPORT", city: "BARISHAL", country: "BANGLADESH", region: "BD" },
  RJH: { name: "SHAH MAKHDUM AIRPORT", city: "RAJSHAHI", country: "BANGLADESH", region: "BD" },

  // South Asia
  DEL: { name: "INDIRA GANDHI INTL", city: "DELHI", country: "INDIA", region: "SASIA" },
  BOM: { name: "CHHATRAPATI SHIVAJI INTL", city: "MUMBAI", country: "INDIA", region: "SASIA" },
  CCU: { name: "NETAJI SUBHAS CHANDRA BOSE INTL", city: "KOLKATA", country: "INDIA", region: "SASIA" },
  MAA: { name: "CHENNAI INTL", city: "CHENNAI", country: "INDIA", region: "SASIA" },
  BLR: { name: "KEMPEGOWDA INTL", city: "BENGALURU", country: "INDIA", region: "SASIA" },
  KTM: { name: "TRIBHUVAN INTL", city: "KATHMANDU", country: "NEPAL", region: "SASIA" },
  CMB: { name: "BANDARANAIKE INTL", city: "COLOMBO", country: "SRI LANKA", region: "SASIA" },
  KHI: { name: "JINNAH INTL", city: "KARACHI", country: "PAKISTAN", region: "SASIA" },

  // Southeast Asia
  BKK: { name: "SUVARNABHUMI INTL", city: "BANGKOK", country: "THAILAND", region: "SEASIA" },
  DMK: { name: "DON MUEANG INTL", city: "BANGKOK", country: "THAILAND", region: "SEASIA" },
  HKT: { name: "PHUKET INTL", city: "PHUKET", country: "THAILAND", region: "SEASIA" },
  SIN: { name: "SINGAPORE CHANGI INTL", city: "SINGAPORE", country: "SINGAPORE", region: "SEASIA" },
  KUL: { name: "KUALA LUMPUR INTL", city: "KUALA LUMPUR", country: "MALAYSIA", region: "SEASIA" },
  CGK: { name: "SOEKARNO-HATTA INTL", city: "JAKARTA", country: "INDONESIA", region: "SEASIA" },
  DPS: { name: "NGURAH RAI INTL", city: "BALI", country: "INDONESIA", region: "SEASIA" },
  MNL: { name: "NINOY AQUINO INTL", city: "MANILA", country: "PHILIPPINES", region: "SEASIA" },
  SGN: { name: "TAN SON NHAT INTL", city: "HO CHI MINH CITY", country: "VIETNAM", region: "SEASIA" },

  // East Asia
  NRT: { name: "NARITA INTL", city: "TOKYO", country: "JAPAN", region: "EASIA" },
  HND: { name: "HANEDA INTL", city: "TOKYO", country: "JAPAN", region: "EASIA" },
  ICN: { name: "INCHEON INTL", city: "SEOUL", country: "SOUTH KOREA", region: "EASIA" },
  HKG: { name: "HONG KONG INTL", city: "HONG KONG", country: "HONG KONG", region: "EASIA" },
  PVG: { name: "PUDONG INTL", city: "SHANGHAI", country: "CHINA", region: "EASIA" },
  PEK: { name: "CAPITAL INTL", city: "BEIJING", country: "CHINA", region: "EASIA" },
  CAN: { name: "BAIYUN INTL", city: "GUANGZHOU", country: "CHINA", region: "EASIA" },
  TPE: { name: "TAOYUAN INTL", city: "TAIPEI", country: "TAIWAN", region: "EASIA" },

  // Middle East
  DXB: { name: "DUBAI INTL", city: "DUBAI", country: "UAE", region: "MENA" },
  AUH: { name: "ZAYED INTL", city: "ABU DHABI", country: "UAE", region: "MENA" },
  SHJ: { name: "SHARJAH INTL", city: "SHARJAH", country: "UAE", region: "MENA" },
  DOH: { name: "HAMAD INTL", city: "DOHA", country: "QATAR", region: "MENA" },
  JED: { name: "KING ABDULAZIZ INTL", city: "JEDDAH", country: "SAUDI ARABIA", region: "MENA" },
  MED: { name: "PRINCE MOHAMMAD INTL", city: "MEDINA", country: "SAUDI ARABIA", region: "MENA" },
  RUH: { name: "KING KHALID INTL", city: "RIYADH", country: "SAUDI ARABIA", region: "MENA" },
  DMM: { name: "KING FAHD INTL", city: "DAMMAM", country: "SAUDI ARABIA", region: "MENA" },
  KWI: { name: "KUWAIT INTL", city: "KUWAIT CITY", country: "KUWAIT", region: "MENA" },
  BAH: { name: "BAHRAIN INTL", city: "MANAMA", country: "BAHRAIN", region: "MENA" },
  MCT: { name: "MUSCAT INTL", city: "MUSCAT", country: "OMAN", region: "MENA" },
  IST: { name: "ISTANBUL AIRPORT", city: "ISTANBUL", country: "TURKEY", region: "MENA" },

  // Europe
  LHR: { name: "HEATHROW", city: "LONDON", country: "UK", region: "EUROPE" },
  LGW: { name: "GATWICK", city: "LONDON", country: "UK", region: "EUROPE" },
  MAN: { name: "MANCHESTER AIRPORT", city: "MANCHESTER", country: "UK", region: "EUROPE" },
  CDG: { name: "CHARLES DE GAULLE", city: "PARIS", country: "FRANCE", region: "EUROPE" },
  FRA: { name: "FRANKFURT AIRPORT", city: "FRANKFURT", country: "GERMANY", region: "EUROPE" },
  FCO: { name: "FIUMICINO", city: "ROME", country: "ITALY", region: "EUROPE" },
  AMS: { name: "SCHIPHOL", city: "AMSTERDAM", country: "NETHERLANDS", region: "EUROPE" },
  MXP: { name: "MALPENSA", city: "MILAN", country: "ITALY", region: "EUROPE" },

  // North America
  JFK: { name: "JOHN F KENNEDY INTL", city: "NEW YORK", country: "USA", region: "NA" },
  EWR: { name: "NEWARK LIBERTY INTL", city: "NEWARK", country: "USA", region: "NA" },
  ORD: { name: "O'HARE INTL", city: "CHICAGO", country: "USA", region: "NA" },
  LAX: { name: "LOS ANGELES INTL", city: "LOS ANGELES", country: "USA", region: "NA" },
  IAD: { name: "DULLES INTL", city: "WASHINGTON", country: "USA", region: "NA" },
  YYZ: { name: "TORONTO PEARSON INTL", city: "TORONTO", country: "CANADA", region: "NA" }
};

const SB_AIRLINES = {
  BG: { name: "BIMAN BANGLADESH AIRLINES", region: "BD" },
  BS: { name: "US-BANGLA AIRLINES", region: "BD" },
  VQ: { name: "NOVOAIR", region: "BD" },
  AI: { name: "AIR INDIA", region: "SASIA" },
  UK: { name: "VISTARA", region: "SASIA" },
  UL: { name: "SRILANKAN AIRLINES", region: "SASIA" },
  TG: { name: "THAI AIRWAYS", region: "SEASIA" },
  MH: { name: "MALAYSIA AIRLINES", region: "SEASIA" },
  SQ: { name: "SINGAPORE AIRLINES", region: "SEASIA" },
  CX: { name: "CATHAY PACIFIC", region: "EASIA" },
  KE: { name: "KOREAN AIR", region: "EASIA" },
  NH: { name: "ALL NIPPON AIRWAYS", region: "EASIA" },
  EK: { name: "EMIRATES", region: "MENA" },
  QR: { name: "QATAR AIRWAYS", region: "MENA" },
  EY: { name: "ETIHAD AIRWAYS", region: "MENA" },
  SV: { name: "SAUDIA", region: "MENA" },
  TK: { name: "TURKISH AIRLINES", region: "MENA" },
  BA: { name: "BRITISH AIRWAYS", region: "EUROPE" },
  LH: { name: "LUFTHANSA", region: "EUROPE" },
  AF: { name: "AIR FRANCE", region: "EUROPE" }
};

// Which hub each destination region connects through when there is no
// realistic direct service from a Bangladesh / non-matching origin.
const SB_HUB_BY_REGION = {
  EUROPE: "DXB",
  NA: "IST",
  EASIA: "BKK",
  SASIA: "DXB",
  SEASIA: "DXB",
  MENA: "DXB",
  BD: "DXB"
};

// Airlines that plausibly serve a given region (used to pick the
// operating carrier for a leg).
const SB_REGION_CARRIERS = {
  BD: ["BG", "BS", "VQ"],
  SASIA: ["BG", "AI", "UK", "UL"],
  SEASIA: ["BG", "TG", "MH", "SQ"],
  EASIA: ["CX", "KE", "NH", "SQ"],
  MENA: ["EK", "QR", "EY", "SV", "TK"],
  EUROPE: ["EK", "QR", "TK", "BA", "LH", "AF"],
  NA: ["TK", "EK", "QR"]
};
