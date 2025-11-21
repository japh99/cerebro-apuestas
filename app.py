import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN (¡EDITA ESTO!) ---
# Pon tu API Key de API-Football aquí abajo:
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc" 

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# --- CARGAR MODELOS ---
try:
    # Asegúrate que estos nombres sean IGUALES a los archivos que subiste
    modelo_btts = joblib.load('modelo_btts.joblib')
    modelo_ou = joblib.load('modelo_ou.joblib')
    print("✅ Modelos cargados correctamente")
except Exception as e:
    print(f"❌ Error cargando modelos: {e}")

# TUS 52 COLUMNAS EXACTAS
COLUMNAS_MODELO = [
    'Division', 'MatchDate', 'MatchTime', 'HomeTeam', 'AwayTeam', 'HomeElo', 'AwayElo', 
    'Form3Home', 'Form5Home', 'Form3Away', 'Form5Away', 'FTHome', 'FTAway', 'FTResult', 
    'HTHome', 'HTAway', 'HTResult', 'HomeShots', 'AwayShots', 'HomeTarget', 'AwayTarget', 
    'HomeFouls', 'AwayFouls', 'HomeCorners', 'AwayCorners', 'HomeYellow', 'AwayYellow', 
    'HomeRed', 'AwayRed', 'OddHome', 'OddDraw', 'OddAway', 'MaxHome', 'MaxDraw', 'MaxAway', 
    'Over25', 'Under25', 'MaxOver25', 'MaxUnder25', 'HandiSize', 'HandiHome', 'HandiAway', 
    'C_LTH', 'C_LTA', 'C_VHD', 'C_VAD', 'C_HTB', 'C_PHB', 'local_rating', 'visitor_rating', 
    'Elo_Diff', 'Form_Diff'
]

# --- SISTEMA DE CACHÉ (JSON) ---
def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f: return json.load(f)
        except: return {}
    return {}

def save_cache(cache_data):
    with open(CACHE_FILE, 'w') as f: json.dump(cache_data, f)

def obtener_stats_reales(equipo_nombre):
    cache = load_cache()
    today = datetime.now().strftime("%Y-%m-%d")
    key = f"{equipo_nombre}_{today}" # Clave única por día
    
    if key in cache:
        print(f"💎 Usando CACHÉ para {equipo_nombre}")
        return cache[key]
    
    # Si no está en caché, llamamos a la API
    print(f"☁️ Llamando API para {equipo_nombre}...")
    try:
        url_search = f"https://v3.football.api-sports.io/teams?name={equipo_nombre}"
        res = requests.get(url_search, headers=HEADERS).json()
        if not res['response']: return None
        team_id = res['response'][0]['team']['id']
        
        url_fixtures = f"https://v3.football.api-sports.io/fixtures?team={team_id}&last=5&status=FT"
        res_fix = requests.get(url_fixtures, headers=HEADERS).json()
        partidos = res_fix['response']
        
        if not partidos: return None

        total_shots = 0
        total_corners = 0
        total_yellows = 0
        count = 0
        
        for p in partidos:
            stats = p.get('statistics', [])
            if not stats: continue
            team_stats = next((s for s in stats if s['team']['id'] == team_id), None)
            if team_stats:
                shots = next((item['value'] for item in team_stats['statistics'] if item['type'] == 'Total Shots'), 0) or 0
                corners = next((item['value'] for item in team_stats['statistics'] if item['type'] == 'Corner Kicks'), 0) or 0
                yellows = next((item['value'] for item in team_stats['statistics'] if item['type'] == 'Yellow Cards'), 0) or 0
                total_shots += shots
                total_corners += corners
                total_yellows += yellows
                count += 1
        
        if count == 0: return None
        
        final_stats = {
            'avg_shots': round(total_shots / count, 2),
            'avg_corners': round(total_corners / count, 2),
            'avg_yellows': round(total_yellows / count, 2)
        }
        
        # Guardar en Caché
        cache[key] = final_stats
        save_cache(cache)
        return final_stats

    except Exception as e:
        print(f"Error API: {e}")
        return None

