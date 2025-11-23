import json
import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 TUS LLAVES
# ==========================================
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
# ==========================================

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# --- 1. CARGA DE MODELOS ---
try:
    modelo_btts = joblib.load('modelo_btts.joblib')
    modelo_ou = joblib.load('modelo_ou.joblib')
    print("✅ Modelos cargados y listos.")
except:
    print("⚠️ NO SE ENCONTRARON LOS .JOBLIB. Subelos a GitHub.")
    modelo_btts = None
    modelo_ou = None

# --- 2. TUS 52 COLUMNAS EXACTAS ---
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

# --- 3. FUNCIONES DE CACHÉ ---
def load_cache():
    if os.path.exists(CACHE_FILE):
        try: return json.load(open(CACHE_FILE))
        except: return {}
    return {}

def save_cache(data):
    with open(CACHE_FILE, 'w') as f: json.dump(data, f)

def obtener_stats(equipo):
    cache = load_cache()
    if equipo in cache: return cache[equipo]
    
    try:
        url = f"https://v3.football.api-sports.io/teams?name={equipo}"
        res = requests.get(url, headers=HEADERS).json()
        if not res['response']: return {'shots': 10, 'corners': 5}
        
        id_eq = res['response'][0]['team']['id']
        url_fix = f"https://v3.football.api-sports.io/fixtures?team={id_eq}&last=5&status=FT"
        matches = requests.get(url_fix, headers=HEADERS).json()['response']
        
        shots = 0; corners = 0; count = 0
        for m in matches:
            stats = m.get('statistics', [])
            if not stats: continue
            my_stats = next((s for s in stats if s['team']['id'] == id_eq), None)
            if my_stats:
                s = next((i['value'] for i in my_stats['statistics'] if i['type']=='Total Shots'), 0) or 0
                c = next((i['value'] for i in my_stats['statistics'] if i['type']=='Corner Kicks'), 0) or 0
                shots += s; corners += c; count += 1
        
        final = {'shots': round(shots/max(1,count),1), 'corners': round(corners/max(1,count),1)}
        cache[equipo] = final
        save_cache(cache)
        return final
    except:
        return {'shots': 10, 'corners': 5}

# --- 4. CÁLCULO DE ELO PROXY ---
def calcular_elo_implico(cuota):
    # Fórmula: Elo Base (1500) + Ajuste por Probabilidad Implícita
    # Si paga 2.0 (50%), Elo = 1500. Si paga 1.20 (83%), Elo = 1760.
    prob = 1 / max(cuota, 1.01)
    return 1500 + ((prob - 0.5) * 800)

@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    data = request.json
    partidos = data.get('partidos', [])
    for p in partidos:
        try:
            obtener_stats(p['home_team'])
            obtener_stats(p['away_team'])
        except: pass
    return jsonify({"status": "ok"})

@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))
    odd_draw = float(data.get('odd_draw', 3.0))

    # A. OBTENER STATS REALES
    s_home = obtener_stats(home)
    s_away = obtener_stats(away)

    # B. CALCULAR ELO Y VARIABLES
    elo_h = calcular_elo_implico(odd_home)
    elo_a = calcular_elo_implico(odd_away)
    
    # Simular Forma basada en ELO (Mejor Elo = Mejor forma reciente)
    form_h = 15 if elo_h > 1600 else 10
    form_a = 15 if elo_a > 1600 else 10

    # C. CONSTRUIR DATAFRAME (LAS 52 COLUMNAS)
    input_data = {
        'Division': 1, 'MatchDate': 0, 'MatchTime': 0, 'HomeTeam': 0, 'AwayTeam': 0,
        
        # ELO CALCULADO
        'HomeElo': elo_h, 'AwayElo': elo_a,
        
        'Form3Home': form_h, 'Form5Home': form_h + 5,
        'Form3Away': form_a, 'Form5Away': form_a + 5,
        
        'FTHome': 0, 'FTAway': 0, 'FTResult': 0,
        'HTHome': 0, 'HTAway': 0, 'HTResult': 0,
        
        # STATS DE API FOOTBALL
        'HomeShots': s_home['shots'], 'AwayShots': s_away['shots'],
        'HomeTarget': s_home['shots'] / 2.5, 'AwayTarget': s_away['shots'] / 2.5,
        'HomeFouls': 11, 'AwayFouls': 11,
        'HomeCorners': s_home['corners'], 'AwayCorners': s_away['corners'],
        'HomeYellow': 2, 'AwayYellow': 2, 'HomeRed': 0, 'AwayRed': 0,
        
        # ODDS REALES
        'OddHome': odd_home, 'OddDraw': odd_draw, 'OddAway': odd_away,
        'MaxHome': odd_home, 'MaxDraw': odd_draw, 'MaxAway': odd_away,
        'Over25': 1.90, 'Under25': 1.90, 'MaxOver25': 1.95, 'MaxUnder25': 1.95,
        'HandiSize': 0, 'HandiHome': 0, 'HandiAway': 0,
        
        # CALCULADOS
        'C_LTH': odd_home, 'C_LTA': odd_away, 'C_VHD': 0, 'C_VAD': 0, 'C_HTB': 0, 'C_PHB': 0,
        'local_rating': elo_h / 20, 'visitor_rating': elo_a / 20,
        'Elo_Diff': elo_h - elo_a,
        'Form_Diff': form_h - form_a
    }

    # D. PREDECIR CON EL MODELO
    btts_prob = 50
    ou_prob = 50
    
    if modelo_btts and modelo_ou:
        try:
            df = pd.DataFrame([input_data])
            df = df[COLUMNAS_MODELO] # Ordenar forzosamente
            
            # Predecir
            btts_prob = modelo_btts.predict_proba(df)[0][1] * 100
            ou_prob = modelo_ou.predict_proba(df)[0][1] * 100
        except Exception as e:
            print(f"Error predicción: {e}")
    else:
        # Fallback inteligente si no hay modelo: Basado en Stats
        power = s_home['shots'] + s_away['shots']
        ou_prob = 65 if power > 25 else 40
        btts_prob = 60 if (s_home['shots'] > 12 and s_away['shots'] > 12) else 45

    return jsonify({
        "stats": {"home": s_home, "away": s_away},
        "elo": {"home": int(elo_h), "away": int(elo_a)},
        "model_result": {
            "btts_prob": round(btts_prob, 2),
            "over_prob": round(ou_prob, 2)
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
