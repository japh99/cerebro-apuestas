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
# 🔐 SOLO NECESITAS LA KEY DE FUTBOL AHORA
# ==========================================
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
# ==========================================

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# Cargar Modelos
try:
    modelo_btts = joblib.load('modelo_btts.joblib')
    modelo_ou = joblib.load('modelo_ou.joblib')
    print("✅ Modelos matemáticos cargados.")
except:
    print("⚠️ Modelos no encontrados, usando simulación.")
    modelo_btts = None
    modelo_ou = None

# --- SISTEMA DE CACHÉ ---
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
        
        shots = 0
        corners = 0
        count = 0
        for m in matches:
            stats = m.get('statistics', [])
            if not stats: continue
            my_stats = next((s for s in stats if s['team']['id'] == id_eq), None)
            if my_stats:
                s = next((i['value'] for i in my_stats['statistics'] if i['type']=='Total Shots'), 0) or 0
                c = next((i['value'] for i in my_stats['statistics'] if i['type']=='Corner Kicks'), 0) or 0
                shots += s
                corners += c
                count += 1
        
        final = {'shots': round(shots/max(1,count),1), 'corners': round(corners/max(1,count),1)}
        cache[equipo] = final
        save_cache(cache)
        return final
    except:
        return {'shots': 10, 'corners': 5}

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

# --- RUTA DE CÁLCULO MATEMÁTICO ---
@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    
    # 1. Stats Reales (API Football)
    stats_h = obtener_stats(home)
    stats_a = obtener_stats(away)
    
    # 2. Predicción Matemática (Simulación de tus modelos .joblib)
    # Aquí iría la lógica real de pandas con tus modelos cargados.
    # Por ahora devolvemos la probabilidad basada en stats para que funcione el prompt.
    
    # Lógica simple: Si disparan mucho, probabilidad alta.
    power_h = stats_h['shots'] + stats_h['corners']
    power_a = stats_a['shots'] + stats_a['corners']
    
    prob_btts = 65 if (power_h > 12 and power_a > 12) else 40
    prob_over = 70 if (power_h + power_a) > 25 else 45
    
    return jsonify({
        "stats": {"home": stats_h, "away": stats_a},
        "math_prediction": {
            "btts_prob": prob_btts,
            "over_prob": prob_over
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
