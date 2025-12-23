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
# Las keys de Odds vienen del frontend, pero para la auditoría interna
# necesitamos una por defecto o la pasamos por URL.
# Usaremos una variable temporal aquí solo para la auditoría si quieres,
# o mejor, la pasamos como parámetro en la URL.
# ==========================================

elo_database = {}

def load_elo():
    global elo_database
    if len(elo_database) > 0: return
    print("🌍 Descargando ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers, timeout=10)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"⚠️ Alerta ClubElo: {e}")

# Cargar al inicio
load_elo()

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    # CORRECCIONES MANUALES (Aquí es donde agregaremos lo que descubras)
    correcciones = {
        "Man City": "Man City", "Man Utd": "Man United", 
        "Nottm Forest": "Forest", "Wolves": "Wolves",
        "Brighton": "Brighton", "Bournemouth": "Bournemouth",
        "Inter": "Internazionale", "Milan": "Milan",
        "Athletic Bilbao": "Athletic", "Atletico Madrid": "Atletico",
        "Celta Vigo": "Celta", "Real Betis": "Betis",
        "Real Sociedad": "Sociedad", "Rayo Vallecano": "Rayo Vallecano",
        "Mallorca": "Mallorca", "Osasuna": "Osasuna",
        "Girona": "Girona", "Alaves": "Alaves",
        "Las Palmas": "Las Palmas", "Sevilla": "Sevilla",
        "Valencia": "Valencia", "Villarreal": "Villarreal",
        "Getafe": "Getafe", "Espanyol": "Espanyol",
        "Valladolid": "Valladolid", "Leganes": "Leganes"
    }
    search_name = correcciones.get(team, team)
    
    matches = difflib.get_close_matches(search_name, elo_database.keys(), n=1, cutoff=0.55)
    
    if matches: return elo_database[matches[0]], False
    else: return get_elo_from_odds(current_odd), True

def expected_margin(elo_diff):
    return round(elo_diff / 140.0, 2)

# --- RUTA PRINCIPAL DE ANÁLISIS ---
@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    if not elo_database: load_elo()
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

@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    return jsonify({"status": "ok"})

# --- 🕵️‍♂️ NUEVA RUTA DE AUDITORÍA (HERRAMIENTA SECRETA) ---
@app.route('/auditar', methods=['GET'])
def auditar():
    # Esta ruta la visitas desde el navegador para ver los nombres
    # Uso: https://tudominio.onrender.com/auditar?key=TU_API_KEY_ODDS&league=soccer_epl
    
    api_key = request.args.get('key')
    league = request.args.get('league', 'soccer_epl')
    
    if not api_key:
        return jsonify({"error": "Falta parametro ?key=TU_API_KEY"}), 400
        
    if not elo_database: load_elo()
    
    url = f"https://api.the-odds-api.com/v4/sports/{league}/odds/?apiKey={api_key}&regions=eu&markets=h2h"
    try:
        res = requests.get(url)
        data = res.json()
        
        reporte = []
        
        for m in data:
            # Analizar Local
            home = m['home_team']
            match_h = difflib.get_close_matches(home, elo_database.keys(), n=1, cutoff=0.5)
            status_h = "✅ EXACTO/PARECIDO" if match_h else "❌ NO ENCONTRADO"
            found_h = match_h[0] if match_h else "NADA"
            
            # Analizar Visita
            away = m['away_team']
            match_a = difflib.get_close_matches(away, elo_database.keys(), n=1, cutoff=0.5)
            status_a = "✅ EXACTO/PARECIDO" if match_a else "❌ NO ENCONTRADO"
            found_a = match_a[0] if match_a else "NADA"

            reporte.append({
                "partido": f"{home} vs {away}",
                "analisis_local": {
                    "nombre_odds": home,
                    "nombre_clubelo": found_h,
                    "estado": status_h
                },
                "analisis_visita": {
                    "nombre_odds": away,
                    "nombre_clubelo": found_a,
                    "estado": status_a
                }
            })
            
        return jsonify(reporte)
        
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/', methods=['GET'])
def home(): return "HANDICAP ENGINE v2.1 ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
