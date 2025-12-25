import os
import json
import requests
import difflib
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==============================================================================
# 🌍 BASE DE DATOS ELO MUNDIAL (Manual de Referencia)
# ==============================================================================
# Aquí le enseñamos a Python quién es fuerte en el mundo.
# Si el equipo no está aquí, el sistema calculará su fuerza usando la cuota (Plan B).
ELO_DATABASE = {
    # --- EUROPA ELITE ---
    "Man City": 2050, "Liverpool": 2000, "Arsenal": 1980, "Real Madrid": 2030,
    "Barcelona": 1970, "Inter": 1960, "Bayern Munich": 1980, "PSG": 1920,
    "Leverkusen": 1940, "Atletico Madrid": 1900, "Juventus": 1870, "Milan": 1860,
    "Atalanta": 1850, "Dortmund": 1840, "Leipzig": 1830, "Chelsea": 1820,
    "Tottenham": 1810, "Newcastle": 1800, "Aston Villa": 1790, "Napoli": 1780,

    # --- SUDAMÉRICA (CONMEBOL) ---
    "Palmeiras": 1810, "Flamengo": 1800, "River Plate": 1780, "Atletico Mineiro": 1770,
    "Botafogo": 1760, "Boca Juniors": 1720, "Sao Paulo": 1710, "Fluminense": 1700,
    "Internacional": 1690, "Gremio": 1680, "Racing Club": 1670, "Estudiantes": 1660,
    "Independiente del Valle": 1650, "LDU Quito": 1640, "Libertad": 1630,
    "Colo Colo": 1600, "Universidad Catolica": 1580, "Universitario": 1570,
    
    # --- COLOMBIA (Liga BetPlay) ---
    "Atletico Nacional": 1590, "Millonarios": 1585, "Junior": 1580, 
    "Independiente Medellin": 1570, "Deportes Tolima": 1565, "Santa Fe": 1560,
    "America de Cali": 1555, "Deportivo Cali": 1540,

    # --- MÉXICO & USA ---
    "Club America": 1690, "Monterrey": 1680, "Tigres UANL": 1680, "Cruz Azul": 1670,
    "Pachuca": 1650, "Toluca": 1640, "Chivas": 1630,
    "Los Angeles FC": 1620, "Inter Miami": 1610, "Columbus Crew": 1600,
    "LA Galaxy": 1590, "Seattle Sounders": 1580
}

# --- MOTOR MATEMÁTICO ---

def get_elo_from_odds(odd):
    """
    INGENIERÍA INVERSA DE MERCADO:
    Si no conocemos al equipo (ej: Copa del Rey 3ra división),
    la cuota nos dice qué tan bueno es.
    Cuota 1.05 = ELO 2100 (Nivel Dios)
    Cuota 2.00 = ELO 1500 (Nivel Promedio)
    Cuota 10.0 = ELO 1100 (Nivel Amateur)
    """
    try:
        odd = float(odd)
        if odd <= 1.01: return 2100
        prob = 1 / odd
        # Fórmula Logarítmica para mayor precisión
        elo_implied = 1500 + (400 * math.log10(prob / (1 - prob)))
        return int(elo_implied)
    except:
        return 1450 # Valor seguro si falla el cálculo

def find_elo(team_name, current_odd):
    """Busca el ELO Real o lo Calcula"""
    
    # 1. Búsqueda Difusa en nuestra Base de Datos
    # Esto une "At. Nacional" con "Atletico Nacional" automáticamente
    matches = difflib.get_close_matches(team_name, ELO_DATABASE.keys(), n=1, cutoff=0.6)
    
    if matches:
        # ¡ENCONTRADO EN BASE DE DATOS! -> Usamos ELO Histórico Fijo
        return ELO_DATABASE[matches[0]], False 
    else:
        # ¡DESCONOCIDO! -> Calculamos ELO basado en lo que paga la casa
        return get_elo_from_odds(current_odd), True 

def expected_margin(elo_diff):
    """Convierte diferencia de puntos en goles de ventaja"""
    # 150 puntos de diferencia = 1 gol de ventaja teórica
    return round(elo_diff / 150.0, 2)

# --- RUTAS API ---

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    
    # Usamos las cuotas para calcular el ELO si no está en la lista
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    # 1. Obtener Fuerza (ELO)
    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    # 2. Calcular Ventaja
    # +100 puntos al local por jugar en casa (Estándar mundial)
    elo_diff_adjusted = (elo_h + 100) - elo_a
    
    # 3. Predicción de Goles
    exp_margin = expected_margin(elo_diff_adjusted)
    
    # Determinar quién es el favorito matemático
    favorito = home if exp_margin > 0 else away

    return jsonify({
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(elo_diff_adjusted),
            # Si 'est_h' es True, significa que usamos la cuota (Mercado)
            "source": "MERCADO (Cuota)" if (est_h or est_a) else "HISTÓRICO (Base Datos)"
        },
        "math_prediction": {
            "expected_goal_diff": exp_margin, 
            "favorito": favorito
        }
    })

@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    # Ruta dummy para que el frontend no de error 404
    return jsonify({"status": "ok", "logos": {}})

@app.route('/', methods=['GET'])
def home(): 
    return "CAPITAL SHIELD ELO ENGINE v3.0 ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
