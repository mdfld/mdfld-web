// Football-specific brands
export const FOOTBALL_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "New Balance",
  "Under Armour",
  "Umbro",
  "Mizuno",
  "Joma",
  "Kappa",
  "Hummel",
  "Diadora",
  "Lotto",
  "Kelme",
  "Macron",
  "Errea",
] as const;

// Popular football teams/clubs
export const FOOTBALL_TEAMS = [
  // Premier League
  "Manchester United",
  "Liverpool",
  "Manchester City",
  "Arsenal",
  "Chelsea",
  "Tottenham",

  // La Liga
  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",

  // Serie A
  "Juventus",
  "AC Milan",
  "Inter Milan",
  "Roma",
  "Napoli",

  // Bundesliga
  "Bayern Munich",
  "Borussia Dortmund",
  "RB Leipzig",

  // Ligue 1
  "PSG",
  "Marseille",
  "Lyon",

  // National Teams
  "Brazil",
  "Argentina",
  "England",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Portugal",
  "Netherlands",
  "Belgium",
] as const;

// Football boot types
export const BOOT_TYPES = {
  FG: "Firm Ground",
  SG: "Soft Ground",
  AG: "Artificial Ground",
  TF: "Turf",
  IC: "Indoor Court",
  MG: "Multi Ground",
} as const;

// Size ranges
export const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const BOOT_SIZES_UK = [
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "13",
] as const;
export const BOOT_SIZES_EU = [
  "35",
  "36",
  "37",
  "38",
  "38.5",
  "39",
  "40",
  "40.5",
  "41",
  "42",
  "42.5",
  "43",
  "44",
  "44.5",
  "45",
  "46",
  "47",
  "48",
] as const;
export const BOOT_SIZES_US = [
  "4",
  "4.5",
  "5",
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "12.5",
  "13",
  "14",
] as const;

// Seasons
export const FOOTBALL_SEASONS = [
  "2024/25",
  "2023/24",
  "2022/23",
  "2021/22",
  "2020/21",
  "2019/20",
  "2018/19",
  "2017/18",
  "2016/17",
  "2015/16",
  "Classic/Retro",
] as const;

// Jersey types
export const JERSEY_TYPES = {
  HOME: "Home",
  AWAY: "Away",
  THIRD: "Third",
  GOALKEEPER: "Goalkeeper",
  TRAINING: "Training",
  SPECIAL_EDITION: "Special Edition",
} as const;

// Player versions
export const JERSEY_VERSIONS = {
  AUTHENTIC: "Authentic (Player Version)",
  REPLICA: "Replica (Fan Version)",
  RETRO: "Retro/Classic",
} as const;
