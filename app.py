import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 TU LLAVE DE FOOTBALL
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
    modelo_btts = joblib.load('btts_model.joblib')
    modelo_ou = joblib.load('ou_model.joblib')
    print("✅ Modelos cargados correctamente.")
except Exception as e:
    print(f"❌ Error modelos: {e}")
    modelo_btts = None
    modelo_ou = None

# --- 2. LAS 13 COLUMNAS (Orden Sagrado) ---
COLUMNAS_EXACTAS = [
    'OddHome', 'OddDraw', 'OddAway', 
    'Elo_Home', 'Elo_Away', 'Elo_Diff', 
    'Form3_Diff', 'Form5_Diff', 
    'Shots_Diff', 'Shots_Total', 
    'OddsRatio', 
    'Target_Diff', 'Target_Total'
]

# --- 3. FUNCIONES AUXILIARES ---
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
        # Buscamos ID
        url = f"https://v3.football.api-sports.io/teams?name={equipo}"
        res = requests.get(url, headers=HEADERS).json()
        if not res['response']: return {'shots': 10.0, 'corners': 5.0}
        
        id_eq = res['response'][0]['team']['id']
        # Buscamos últimos partidos
        url_fix = f"https://v3.football.api-sports.io/fixtures?team={id_eq}&last=5&status=FT"
        matches = requests.get(url_fix, headers=HEADERS).json()['response']
        
        shots = 0; count = 0
        for m in matches:
            stats = m.get('statistics', [])
            if not stats: continue
            my_stats = next((s for s in stats if s['team']['id'] == id_eq), None)
            if my_stats:
                # Extraemos con seguridad
                s = next((i['value'] for i in my_stats['statistics'] if i['type']=='Total Shots'), 0)
                if s is None: s = 0
                shots += s
                count += 1
        
        final_shots = round(shots/max(1,count), 1)
        final = {'shots': float(final_shots), 'corners': 5.0}
        
        cache[equipo] = final
        save_cache(cache)
        return final
    except:
        return {'shots': 10.0, 'corners': 5.0}

def get_elo(odd):
    # Evitamos división por cero
    safe_odd = max(float(odd), 1.01)
    return 1500.0 + (( (1.0/safe_odd) - 0.5 ) * 600.0)

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
    
    # A. Recibir datos y convertir a FLOAT para evitar errores
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_draw = float(data.get('odd_draw', 3.0))
    odd_away = float(data.get('odd_away', 2.0))

    # B. Stats Reales
    s_home = obtener_stats_reales(home)
    s_away = obtener_stats_reales(away)
    
    # C. Cálculos
    elo_h = get_elo(odd_home)
    elo_a = get_elo(odd_away)
    
    # Proxy de Forma
    form_h = 15.0 if elo_h > 1550 else 10.0
    form_a = 15.0 if elo_a > 1550 else 10.0
    
    shots_h = float(s_home['shots'])
    shots_a = float(s_away['shots'])

    # D. INGENIERÍA DE DATOS (LAS 13 VARS)
    features = {
        'OddHome': odd_home,
        'OddDraw': odd_draw,
        'OddAway': odd_away,
        'Elo_Home': elo_h,
        'Elo_Away': elo_a,
        'Elo_Diff': elo_h - elo_a,
        'Form3_Diff': form_h - form_a,
        'Form5_Diff': (form_h + 5.0) - (form_a + 5.0),
        'Shots_Diff': shots_h - shots_a,
        'Shots_Total': shots_h + shots_a,
        'OddsRatio': odd_away / odd_home if odd_home > 0 else 1.0,
        'Target_Diff': (shots_h/2.2) - (shots_a/2.2),
        'Target_Total': (shots_h/2.2) + (shots_a/2.2)
    }

    # E. PREDICCIÓN
    btts_prob = 50.0
    over_prob = 50.0

    if modelo_btts and modelo_ou:
        try:
            df = pd.DataFrame([features])
            df = df[COLUMNAS_EXACTAS] # Ordenar
            
            # Predecir
            btts_prob = modelo_btts.predict_proba(df)[0][1] * 100
            over_prob = modelo_ou.predict_proba(df)[0][1] * 100
        except Exception as e:
            print(f"Error calculando modelo: {e}")
            # Fallback si falla el modelo: lógica simple
            if (shots_h + shots_a) > 24: over_prob = 65.0
            if (shots_h > 12 and shots_a > 12): btts_prob = 60.0

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