# --- RUTA 1: SINCRONIZAR DÍA (BATCH) ---
@app.route('/sincronizar-cache', methods=['POST'])
def sincronizar_cache():
    data = request.json
    partidos = data.get('partidos', [])
    procesados = []
    
    for p in partidos:
        home = p.get('home_team')
        away = p.get('away_team')
        try:
            if home: obtener_stats_reales(home)
            if away: obtener_stats_reales(away)
            procesados.append(f"{home} vs {away}")
        except: pass
            
    return jsonify({"status": "ok", "procesados": len(procesados)})

# --- RUTA 2: PREDECIR ---
@app.route('/predecir', methods=['POST'])
def predecir():
    data = request.json
    home_team = data.get('home_team')
    away_team = data.get('away_team')
    
    # 1. Obtener Stats (del caché o API)
    stats_home = obtener_stats_reales(home_team) or {'avg_shots': 10, 'avg_corners': 5, 'avg_yellows': 2}
    stats_away = obtener_stats_reales(away_team) or {'avg_shots': 10, 'avg_corners': 5, 'avg_yellows': 2}

    # 2. Ingeniería de Datos (Simulaciones + Stats Reales)
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))
    
    elo_sim_home = 1500 + ((3.0 - odd_home) * 100)
    elo_sim_away = 1500 + ((3.0 - odd_away) * 100)

    input_data = {
        'Division': 1, 'MatchDate': 0, 'MatchTime': 0, 'HomeTeam': 0, 'AwayTeam': 0,
        'HomeElo': elo_sim_home, 'AwayElo': elo_sim_away,
        'Form3Home': 10 if odd_home < 2 else 5, 'Form5Home': 10,
        'Form3Away': 10 if odd_away < 2 else 5, 'Form5Away': 10,
        'FTHome': 0, 'FTAway': 0, 'FTResult': 0, 'HTHome': 0, 'HTAway': 0, 'HTResult': 0,
        
        # DATOS REALES INSERTADOS AQUÍ
        'HomeShots': stats_home['avg_shots'], 'AwayShots': stats_away['avg_shots'],
        'HomeTarget': stats_home['avg_shots']/2, 'AwayTarget': stats_away['avg_shots']/2,
        'HomeFouls': 10, 'AwayFouls': 10,
        'HomeCorners': stats_home['avg_corners'], 'AwayCorners': stats_away['avg_corners'],
        'HomeYellow': stats_home['avg_yellows'], 'AwayYellow': stats_away['avg_yellows'],
        'HomeRed': 0, 'AwayRed': 0,
        
        'OddHome': odd_home, 'OddDraw': 3.0, 'OddAway': odd_away,
        'MaxHome': odd_home, 'MaxDraw': 3.0, 'MaxAway': odd_away,
        'Over25': 1.9, 'Under25': 1.9, 'MaxOver25': 2.0, 'MaxUnder25': 2.0,
        'HandiSize': 0, 'HandiHome': 0, 'HandiAway': 0,
        'C_LTH': odd_home, 'C_LTA': odd_away, 'C_VHD': 0, 'C_VAD': 0, 'C_HTB': 0, 'C_PHB': 0,
        'local_rating': 50, 'visitor_rating': 50, 'Elo_Diff': 0, 'Form_Diff': 0
    }

    # 3. Predecir
    df = pd.DataFrame([input_data])[COLUMNAS_MODELO]
    
    p_btts = modelo_btts.predict(df)[0]
    prob_btts = modelo_btts.predict_proba(df)[0].tolist() if hasattr(modelo_btts, 'predict_proba') else [0,0]
    
    p_ou = modelo_ou.predict(df)[0]
    prob_ou = modelo_ou.predict_proba(df)[0].tolist() if hasattr(modelo_ou, 'predict_proba') else [0,0]

    return jsonify({
        "model_prediction": {
            "btts": int(p_btts), "btts_prob": prob_btts,
            "over_under": int(p_ou), "over_under_prob": prob_ou
        },
        "real_stats": { "home": stats_home, "away": stats_away }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
