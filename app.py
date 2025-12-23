import os
import json
import requests
import difflib
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN ---
# Si tienes key de Football ponla, si no, no importa, usaremos ELO de mercado
API_FOOTBALL_KEY = "TU_KEY_AQUI" 

# --- MEMORIA ELO ---
# Base de datos estática de equipos TOP para evitar descargas fallidas
ELO_DATABASE = {
    "Man City": 2050, "Liverpool": 1990, "Arsenal": 1970, "Real Madrid": 2020,
    "Barcelona": 1960, "Inter": 1950, "Bayern Munich": 1970, "PSG": 1910,
    "Leverkusen": 1930, "Atlético Madrid": 1890, "Juventus": 1860, "Milan": 1850
}

def get_elo_from_odds(odd):
    """Calcula ELO basado en la cuota (Ingeniería Inversa)"""
    try:
        if odd <= 1.01: return 2100
        prob = 1 / float(odd)
        # Fórmula: Base 1500 + Ajuste por probabilidad
        elo_implied = 1500 + (400 * math.log10(prob / (1 - prob)))
        return int(elo_implied)
    except:
        return 1500

def find_elo(team, current_odd):
    # 1. Buscar en DB estática (Gigantes)
    matches = difflib.get_close_matches(team, ELO_DATABASE.keys(), n=1, cutoff=0.7)
    
    if matches:
        return ELO_DATABASE[matches[0]], False # False = Histórico
    else:
        # 2. Si no es gigante, calcular por CUOTA (Mercado)
        return get_elo_from_odds(current_odd), True # True = Estimado

def expected_margin(elo_diff):
    # 160 puntos de diferencia ~ 1 gol de ventaja
    return round(elo_diff / 160.0, 2)

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    # Diferencia (+100 localía)
    elo_diff_adjusted = (elo_h + 100) - elo_a
    exp_margin = expected_margin(elo_diff_adjusted)

    return jsonify({
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(elo_diff_adjusted),
            "source": "MERCADO" if (est_h or est_a) else "HISTÓRICO"
        },
        "math_prediction": {
            "expected_goal_diff": exp_margin, 
            "favorito": home if exp_margin > 0 else away
        }
    })

@app.route('/', methods=['GET'])
def home(): return "MARKET ELO ENGINE ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
