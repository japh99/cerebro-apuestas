import json
import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import requests
import google.generativeai as genai # <--- El ingrediente secreto

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 TUS LLAVES (PÉGALAS AQUÍ CON CUIDADO)
# ==========================================
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
GOOGLE_API_KEY = "AIzaSyDxLlhq_5kl8ZQ-vk-UMm_gYKhV6vzMKDE" 
# ==========================================

# Configurar Google dentro del servidor
genai.configure(api_key=GOOGLE_API_KEY)

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# Cargar Modelos (Modo seguro anti-caídas)
try:
    modelo_btts = joblib.load('modelo_btts.joblib')
    modelo_ou = joblib.load('modelo_ou.joblib')
    print("✅ Modelos cargados.")
except:
    print("⚠️ Modelos no encontrados, usando modo simulación.")
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
    # Usamos solo el nombre como clave para simplificar
    if equipo in cache: return cache[equipo]
    
    try:
        print(f"Buscando stats para {equipo}...")
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
            # Buscar stats del equipo correcto
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
    except Exception as e:
        print(f"Error API Football: {e}")
        return {'shots': 10, 'corners': 5}

# --- RUTA 1: SINCRONIZAR (Guardar stats) ---
@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    data = request.json
    partidos = data.get('partidos', [])
    procesados = 0
    for p in partidos:
        try:
            obtener_stats(p['home_team'])
            obtener_stats(p['away_team'])
            procesados += 1
        except: pass
    return jsonify({"status": "ok", "procesados": procesados})

# --- RUTA 2: ANALIZAR COMPLETO (La Magia) ---
@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = data.get('odd_home')
    odd_away = data.get('odd_away')
    
    # 1. Stats Reales
    stats_h = obtener_stats(home)
    stats_a = obtener_stats(away)
    
    # 2. Predicción IA (Google Gemini desde el Servidor)
    try:
        model = genai.GenerativeModel('gemini-pro') # Usamos el modelo estable
        prompt = f"""
        Analiza este partido de fútbol: {home} vs {away}.
        Cuotas: Local {odd_home}, Visitante {odd_away}.
        Stats {home}: {stats_h['shots']} tiros/p, {stats_h['corners']} corners/p.
        Stats {away}: {stats_a['shots']} tiros/p, {stats_a['corners']} corners/p.
        
        Dame una predicción MUY BREVE (Stake 1-10).
        """
        response = model.generate_content(prompt)
        ai_text = response.text
    except Exception as e:
        ai_text = f"Error conectando con Google desde USA: {str(e)}"

    return jsonify({
        "stats": {"home": stats_h, "away": stats_a},
        "ai_analysis": ai_text
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
