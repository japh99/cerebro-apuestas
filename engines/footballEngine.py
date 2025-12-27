import requests
import difflib
import math
import csv
import io

# --- BASE DE DATOS ELO MUNDIAL (ESTÁTICA) ---
# Copia la lista completa de ELO_DATABASE de tu anterior app.py aquí
ELO_DATABASE = {
    "Man City": 2050, "Liverpool": 1990, "Arsenal": 1970, "Real Madrid": 2030,
    "Barcelona": 1970, "Inter": 1960, "Bayern Munich": 1980, "PSG": 1920,
    "Leverkusen": 1940, "Atletico Madrid": 1900, "Juventus": 1870, "Milan": 1860,
    "Palmeiras": 1810, "Flamengo": 1800, "River Plate": 1780, "Boca Juniors": 1720,
    "Atletico Nacional": 1590, "Millonarios": 1585, "Junior": 1580, 
    "Club America": 1690, "Monterrey": 1680, "Tigres UANL": 1680, "Los Angeles FC": 1620,
    # ... AGREGA AQUÍ TODOS LOS EQUIPOS DE TU LISTA MUNDIAL
}

def get_elo_from_odds(odd):
    try:
        if odd <= 1.01: return 2100
        prob = 1 / float(odd)
        elo_implied = 1500 + (400 * math.log10(prob / (1 - prob)))
        return int(elo_implied)
    except: return 1450

def find_elo(team_name, current_odd):
    matches = difflib.get_close_matches(team_name, ELO_DATABASE.keys(), n=1, cutoff=0.6)
    if matches: return ELO_DATABASE[matches[0]], False
    else: return get_elo_from_odds(current_odd), True

def calculate_expected_margin(elo_home, elo_away):
    diff = (elo_home + 100) - elo_away # +100 por localía
    return round(diff / 150.0, 2), diff # 150 pts ELO = 1 gol aprox.

def analyze_football_handicap(data):
    """Lógica de análisis para fútbol"""
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    exp_margin, diff_adjusted = calculate_expected_margin(elo_h, elo_a)
    
    favorito = home if exp_margin > 0 else away

    return {
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(diff_adjusted),
            "source": "MERCADO (Cuota)" if (est_h or est_a) else "HISTÓRICO (Base Datos)"
        },
        "math_prediction": {
            "expected_goal_diff": exp_margin, 
            "favorito": favorito
        }
    }

# Dejar este main vacío o borrarlo si no se va a ejecutar directamente
if __name__ == "__main__":
    pass
