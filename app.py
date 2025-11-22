import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import requests
import xgboost

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN API ---
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
HEADERS = {
    'x-rapidapi-host': "api-football-v1.p.rapidapi.com",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
CACHE_FILE = "team_stats_cache.json"

# --- CARGAR MODELOS ---
modelo_btts = None
modelo_ou = None

try:
    modelo_btts = joblib.load('btts_model.joblib')
    modelo_ou = joblib.load('ou_model.joblib')
    print("✅ Modelos cargados correctamente")
except Exception as e:
    print(f"❌ Error cargando modelos: {e}")

# COLUMNAS (NO TOCAR)
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

# --- CACHÉ Y API FOOTBALL ---
def load_cache():
    if os.path.exists(CACHE_FILE):
        try: return json.load(open(CACHE_FILE))
        except: return {}
    return {}

def save_cache(data):
    with open(CACHE_FILE, 'w') as f: json.dump(data, f)

def obtener_stats_reales(equipo_nombre):
    cache = load_cache()
    key = f"{equipo_nombre}_{datetime.now().strftime('%Y-%m-%d')}"
    if key in cache: return cache[key]
    
    print(f"☁️ API: Buscando {equipo_nombre}...")
    try:
        res = requests.get(f"{BASE_URL}/teams?name={equipo_nombre}", headers=HEADERS).json()
        if not res.get('response'): return None
        team_id = res['response'][0]['team']['id']
        
        res_fix = requests.get(f"{BASE_URL}/fixtures?team={team_id}&last=5&status=FT", headers=HEADERS).json()
        partidos = res_fix.get('response', [])
        
        if not partidos: return None
        
        stats_acc = {'shots': 0, 'corners': 0, 'yellows': 0, 'count': 0}
        for p in partidos:
            s_list = p.get('statistics', [])
            if not s_list: continue
            team_s = next((s for s in s_list if s['team']['id'] == team_id), None)
            if team_s:
                def get_v(t):
                    val = next((i['value'] for i in team_s['statistics'] if i['type'] == t), 0)
                    return val if val is not None else 0
                stats_acc['shots'] += get_v('Total Shots')
                stats_acc['corners'] += get_v('Corner Kicks')
                stats_acc['yellows'] += get_v('Yellow Cards')
                stats_acc['count'] += 1
        
        if stats_acc['count'] == 0: return None
        
        final = {
            'avg_shots': round(stats_acc['shots'] / stats_acc['count'], 2),
            'avg_corners': round(stats_acc['corners'] / stats_acc['count'], 2),
            'avg_yellows': round(stats_acc['yellows'] / stats_acc['count'], 2)
        }
        cache[key] = final
        save_cache(cache)
        return final
    except: return None

@app.route('/sincronizar-cache', methods=['POST'])
def sincronizar():
    data = request.json
    processed = []
    for p in data.get('partidos', []):
        if p.get('home_team'): obtener_stats_reales(p.get('home_team'))
        if p.get('away_team'): obtener_stats_reales(p.get('away_team'))
        processed.append(1)
    return jsonify({"procesados": len(processed)})

@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        data = request.json
        home = data.get('home_team')
        away = data.get('away_team')
        
        # 1. Stats
        sh = obtener_stats_reales(home) or {'avg_shots': 10, 'avg_corners': 5, 'avg_yellows': 2}
        sa = obtener_stats_reales(away) or {'avg_shots': 10, 'avg_corners': 5, 'avg_yellows': 2}

        # 2. Datos para el Modelo
        odd_h = float(data.get('odd_home', 2.0))
        odd_a = float(data.get('odd_away', 2.0))
        
        # --- CAMBIO CLAVE: Tipos de datos correctos ---
        input_data = {
            'Division': "EPL", # Texto en lugar de numero
            'MatchDate': datetime.now().strftime("%Y-%m-%d"), # Fecha real en texto
            'MatchTime': "20:00", # Hora en texto
            'HomeTeam': home, # Nombre real (Texto)
            'AwayTeam': away, # Nombre real (Texto)
            'HomeElo': 1500 + ((3.0 - odd_h) * 100),
            'AwayElo': 1500 + ((3.0 - odd_a) * 100),
            'Form3Home': 10 if odd_h < 2 else 5, 'Form5Home': 10,
            'Form3Away': 10 if odd_a < 2 else 5, 'Form5Away': 10,
            'FTHome': 0, 'FTAway': 0, 'FTResult': "H", # Texto dummy
            'HTHome': 0, 'HTAway': 0, 'HTResult': "H", # Texto dummy
            'HomeShots': sh['avg_shots'], 'AwayShots': sa['avg_shots'],
            'HomeTarget': sh['avg_shots']/2, 'AwayTarget': sa['avg_shots']/2,
            'HomeFouls': 10, 'AwayFouls': 10,
            'HomeCorners': sh['avg_corners'], 'AwayCorners': sa['avg_corners'],
            'HomeYellow': sh['avg_yellows'], 'AwayYellow': sa['avg_yellows'],
            'HomeRed': 0, 'AwayRed': 0,
            'OddHome': odd_h, 'OddDraw': 3.0, 'OddAway': odd_a,
            'MaxHome': odd_h, 'MaxDraw': 3.0, 'MaxAway': odd_a,
            'Over25': 1.9, 'Under25': 1.9, 'MaxOver25': 2.0, 'MaxUnder25': 2.0,
            'HandiSize': 0, 'HandiHome': 0, 'HandiAway': 0,
            'C_LTH': odd_h, 'C_LTA': odd_a, 'C_VHD': 0, 'C_VAD': 0, 'C_HTB': 0, 'C_PHB': 0,
            'local_rating': 50, 'visitor_rating': 50, 'Elo_Diff': 0, 'Form_Diff': 0
        }
        
        df = pd.DataFrame([input_data])[COLUMNAS_MODELO]
        
        # Predicción Robusta
        try:
            p_btts = int(modelo_btts.predict(df)[0])
            prob_btts = modelo_btts.predict_proba(df)[0].tolist()
        except: 
            p_btts = 0
            prob_btts = [0.5, 0.5] # Fallback seguro

        try:
            p_ou = int(modelo_ou.predict(df)[0])
            prob_ou = modelo_ou.predict_proba(df)[0].tolist()
        except:
            p_ou = 0
            prob_ou = [0.5, 0.5]

        return jsonify({
            "model_prediction": {
                "btts": p_btts, "btts_prob": prob_btts,
                "over_under": p_ou, "over_under_prob": prob_ou
            },
            "real_stats": { "home": sh, "away": sa }
        })

    except Exception as e:
        # Esto envía el error real a tu navegador para que lo veamos
        return jsonify({"error_real": str(e), "tipo": str(type(e))}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
