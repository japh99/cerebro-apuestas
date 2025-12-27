# --- LÓGICA DE MLB (BÉISBOL) ---

def calculate_mlb_math(rating_home, rating_away):
    """
    Calcula la ventaja en CARRERAS (Runs).
    Fórmula: Diferencia / 200 = Carreras de ventaja.
    """
    try:
        # +25 puntos por localía (Menor impacto en béisbol)
        diff_raw = int(rating_home) - int(rating_away) + 25
        
        # 200 puntos de diferencia ~ 1 carrera
        expected_margin = round(diff_raw / 200.0, 2)
        
        favorito = "LOCAL" if expected_margin > 0 else "VISITA"
        
        return {
            "sport": "mlb",
            "rating_diff_adjusted": diff_raw,
            "expected_margin": expected_margin,
            "unit": "carreras",
            "favorito": favorito
        }
    except Exception as e:
        return {"error": str(e)}
