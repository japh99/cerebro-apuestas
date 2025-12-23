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
# Pega tu llave de API-FOOTBALL aquí para los logos
API_FOOTBALL_KEY = "PEGA_TU_KEY_FOOTBALL_AQUI"
# ==========================================

HEADERS_FOOTBALL = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}

# Base de datos en memoria
elo_database = {}

def load_elo():
    """Descarga ELO oficial. Se ejecuta SOLO cuando se necesita."""
    global elo_database
    if len(elo_database) > 0: return # Si ya tiene datos, no hacer nada

    print("🌍 Descargando Base de Datos ELO...")
    try:
        # Timeout corto para no bloquear
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers, timeout=5)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"⚠️ Alerta ClubElo: {e}")

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    # Carga diferida: Solo descarga si es la primera vez que se usa
    load_elo()
    
    correcciones = {
        "Man City": "Man City", "Man Utd": "Man United", 
        "Nottm Forest": "Forest", "Wolves": "Wolves",
        "Brighton": "Brighton", "Bournemouth": "Bournemouth",
        "Inter": "Internazionale", "Milan": "Milan"
    }
    name = correcciones.get(team, team)
    
    if not elo_database:
        return get_elo_from_odds(current_odd), True

    matches = difflib.get_close_matches(name, elo_database.keys(), n=1, cutoff=0.5)
    
    if matches:
        return elo_database[matches[0]], False
    else:
        return get_elo_from_odds(current_odd), True

def expected_margin(elo_diff):
    return round(elo_diff / 140.0, 2)

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    # Asegura que haya datos antes de calcular
    load_elo()
    
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    elo_diff_adjusted = (elo_h + 100) - elo_a
    exp_margin = expected_margin(elo_diff_adjusted)

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

# Ruta simple para que Render vea que estamos vivos
@app.route('/', methods=['GET'])
def home(): 
    return "HANDICAP ENGINE ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
