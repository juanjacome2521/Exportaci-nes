from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
df = pd.read_csv(ROOT / "data/processed/exportaciones_anuales_limpias.csv").sort_values("anio")
total = df["exportaciones_totales_usd_millones"]
df["participacion_petrolera_pct"] = 100 * df["petroleras_usd_millones"] / total
df["participacion_no_petrolera_pct"] = 100 * df["no_petroleras_usd_millones"] / total
df["variacion_total_interanual_pct"] = 100 * total.pct_change()
df["variacion_petrolera_interanual_pct"] = 100 * df["petroleras_usd_millones"].pct_change()
df["variacion_no_petrolera_interanual_pct"] = 100 * df["no_petroleras_usd_millones"].pct_change()
df["razon_no_petrolera_petrolera"] = df["no_petroleras_usd_millones"] / df["petroleras_usd_millones"]
out = ROOT / "data/processed/indicadores_exportaciones.csv"
df.round(2).to_csv(out, index=False)
print(f"Indicadores calculados: {out}")
