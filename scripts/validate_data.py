from pathlib import Path
import pandas as pd

DATA = Path(__file__).resolve().parents[1] / "data/processed/exportaciones_anuales_limpias.csv"
df = pd.read_csv(DATA)
assert df["anio"].between(2014, 2025).all(), "Hay años fuera del alcance."
assert (df[["exportaciones_totales_usd_millones", "petroleras_usd_millones", "no_petroleras_usd_millones"]] >= 0).all().all(), "Hay valores negativos."
difference = (df["exportaciones_totales_usd_millones"] - df["petroleras_usd_millones"] - df["no_petroleras_usd_millones"]).abs()
assert (difference <= 1.0).all(), "El total no coincide con petroleras + no petroleras (tolerancia: USD 1 millón)."
print("Validación aprobada.")
