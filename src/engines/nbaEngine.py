# --- LÓGICA DE NBA (BALONCESTO) ---

def calculate_nba_math(rating_home, rating_away):
    """
    Calcula la ventaja en PUNTOS basada en Power Rating.
    Fórmula: Diferencia / 28 = Puntos de ventaja (Aprox).
    """
    try:
        # +100 puntos de rating por localía (Estándar NBA ELO)
        diff_raw = int(rating_home) - int(rating_away) + 100
        
        # Cada 28 puntos de diferencia en rating = 1 punto en el marcador
        expected_margin = round(diff_raw / 28.0, 1)
        
        favorito = "LOCAL" if expected_margin > 0 else "VISITA"
        
        return {
            "sport": "nba",
            "rating_diff_adjusted": diff_raw,
            "expected_margin": expected_margin,
            "unit": "puntos",
            "favorito": favorito
        }
    except Exception as e:
        return {"error": str(e)}
