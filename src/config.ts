// src/config.ts

export const PYTHON_BACKEND_URL = "https://cerebro-apuestas.onrender.com"; 

export const ODDS_API_KEYS = [
  "734f30d0866696cf90d5029ac106cfba",
  "10fb6d9d7b3240906d0acea646068535",
  "a9ff72549c4910f1fa9659e175a35cc0"
];

export const getRandomKey = () => {
  if (!ODDS_API_KEYS || ODDS_API_KEYS.length === 0) return null;
  return ODDS_API_KEYS[Math.floor(Math.random() * ODDS_API_KEYS.length)];
};

export const SPORTS_CONFIG = {
  soccer: {
    name: "FÚTBOL",
    color: "emerald",
    ratingName: "ELO",
    metric: "Goles",
    leagues: [
      { code: 'soccer_uefa_champs_league', name: 'Champions League' },
      { code: 'soccer_epl', name: 'Premier League' },
      { code: 'soccer_spain_la_liga', name: 'La Liga' },
      { code: 'soccer_conmebol_copa_libertadores', name: 'Libertadores' },
      { code: 'soccer_italy_serie_a', name: 'Serie A' },
      { code: 'soccer_germany_bundesliga', name: 'Bundesliga' },
      { code: 'soccer_usa_mls', name: 'MLS' },
      { code: 'soccer_mexico_ligamx', name: 'Liga MX' }
    ]
  },
  nba: {
    name: "BALONCESTO",
    color: "orange",
    ratingName: "POWER RATING",
    metric: "Puntos",
    leagues: [
      { code: 'basketball_nba', name: 'NBA' },
      { code: 'basketball_euroleague', name: 'Euroliga' }
    ]
  },
  mlb: {
    name: "BÉISBOL",
    color: "blue",
    ratingName: "TEAM RATING",
    metric: "Carreras",
    leagues: [
      { code: 'baseball_mlb', name: 'MLB' },
      { code: 'baseball_npb', name: 'NPB (Japón)' }
    ]
  }
};
