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
# 🔐 SOLO TU KEY DE FOOTBALL
# ==========================================
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
# ==========================================

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# --- 1. CARGAR MODELOS REALES ---
try:
    # CORRECCIÓN: Usamos los nombres exactos que tienes en la foto
    modelo_btts = joblib.load('btts_model.joblib')  # <--- CAMBIADO
    modelo_ou = joblib.load('ou_model.joblib')      # <--- CAMBIADO
    print("✅ Modelos .joblib cargados correctamente.")
except Exception as e:
    print(f"❌ ERROR CRÍTICO: {str(e)}")
    modelo_btts = None
    modelo_ou = None

# --- 2. LAS 52 COLUMNAS EXACTAS DE TU ENTRENAMIENTO ---
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

# --- 3. FUNCIONES DE CACHÉ (API FOOTBALL) ---
def load_cache():
    if os.path.exists(CACHE_FILE):
        try: return json.load(open(CACHE_FILE))
        except: return {}
    return {}

def save_cache(data):
    with open(CACHE_FILE, 'w') as f: json.dump(data, f)

def obtener_stats_reales(equipo):
    cache = load_cache()
    if equipo in cache: return cache[equipo]
    
    try:
        # Buscar ID del equipo
        url = f"https://v3.football.api-sports.io/teams?name={equipo}"
        res = requests.get(url, headers=HEADERS).json()
        if not res['response']: return {'shots': 11, 'corners': 5, 'yellows': 2} # Default promedio
        
        id_eq = res['response'][0]['team']['id']
        
        # Obtener últimos 5 partidos
        url_fix = f"https://v3.football.api-sports.io/fixtures?team={id_eq}&last=5&status=FT"
        matches = requests.get(url_fix, headers=HEADERS).json()['response']
        
        shots = 0; corners = 0; yellows = 0; count = 0
        for m in matches:
            stats = m.get('statistics', [])
            if not stats: continue
            my_stats = next((s for s in stats if s['team']['id'] == id_eq), None)
            if my_stats:
                s = next((i['value'] for i in my_stats['statistics'] if i['type']=='Total Shots'), 0) or 0
                c = next((i['value'] for i in my_stats['statistics'] if i['type']=='Corner Kicks'), 0) or 0
                y = next((i['value'] for i in my_stats['statistics'] if i['type']=='Yellow Cards'), 0) or 0
                shots += s; corners += c; yellows += y; count += 1
        
        divisor = max(1, count)
        final = {'shots': round(shots/divisor, 1), 'corners': round(corners/divisor, 1), 'yellows': round(yellows/divisor, 1)}
        
        cache[equipo] = final
        save_cache(cache)
        return final
    except:
        return {'shots': 11, 'corners': 5, 'yellows': 2}

# --- 4. ELO INVERSO (CALCULADO DESDE CUOTAS) ---
def get_elo_from_odds(odd):
    # Cuota baja (1.50) -> Alta prob -> ELO Alto
    # Cuota alta (4.00) -> Baja prob -> ELO Bajo
    implied_prob = 1 / max(float(odd), 1.01)
    # Base 1500. Si prob es 50%, Elo 1500. Si es 80%, Elo sube.
    return 1500 + ((implied_prob - 0.5) * 600) # Factor de ajuste

@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    data = request.json
    for p in data.get('partidos', []):
        try:
            obtener_stats_reales(p['home_team'])
            obtener_stats_reales(p['away_team'])
        except: pass
    return jsonify({"status": "ok"})

@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_draw = float(data.get('odd_draw', 3.0))
    odd_away = float(data.get('odd_away', 3.0))

    # A. OBTENER STATS (API FOOTBALL)
    s_home = obtener_stats_reales(home)
    s_away = obtener_stats_reales(away)

    # B. CALCULAR ELO Y FORMA
    elo_h = get_elo_from_odds(odd_home)
    elo_a = get_elo_from_odds(odd_away)
    
    # Forma derivada de ELO (Equipo fuerte suele tener mejor forma)
    form_h = 20 if elo_h > 1600 else 10
    form_a = 20 if elo_a > 1600 else 10

    # C. CONSTRUIR DATAFRAME EXACTO (52 Columnas)
    input_data = {
        'Division': 1, 'MatchDate': 0, 'MatchTime': 0, 'HomeTeam': 0, 'AwayTeam': 0,
        
        'HomeElo': elo_h, 'AwayElo': elo_a,
        'Form3Home': form_h, 'Form5Home': form_h + 5,
        'Form3Away': form_a, 'Form5Away': form_a + 5,
        
        'FTHome': 0, 'FTAway': 0, 'FTResult': 0, 'HTHome': 0, 'HTAway': 0, 'HTResult': 0,
        
        'HomeShots': s_home['shots'], 'AwayShots': s_away['shots'],
        'HomeTarget': s_home['shots'] / 2.2, 'AwayTarget': s_away['shots'] / 2.2,
        'HomeFouls': 11, 'AwayFouls': 11,
        'HomeCorners': s_home['corners'], 'AwayCorners': s_away['corners'],
        'HomeYellow': s_home['yellows'], 'AwayYellow': s_away['yellows'],
        'HomeRed': 0, 'AwayRed': 0,
        
        'OddHome': odd_home, 'OddDraw': odd_draw, 'OddAway': odd_away,
        'MaxHome': odd_home + 0.1, 'MaxDraw': odd_draw + 0.1, 'MaxAway': odd_away + 0.1,
        'Over25': 1.90, 'Under25': 1.90, 'MaxOver25': 1.95, 'MaxUnder25': 1.95, # Promedios si no vienen de odds api
        'HandiSize': 0, 'HandiHome': 0, 'HandiAway': 0,
        
        'C_LTH': odd_home, 'C_LTA': odd_away, 'C_VHD': 0, 'C_VAD': 0, 'C_HTB': 0, 'C_PHB': 0,
        'local_rating': elo_h / 20, 'visitor_rating': elo_a / 20,
        'Elo_Diff': elo_h - elo_a,
        'Form_Diff': form_h - form_a
    }

    # D. PREDECIR USANDO MODELOS .JOBLIB
    btts_prob = 0
    over_prob = 0
    
    if modelo_btts and modelo_ou:
        try:
            df = pd.DataFrame([input_data])
            df = df[COLUMNAS_MODELO] # Reordenar estricto
            
            # [0][1] significa: Fila 0, Columna 1 (Probabilidad de "SÍ")
            btts_prob = modelo_btts.predict_proba(df)[0][1] * 100
            over_prob = modelo_ou.predict_proba(df)[0][1] * 100
        except Exception as e:
            print(f"Error predicción: {e}")
            btts_prob = 50.0 # Error fallback
            over_prob = 50.0

    return jsonify({
        "stats": {"home": s_home, "away": s_away},
        "elo": {"home": int(elo_h), "away": int(elo_a)},
        "model_result": {
            "btts_prob": round(btts_prob, 2),
            "over_prob": round(over_prob, 2)
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)

