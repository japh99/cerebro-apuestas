import os
import json
import requests
import difflib
import io
import csv
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 CONFIGURACIÓN
# ==========================================
# Usamos ClubElo para la fuerza real. No necesitamos API Keys aquí para eso.
# Las Keys de Odds vienen del frontend.
# ==========================================

elo_database = {}

def load_elo():
    """Descarga ELO oficial de Europa (ClubElo) al iniciar"""
    global elo_database
    print("🌍 Descargando Base de Datos ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            team_name = row['Club']
            elo_database[team_name] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"❌ Error ClubElo: {e}")

load_elo()

def get_elo_from_odds(odd):
    """Fallback: Si no hay ELO, lo estimamos por la cuota"""
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    # Fórmula inversa aproximada
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    # Corrección de nombres comunes
    correcciones = {
        "Man City": "Man City", "Man Utd": "Man United", 
        "Nottm Forest": "Forest", "Wolves": "Wolves",
        "Brighton": "Brighton", "Bournemouth": "Bournemouth",
        "Inter": "Internazionale", "Milan": "Milan"
    }
    search_name = correcciones.get(team, team)
    
    matches = difflib.get_close_matches(search_name, elo_database.keys(), n=1, cutoff=0.5)
    
    if matches:
        return elo_database[matches[0]], False # False = Es Real
    else:
        return get_elo_from_odds(current_odd), True # True = Es Estimado

def calculate_expected_margin(elo_diff):
    """
    Convierte la diferencia de ELO en Goles Esperados.
    Regla general: ~140 puntos de diferencia = 1 gol de ventaja.
    """
    return round(elo_diff / 140.0, 2)

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    # Cuotas base para estimación de emergencia
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    # 1. Obtener ELO
    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    # 2. Calcular Diferencia (Sumamos 100pts al local por ventaja de campo)
    elo_diff_adjusted = (elo_h + 100) - elo_a
    
    # 3. Calcular Margen de Victoria Esperado
    # Si es +1.5, el local debería ganar por 1.5 goles.
    # Si es -0.5, el visitante debería ganar por 0.5 goles.
    exp_margin = calculate_expected_margin(elo_diff_adjusted)

    return jsonify({
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(elo_diff_adjusted),
            "is_estimated": est_h or est_a
        },
        "math_prediction": {
            "expected_goal_diff": exp_margin, 
            "favorito": home if exp_margin > 0 else away
        }
    })

@app.route('/', methods=['GET'])
def home(): return "HANDICAP ENGINE ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
