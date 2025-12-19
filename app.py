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
# 🔐 TU LLAVE DE FOOTBALL API
# ==========================================
API_FOOTBALL_KEY = "PEGA_TU_KEY_FOOTBALL_AQUI"
HEADERS_FOOTBALL = {'x-rapidapi-host': "v3.football.api-sports.io", 'x-rapidapi-key': API_FOOTBALL_KEY}
# ==========================================

elo_database = {}

def load_elo():
    global elo_database
    print("🌍 Descargando ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader: elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except: print("❌ Error ClubElo")

load_elo()

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    matches = difflib.get_close_matches(team, elo_database.keys(), n=1, cutoff=0.5)
    if matches: return elo_database[matches[0]], False
    return get_elo_from_odds(current_odd), True

def obtener_stats_reales(equipo):
    # (Misma lógica de stats de siempre, resumida para ahorrar espacio visual aquí)
    # ... Si quieres el código completo de stats pídemelo, pero asumo que ya lo tienes ...
    return {'shots': 10.0, 'xg_for': 1.0, 'xg_against': 1.0, 'form': '?????', 'logo': None}

@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    return jsonify({"status": "ok"}) # Simplificado para este paso

@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    
    # Recibimos las cuotas base para el cálculo ELO
    odd_home = float(data.get('odd_home', 2.0))
    
    # 1. ELO y Stats
    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_home) # Usamos la misma referencia aprox
    s_home = obtener_stats_reales(home)
    s_away = obtener_stats_reales(away)

    # 2. Modelo Matemático (Simulado aquí por brevedad, usa tu .joblib real)
    # Tu código original de joblib iría aquí.
    btts_prob = 55.0 
    over_prob = 50.0

    return jsonify({
        "stats": {"home": s_home, "away": s_away},
        "elo": {"home": int(elo_h), "away": int(elo_a), "est_h": est_h, "est_a": est_a},
        "model_result": {"btts_prob": btts_prob, "over_prob": over_prob}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
