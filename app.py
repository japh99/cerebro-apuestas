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

# Base de datos en memoria (empieza vacía)
elo_database = {}

def load_elo():
    """Descarga ELO oficial. Se ejecuta SOLO cuando se necesita."""
    global elo_database
    # Si ya tiene datos, no descargar de nuevo
    if len(elo_database) > 0: return

    print("🌍 Descargando Base de Datos ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Timeout de 5 segundos para no congelar el servidor
        r = requests.get("http://api.clubelo.com/All", headers=headers, timeout=5)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"⚠️ Alerta ClubElo: {e}")
        # Si falla, no pasa nada, usaremos el cálculo estimado

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    # Aseguramos que la base de datos esté cargada
    load_elo()
    
    correcciones = {
        "Man City": "Man City", "Man Utd": "Man United", 
        "Nottm Forest": "Forest", "Wolves": "Wolves",
        "Brighton": "Brighton", "Bournemouth": "Bournemouth",
        "Inter": "Internazionale", "Milan": "Milan"
    }
    name = correcciones.get(team, team)
    
    # Si la base de datos está vacía (falló descarga), usar estimado
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
    # Cargar datos si es la primera vez que se llama
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

@app.route('/', methods=['GET'])
def home(): 
    return "HANDICAP ENGINE ONLINE", 200

if __name__ == '__main__':
    # Usamos el puerto que Render nos diga (Variable de entorno)
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
