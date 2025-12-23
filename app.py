import os
import json
import requests
import difflib
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================
# 🧠 BASE DE DATOS ESTÁTICA (EQUIPOS TOP)
# ==========================================
# Mantenemos los grandes para tener precisión histórica.
# Si el equipo NO está aquí, usamos la CUOTA para calcular su ELO.
ELO_DATABASE = {
    "Man City": 2050, "Liverpool": 1990, "Arsenal": 1970, "Real Madrid": 2020,
    "Barcelona": 1960, "Inter": 1950, "Bayern Munich": 1970, "PSG": 1910,
    "Leverkusen": 1930, "Atlético Madrid": 1890
    # ... (El script usará la cuota para el resto)
}

def get_elo_from_odds(odd):
    """
    Convierte la Cuota en ELO.
    Fórmula Logarítmica para mayor precisión en extremos.
    Cuota 1.05 (~95%) -> ELO ~2000
    Cuota 2.00 (~50%) -> ELO ~1500
    Cuota 15.0 (~6%)  -> ELO ~1100
    """
    try:
        if odd <= 1.01: return 2100
        prob = 1 / float(odd)
        # Fórmula: Base 1500 + Ajuste logarítmico según probabilidad
        # (Esto imita cómo el mercado valora la fuerza relativa)
        elo_implied = 1500 + (400 * math.log10(prob / (1 - prob)))
        return int(elo_implied)
    except:
        return 1450 # Promedio si falla cálculo

def find_elo(team, current_odd):
    # 1. Intentar buscar en DB Estática (Solo para gigantes)
    matches = difflib.get_close_matches(team, ELO_DATABASE.keys(), n=1, cutoff=0.7)
    
    if matches:
        return ELO_DATABASE[matches[0]], False # False = ELO Histórico
    else:
        # 2. Si es Barbastro (o cualquiera no listado), usar la CUOTA
        return get_elo_from_odds(current_odd), True # True = ELO de Mercado

def expected_margin(elo_diff):
    """
    Calcula por cuántos goles debería ganar el favorito.
    Diferencia ELO / Factor de Conversión.
    """
    return round(elo_diff / 160.0, 2)

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    # Obtenemos ELO (Histórico o Por Cuota)
    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    # Diferencia de ELO (+100 Localía)
    elo_diff_adjusted = (elo_h + 100) - elo_a
    
    # Goles Esperados (Ventaja Matemática)
    exp_margin = expected_margin(elo_diff_adjusted)

    return jsonify({
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(elo_diff_adjusted),
            "source": "MERCADO (Cuota)" if (est_h or est_a) else "HISTÓRICO (ClubElo)"
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
