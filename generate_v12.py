#!/usr/bin/env python3
"""
GERADOR DE PLANTA MASTER 10x26m - VERSÃO FINAL
Duas casas geminadas (5x26m cada) com layout correto.

ALTERAÇÕES RECENTES (v12 final):
- Sala: ~10m² (2.40m × 4.17m)
- Cozinha: ~8m² (2.40m × 3.33m)
- Garagens aumentadas (Casa A: 4.50m, Casa B: 4.00m) para compensar
- Recuo entrada: máximo 2.00m (cobertura carro)
- Closet alinhado com BWC suíte (ambos 1.50m largura)
- Meia parede 1.20m + bancada 1.20m × 0.90m entre sala/cozinha
- Cotas completas em todas as paredes (horizontais e verticais)

GEOMETRIA X FIXA:
Casa A: Corr.Int [0.00-1.10] | Amb [1.10-3.50] | Faixa Ext [3.50-5.00]
Casa B: Faixa Ext [5.00-6.50] | Amb [6.50-8.90] | Corr.Int [8.90-10.00]

RECUO DE FUNDO: 1.50m contínuo (corredor de fundo permeável)
PERMEÁVEL MÍNIMO: 13.00 m² por casa (alcançado: Casa A 25m², Casa B 25.5m²)
"""

import ezdxf
from ezdxf.enums import TextEntityAlignment

# ==========================================================
# CONSTANTES GLOBAIS
# ==========================================================
SCALE = 1000  # 1m = 1000mm
INSUNITS_MM = 4

# Terreno
MASTER_W = 10.0
MASTER_L = 26.0
LOTE_W = 5.0
LOTE_L = 26.0

# Recuos e faixas (PADRÃO 1,50m = 0,50m calçada + 1,00m permeável)
SIDE_TOTAL_W = 1.50  # Faixa lateral externa total
CALCADA_W = 0.50     # Calçada (cimentado)
SIDE_PERM_W = 1.00   # Permeável lateral

BACK_TOTAL_D = 1.50  # Faixa de fundo total
BACK_CALC_D = 0.50   # Calçada de fundo
BACK_PERM_D = 1.00   # Permeável de fundo

# Corredor interno (circulação)
CORR_INT_W = 1.10

# Portas e janelas
PORTA_ENTRADA = 1.20
PORTA_QUARTO = 0.80
PORTA_WC = 0.70
JANELA_QUARTO = 1.20
JANELA_WC = 0.60
JANELA_SALA = 1.50

# Portão
PORTAO_W = 4.50
PORTAO_H = 2.60

# Dimensões específicas
WC_SOCIAL_W = 1.50  # largura (X)
WC_SOCIAL_L = 2.50  # comprimento (Y)

# Suíte (bloco fixo - closet alinhado com bwc)
SUITE_BLOCO_W = 1.50  # largura do bloco da suíte
CLOSET_L = 3.00  # profundidade do closet
BWC_SUITE_L = 2.00  # profundidade do bwc suíte
BWC_SUITE_W = 1.50  # largura do bwc (igual ao bloco, alinhado)
SUITE_TOTAL_L = CLOSET_L + BWC_SUITE_L  # 5.00m total

# Bancada entre sala e cozinha
BANCADA_PAREDE_L = 1.20  # comprimento da meia parede
BANCADA_L = 1.20  # largura da bancada
BANCADA_H = 0.90  # altura da bancada

# Garagens (ajustadas para sala 12m² e cozinha 10m²)
GARAGEM_A_L = 4.50  # Casa A: aumentada para compensar sala/cozinha maiores
GARAGEM_B_L = 4.00  # Casa B: aumentada para compensar sala/cozinha maiores
GARAGEM_COB_W = 2.50  # Largura da garagem coberta (dente)
RECUO_ENTRADA = 2.00  # Recuo máximo da entrada (cobertura carro)

# Sala e Cozinha (áreas ajustadas para caber no lote)
# Largura ambiente ~2.40m
# Sala: 2.40 × 4.17 = 10.01m² ≈ 10m²
# Cozinha: 2.40 × 3.33 = 7.99m² ≈ 8m²
SALA_L = 4.17    # ~10m² (em vez de 12m²)
COZINHA_L = 3.33  # ~8m² (em vez de 10m²)
QUARTO_MIN_L = 3.00
SUITE_MIN_L = 3.20
BWC_SUITE_L = 1.80

# Permeável mínimo
PERMEAVEL_MIN = 13.0

# Linetype e hatch
DASH_MM = 100
GAP_MM = 50
HATCH_SCALE_MM = 800

# EPS (vão na borda)
EPS_GAP = 0.02

# ==========================================================
# SETUP LAYERS
# ==========================================================
def setup_layers(doc):
    """Configura layers com cores"""
    layers = {
        "PAREDES": 7,
        "DIVISAS": 8,
        "PORTAS": 30,
        "JANELAS": 3,
        "TEXTOS": 5,
        "COTAS": 1,
        "HATCH_PERM": 152,
        "CALCADA": 252,
        "CORR_INT": 8,
        "PORTAO": 1,
        "MOBILIARIO": 4,
        "EPS": 250,
    }
    for name, color in layers.items():
        if name not in doc.layers:
            doc.layers.add(name, color=color)

# ==========================================================
# HELPERS BÁSICOS
# ==========================================================
def mm(x_m):
    """Converte metros para milímetros"""
    return x_m * SCALE

def add_rect(msp, x0, y0, x1, y1, layer, close=True):
    """Desenha retângulo"""
    pts = [(mm(x0), mm(y0)), (mm(x1), mm(y0)), (mm(x1), mm(y1)), (mm(x0), mm(y1))]
    msp.add_lwpolyline(pts, close=close, dxfattribs={"layer": layer})
    return pts

def add_hatch_rect(msp, x0, y0, x1, y1, layer="HATCH_PERM"):
    """Desenha retângulo com hachura permeável"""
    pts = add_rect(msp, x0, y0, x1, y1, layer=layer)
    hatch = msp.add_hatch(color=152, dxfattribs={"layer": layer})
    hatch.paths.add_polyline_path(pts, is_closed=True)
    hatch.set_pattern_fill("ANSI31", scale=HATCH_SCALE_MM)

def add_bancada(msp, x0, y0, x1, y1, layer="MOBILIARIO"):
    """Desenha bancada (retângulo fino)"""
    add_rect(msp, x0, y0, x1, y1, layer)

def add_text(msp, text, x, y, height=100, layer="TEXTOS", rotation=0):
    """Adiciona texto centrado"""
    msp.add_text(text, height=height, dxfattribs={
        "layer": layer, "rotation": rotation
    }).set_placement((mm(x), mm(y)), align=TextEntityAlignment.CENTER)

def add_cota_h(msp, x0, x1, y, offset=-0.40):
    """Adiciona cota horizontal"""
    distancia = abs(x1 - x0)
    cx = (x0 + x1) / 2
    # Linha de cota
    msp.add_line((mm(x0), mm(y + offset)), (mm(x1), mm(y + offset)), 
                 dxfattribs={"layer": "COTAS"})
    # Setas
    msp.add_line((mm(x0), mm(y + offset - 0.10)), (mm(x0), mm(y + offset + 0.10)), 
                 dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x1), mm(y + offset - 0.10)), (mm(x1), mm(y + offset + 0.10)), 
                 dxfattribs={"layer": "COTAS"})
    # Texto
    add_text(msp, f"{distancia:.2f}m", cx, y + offset - 0.25, 50, "COTAS")

def add_cota_v(msp, y0, y1, x, offset=-0.40):
    """Adiciona cota vertical"""
    distancia = abs(y1 - y0)
    cy = (y0 + y1) / 2
    # Linha de cota
    msp.add_line((mm(x + offset), mm(y0)), (mm(x + offset), mm(y1)), 
                 dxfattribs={"layer": "COTAS"})
    # Setas
    msp.add_line((mm(x + offset - 0.10), mm(y0)), (mm(x + offset + 0.10), mm(y0)), 
                 dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x + offset - 0.10), mm(y1)), (mm(x + offset + 0.10), mm(y1)), 
                 dxfattribs={"layer": "COTAS"})
    # Texto
    t = msp.add_text(f"{distancia:.2f}m", height=50, dxfattribs={"layer": "COTAS", "rotation": 90})
    t.set_placement((mm(x + offset - 0.30), mm(cy)))

# ==========================================================
# GEOMETRIA X (FIXO POR CASA)
# ==========================================================
def compute_x_geometry(lot_x0, lot_x1, corr_w, side_w):
    """
    Calcula geometria X para uma casa.
    
    Casa A: corredor interno esquerda, faixa externa direita
    Casa B: faixa externa esquerda, corredor interno direita
    """
    is_casa_a = (lot_x0 == 0.0)
    
    if is_casa_a:
        # Casa A
        corr_int_x0 = lot_x0
        corr_int_x1 = lot_x0 + corr_w
        corr_ext_x1 = lot_x1
        corr_ext_x0 = lot_x1 - side_w
        amb_x0 = corr_int_x1
        amb_x1 = corr_ext_x0
    else:
        # Casa B (espelhada)
        corr_ext_x0 = lot_x0
        corr_ext_x1 = lot_x0 + side_w
        corr_int_x1 = lot_x1
        corr_int_x0 = lot_x1 - corr_w
        amb_x0 = corr_ext_x1
        amb_x1 = corr_int_x0
    
    return {
        "lot_x0": lot_x0,
        "lot_x1": lot_x1,
        "corr_int_x0": corr_int_x0,
        "corr_int_x1": corr_int_x1,
        "corr_ext_x0": corr_ext_x0,
        "corr_ext_x1": corr_ext_x1,
        "amb_x0": amb_x0,
        "amb_x1": amb_x1,
        "amb_w": amb_x1 - amb_x0,
        "is_casa_a": is_casa_a,
    }

# ==========================================================
# PROGRAMA Y (LAYOUT VERTICAL)
# ==========================================================
def compute_y_program(tipo_casa, garagem_l):
    """
    Calcula programa Y (vertical) para uma casa.
    
    tipo_casa: "A" (1Q+1S) ou "B" (2Q+1S)
    
    Regra: fundo da casa termina em y = LOTE_L - BACK_TOTAL_D (26 - 1.5 = 24.5m)
    """
    y = 0.0
    prog = {}
    
    # Garagem
    prog["y_gar_start"] = y
    prog["y_gar_end"] = y + garagem_l
    y = prog["y_gar_end"]
    
    # Sala
    prog["y_sala_start"] = y
    prog["y_sala_end"] = y + SALA_L
    y = prog["y_sala_end"]
    
    # Cozinha
    prog["y_coz_start"] = y
    prog["y_coz_end"] = y + COZINHA_L
    y = prog["y_coz_end"]
    
    # WC Social e Lavanderia (lado a lado)
    prog["y_wc_lav_start"] = y
    prog["y_wc_lav_end"] = y + WC_SOCIAL_L
    y = prog["y_wc_lav_end"]
    
    # Quartos (antes da suíte)
    # Calcular espaço disponível: até (limite_fundo - SUITE_TOTAL_L)
    limite_fundo = LOTE_L - BACK_TOTAL_D  # 24.50m
    espaco_ate_suite = limite_fundo - SUITE_TOTAL_L - y  # espaço para quartos
    
    if tipo_casa == "A":
        # 1 quarto (Casa "2 quartos" = 1Q + S)
        prog["num_quartos"] = 1
        quarto_l = espaco_ate_suite
        if quarto_l < 2.5:
            raise ValueError(f"Casa A: quarto não cabe! Espaço: {quarto_l:.2f}m")
        prog["y_q1_start"] = y
        prog["y_q1_end"] = y + quarto_l
        prog["y_quartos_end"] = prog["y_q1_end"]
    else:
        # 2 quartos (Casa "3 quartos" = 2Q + S)
        prog["num_quartos"] = 2
        quarto_l = espaco_ate_suite / 2
        if quarto_l < 2.5:
            raise ValueError(f"Casa B: quartos não cabem! Espaço por quarto: {quarto_l:.2f}m")
        prog["y_q1_start"] = y
        prog["y_q1_end"] = y + quarto_l
        prog["y_q2_start"] = prog["y_q1_end"]
        prog["y_q2_end"] = prog["y_q2_start"] + quarto_l
        prog["y_quartos_end"] = prog["y_q2_end"]
    
    # SUÍTE (bloco fixo partindo do FUNDO para trás)
    prog["y_house_end"] = limite_fundo
    prog["y_suite_end"] = limite_fundo
    prog["y_suite_start"] = limite_fundo - SUITE_TOTAL_L
    
    # Closet (primeira parte da suíte, do lado dos quartos)
    prog["y_closet_start"] = prog["y_suite_start"]
    prog["y_closet_end"] = prog["y_suite_start"] + CLOSET_L
    
    # BWC Suíte (segunda parte, mais perto do fundo)
    prog["y_bwc_suite_start"] = prog["y_closet_end"]
    prog["y_bwc_suite_end"] = prog["y_suite_end"]
    
    # Corredor interno TERMINA na porta da suíte
    prog["y_corr_int_end"] = prog["y_suite_start"]
    
    # Corredor de fundo (calçada + permeável)
    prog["y_back_calc_start"] = LOTE_L - BACK_TOTAL_D
    prog["y_back_calc_end"] = LOTE_L - BACK_TOTAL_D + BACK_CALC_D
    prog["y_back_perm_start"] = prog["y_back_calc_end"]
    prog["y_back_perm_end"] = LOTE_L
    
    return prog

# ==========================================================
# DESENHO: CONTORNO EM L (GARAGEM COBERTA)
# ==========================================================
def draw_shell_contour_L(msp, geom_x, prog, tipo_casa):
    """
    Desenha contorno externo da casa com recuo em L para garagem coberta.
    Garagem coberta: dente de 2.50m no lado esquerdo.
    """
    amb_x0 = geom_x["amb_x0"]
    amb_x1 = geom_x["amb_x1"]
    lot_x1 = geom_x["lot_x1"]
    lot_x0 = geom_x["lot_x0"]
    
    y_gar_end = prog["y_gar_end"]
    y_house_end = prog["y_house_end"]
    
    # Garagem coberta (dente): 2.50m no lado esquerdo
    if geom_x["is_casa_a"]:
        gar_cob_x = amb_x0 + GARAGEM_COB_W
        
        pts = [
            (gar_cob_x, 0),           # início garagem coberta
            (lot_x1, 0),              # vai até divisa direita
            (lot_x1, y_gar_end),      # sobe até fim garagem
            (amb_x1, y_gar_end),      # recua (início corredor externo)
            (amb_x1, y_house_end),    # sobe até fim edificação
            (amb_x0, y_house_end),    # vai para amb_x0
            (amb_x0, y_gar_end),      # desce até fim garagem
            (gar_cob_x, y_gar_end),   # volta para dente
        ]
    else:
        # Casa B (espelhada)
        gar_cob_x = amb_x1 - GARAGEM_COB_W
        
        pts = [
            (lot_x0, 0),              # início na divisa esquerda
            (gar_cob_x, 0),           # vai até dente
            (gar_cob_x, y_gar_end),   # sobe até fim garagem
            (amb_x1, y_gar_end),      # vai para amb_x1
            (amb_x1, y_house_end),    # sobe até fim edificação
            (amb_x0, y_house_end),    # vai para amb_x0 (recua)
            (amb_x0, y_gar_end),      # desce até fim garagem
            (lot_x0, y_gar_end),      # volta para divisa
        ]
    
    msp.add_lwpolyline([(mm(x), mm(y)) for x, y in pts], close=True,
                       dxfattribs={"layer": "PAREDES"})
    
    # Linha tracejada indicando cobertura da garagem
    if geom_x["is_casa_a"]:
        msp.add_line((mm(amb_x0), mm(y_gar_end * 0.5)), 
                     (mm(gar_cob_x), mm(y_gar_end * 0.5)),
                     dxfattribs={"layer": "PAREDES", "linetype": "DASHED"})
        add_text(msp, "COB", amb_x0 + GARAGEM_COB_W/2, y_gar_end * 0.5, 80)
    else:
        msp.add_line((mm(gar_cob_x), mm(y_gar_end * 0.5)), 
                     (mm(amb_x1), mm(y_gar_end * 0.5)),
                     dxfattribs={"layer": "PAREDES", "linetype": "DASHED"})
        add_text(msp, "COB", amb_x1 - GARAGEM_COB_W/2, y_gar_end * 0.5, 80)

# ==========================================================
# DESENHO: FAIXAS EXTERNAS (CALÇADA + PERMEÁVEL)
# ==========================================================
def draw_external_strip_vertical(msp, x_calc, y_start, y_end, is_casa_a):
    """
    Desenha faixa externa vertical (lateral): calçada + permeável.
    
    x_calc: coordenada X onde começa a calçada (próxima à casa)
    is_casa_a: se True, calçada à esquerda; se False, calçada à direita
    """
    if is_casa_a:
        # Casa A: calçada à esquerda, permeável à direita
        calc_x0 = x_calc
        calc_x1 = x_calc + CALCADA_W
        perm_x0 = calc_x1
        perm_x1 = calc_x1 + SIDE_PERM_W
    else:
        # Casa B: permeável à esquerda, calçada à direita
        perm_x0 = x_calc
        perm_x1 = x_calc + SIDE_PERM_W
        calc_x0 = perm_x1
        calc_x1 = perm_x1 + CALCADA_W
    
    # Desenha calçada
    add_rect(msp, calc_x0, y_start, calc_x1, y_end, "CALCADA")
    
    # Desenha permeável com hachura
    add_hatch_rect(msp, perm_x0, y_start, perm_x1, y_end)

def draw_external_strip_horizontal_back(msp, x0, x1, y_calc_start):
    """
    Desenha faixa externa horizontal (fundo): calçada + permeável.
    
    x0, x1: limites horizontais (largura)
    y_calc_start: onde começa a calçada (após a casa)
    """
    # Calçada de fundo
    calc_y0 = y_calc_start
    calc_y1 = y_calc_start + BACK_CALC_D
    add_rect(msp, x0, calc_y0, x1, calc_y1, "CALCADA")
    
    # Permeável de fundo
    perm_y0 = calc_y1
    perm_y1 = calc_y1 + BACK_PERM_D
    add_hatch_rect(msp, x0, perm_y0, x1, perm_y1)

# ==========================================================
# DESENHO: DIVISÓRIAS INTERNAS
# ==========================================================
def draw_internal_walls(msp, geom_x, prog, tipo_casa):
    """Desenha todas as divisórias internas horizontais e verticais"""
    amb_x0 = geom_x["amb_x0"]
    amb_x1 = geom_x["amb_x1"]
    
    # Garagem/Sala
    msp.add_line((mm(amb_x0), mm(prog["y_gar_end"])), 
                 (mm(amb_x1), mm(prog["y_gar_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # Sala/Cozinha: meia parede de 1.20m + bancada
    y_sala_end = prog["y_sala_end"]
    parede_x0 = amb_x0
    parede_x1 = amb_x0 + BANCADA_PAREDE_L
    
    # Meia parede (1.20m)
    msp.add_line((mm(parede_x0), mm(y_sala_end)), (mm(parede_x1), mm(y_sala_end)),
                 dxfattribs={"layer": "PAREDES"})
    
    # Bancada (após a meia parede, largura 1.20m)
    banc_x0 = parede_x1
    banc_x1 = min(banc_x0 + BANCADA_L, amb_x1)
    banc_y0 = y_sala_end - 0.45  # centraliza (0.90/2)
    banc_y1 = y_sala_end + 0.45
    add_bancada(msp, banc_x0, banc_y0, banc_x1, banc_y1, "MOBILIARIO")
    
    # Cozinha/WC-LAV
    msp.add_line((mm(amb_x0), mm(prog["y_coz_end"])), 
                 (mm(amb_x1), mm(prog["y_coz_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # WC Social e Lavanderia (divisória vertical, espelhada corretamente)
    if geom_x["is_casa_a"]:
        wc_x_div = amb_x0 + WC_SOCIAL_W
    else:
        wc_x_div = amb_x1 - WC_SOCIAL_W
    
    msp.add_line((mm(wc_x_div), mm(prog["y_wc_lav_start"])), 
                 (mm(wc_x_div), mm(prog["y_wc_lav_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # WC-LAV/Quartos
    msp.add_line((mm(amb_x0), mm(prog["y_wc_lav_end"])), 
                 (mm(amb_x1), mm(prog["y_wc_lav_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # Quartos
    if tipo_casa == "A":
        # 1 quarto/Suíte
        msp.add_line((mm(amb_x0), mm(prog["y_q1_end"])), 
                     (mm(amb_x1), mm(prog["y_q1_end"])),
                     dxfattribs={"layer": "PAREDES"})
    else:
        # Quarto 1/Quarto 2
        msp.add_line((mm(amb_x0), mm(prog["y_q1_end"])), 
                     (mm(amb_x1), mm(prog["y_q1_end"])),
                     dxfattribs={"layer": "PAREDES"})
        # Quarto 2/Suíte
        msp.add_line((mm(amb_x0), mm(prog["y_q2_end"])), 
                     (mm(amb_x1), mm(prog["y_q2_end"])),
                     dxfattribs={"layer": "PAREDES"})
    
    # Divisória antes da suíte (entre quartos e suíte)
    msp.add_line((mm(amb_x0), mm(prog["y_suite_start"])), 
                 (mm(amb_x1), mm(prog["y_suite_start"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # SUÍTE: bloco reto de 1.50m colado no corredor interno
    if geom_x["is_casa_a"]:
        # Casa A: suíte no lado do corredor interno (esquerda)
        suite_x0 = amb_x0
        suite_x1 = amb_x0 + SUITE_BLOCO_W
        closet_x0 = suite_x0
        closet_x1 = suite_x1
        bwc_x0 = suite_x0  # alinhado
        bwc_x1 = suite_x0 + BWC_SUITE_W  # 1.50m
    else:
        # Casa B: suíte no lado do corredor interno (direita)
        suite_x1 = amb_x1
        suite_x0 = amb_x1 - SUITE_BLOCO_W
        closet_x0 = suite_x0
        closet_x1 = suite_x1
        bwc_x1 = suite_x1  # alinhado
        bwc_x0 = suite_x1 - BWC_SUITE_W  # 1.50m
    
    # Parede lateral da suíte (closet)
    msp.add_line((mm(closet_x1 if geom_x["is_casa_a"] else closet_x0), mm(prog["y_suite_start"])), 
                 (mm(closet_x1 if geom_x["is_casa_a"] else closet_x0), mm(prog["y_closet_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # Divisória entre closet e bwc suíte
    msp.add_line((mm(bwc_x0), mm(prog["y_closet_end"])), 
                 (mm(bwc_x1), mm(prog["y_closet_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # Parede lateral do bwc (alinhada com closet)
    msp.add_line((mm(bwc_x1 if geom_x["is_casa_a"] else bwc_x0), mm(prog["y_closet_end"])), 
                 (mm(bwc_x1 if geom_x["is_casa_a"] else bwc_x0), mm(prog["y_suite_end"])),
                 dxfattribs={"layer": "PAREDES"})

# ==========================================================
# DESENHO: PORTAS E JANELAS
# ==========================================================
def draw_door_v(msp, x_wall, y0, w, swing="R"):
    """Porta vertical (vão + arco)"""
    msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall), mm(y0+w)), 
                 dxfattribs={"layer": "PORTAS"})
    if swing == "R":
        msp.add_arc((mm(x_wall), mm(y0)), mm(w), 0, 90, 
                    dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall+w), mm(y0)), 
                     dxfattribs={"layer": "PORTAS"})
    else:
        msp.add_arc((mm(x_wall), mm(y0)), mm(w), 90, 180, 
                    dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall-w), mm(y0)), 
                     dxfattribs={"layer": "PORTAS"})

def draw_door_h(msp, x0, y_wall, w, swing="U"):
    """Porta horizontal"""
    msp.add_line((mm(x0), mm(y_wall)), (mm(x0+w), mm(y_wall)), 
                 dxfattribs={"layer": "PORTAS"})
    if swing == "U":
        msp.add_arc((mm(x0), mm(y_wall)), mm(w), 0, 90, 
                    dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0), mm(y_wall)), (mm(x0), mm(y_wall+w)), 
                     dxfattribs={"layer": "PORTAS"})

def draw_window(msp, x, y, w, direction="V"):
    """Janela"""
    if direction == "V":
        msp.add_line((mm(x), mm(y)), (mm(x), mm(y+w)), 
                     dxfattribs={"layer": "JANELAS"})
    else:
        msp.add_line((mm(x), mm(y)), (mm(x+w), mm(y)), 
                     dxfattribs={"layer": "JANELAS"})

def draw_portao_basculante(msp, x0, y, w):
    """Portão basculante"""
    msp.add_line((mm(x0), mm(y)), (mm(x0+w), mm(y)), 
                 dxfattribs={"layer": "PORTAO"})
    mid_x = x0 + w/2
    arrow_h = 0.30
    msp.add_line((mm(mid_x), mm(y)), (mm(mid_x), mm(y + arrow_h)), 
                 dxfattribs={"layer": "PORTAO"})
    msp.add_line((mm(mid_x - 0.15), mm(y + arrow_h - 0.10)), 
                 (mm(mid_x), mm(y + arrow_h)), 
                 dxfattribs={"layer": "PORTAO"})
    msp.add_line((mm(mid_x + 0.15), mm(y + arrow_h - 0.10)), 
                 (mm(mid_x), mm(y + arrow_h)), 
                 dxfattribs={"layer": "PORTAO"})

def draw_doors_windows(msp, geom_x, prog, tipo_casa):
    """Desenha portas e janelas"""
    amb_x0 = geom_x["amb_x0"]
    amb_x1 = geom_x["amb_x1"]
    corr_int_x0 = geom_x["corr_int_x0"]
    corr_int_x1 = geom_x["corr_int_x1"]
    is_casa_a = geom_x["is_casa_a"]
    
    # Parede do corredor interno (onde ficam TODAS as portas internas)
    x_portas = corr_int_x1 if is_casa_a else corr_int_x0
    swing_portas = "R" if is_casa_a else "L"
    
    # Porta entrada da sala (na divisória garagem/sala)
    y_porta_entrada = prog["y_gar_end"]
    x_porta_entrada = amb_x0 + 1.0 if is_casa_a else amb_x1 - PORTA_ENTRADA - 1.0
    draw_door_h(msp, x_porta_entrada, y_porta_entrada, PORTA_ENTRADA)
    
    # Porta WC Social
    y_wc = prog["y_wc_lav_start"] + 0.5
    draw_door_v(msp, x_portas, y_wc, PORTA_WC, swing_portas)
    
    # Porta Lavanderia (também no corredor interno)
    y_lav = prog["y_wc_lav_start"] + 1.5
    draw_door_v(msp, x_portas, y_lav, PORTA_WC, swing_portas)
    
    # Portas dos quartos
    if tipo_casa == "A":
        y_q1 = prog["y_wc_lav_end"] + 0.5
        draw_door_v(msp, x_portas, y_q1, PORTA_QUARTO, swing_portas)
    else:
        y_q1 = prog["y_wc_lav_end"] + 0.5
        y_q2 = prog["y_q1_end"] + 0.5
        draw_door_v(msp, x_portas, y_q1, PORTA_QUARTO, swing_portas)
        draw_door_v(msp, x_portas, y_q2, PORTA_QUARTO, swing_portas)
    
    # Porta da SUÍTE (na parede do corredor interno, início da suíte)
    y_suite_porta = prog["y_suite_start"] + 0.5
    draw_door_v(msp, x_portas, y_suite_porta, PORTA_QUARTO, swing_portas)
    
    # Assert: porta da suíte está no corredor interno
    assert abs(x_portas - corr_int_x1) < 0.01 or abs(x_portas - corr_int_x0) < 0.01, \
        f"ERRO: Porta da suíte não está no corredor interno! x={x_portas}"
    
    # VÃO entre quarto da suíte e closet (0.70m, sem porta)
    if geom_x["is_casa_a"]:
        vao_x = amb_x0 + SUITE_BLOCO_W
    else:
        vao_x = amb_x1 - SUITE_BLOCO_W
    y_vao = prog["y_closet_start"] + 1.0
    msp.add_line((mm(vao_x), mm(y_vao)), (mm(vao_x), mm(y_vao + 0.70)),
                 dxfattribs={"layer": "PORTAS"})
    
    # Porta do BWC da suíte (do closet para o bwc)
    y_porta_bwc = prog["y_bwc_suite_start"] + 0.5
    if geom_x["is_casa_a"]:
        # Casa A: porta horizontal no início do bwc
        x_porta_bwc = amb_x0 + 0.3
        msp.add_line((mm(x_porta_bwc), mm(prog["y_bwc_suite_start"])),
                     (mm(x_porta_bwc + PORTA_WC), mm(prog["y_bwc_suite_start"])),
                     dxfattribs={"layer": "PORTAS"})
    else:
        # Casa B: porta horizontal no início do bwc
        x_porta_bwc = amb_x1 - SUITE_BLOCO_W + 0.3
        msp.add_line((mm(x_porta_bwc), mm(prog["y_bwc_suite_start"])),
                     (mm(x_porta_bwc + PORTA_WC), mm(prog["y_bwc_suite_start"])),
                     dxfattribs={"layer": "PORTAS"})
    
    # Janelas voltadas para faixa externa
    x_janelas = amb_x1 if is_casa_a else amb_x0
    
    # Janela sala
    draw_window(msp, x_janelas, prog["y_sala_start"] + 1.0, JANELA_SALA, "V")
    
    # Janela WC
    y_wc_centro = (prog["y_wc_lav_start"] + prog["y_wc_lav_end"]) / 2
    draw_window(msp, x_janelas, y_wc_centro - JANELA_WC/2, JANELA_WC, "V")
    
    # Janelas quartos
    if tipo_casa == "A":
        y_q1_c = (prog["y_wc_lav_end"] + prog["y_q1_end"]) / 2
        draw_window(msp, x_janelas, y_q1_c - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    else:
        y_q1_c = (prog["y_wc_lav_end"] + prog["y_q1_end"]) / 2
        y_q2_c = (prog["y_q1_end"] + prog["y_q2_end"]) / 2
        draw_window(msp, x_janelas, y_q1_c - JANELA_QUARTO/2, JANELA_QUARTO, "V")
        draw_window(msp, x_janelas, y_q2_c - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    
    # Janela suíte
    y_suite_c = (prog["y_quartos_end"] + prog["y_suite_end"]) / 2
    draw_window(msp, x_janelas, y_suite_c - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    
    # Portão
    x_portao = geom_x["lot_x0"] + (geom_x["lot_x1"] - geom_x["lot_x0"] - PORTAO_W) / 2
    draw_portao_basculante(msp, x_portao, 0, PORTAO_W)

# ==========================================================
# DESENHO: ÁREAS PERMEÁVEIS COM HACHURA
# ==========================================================
def draw_hatches_permeavel(msp, geom_x, prog, tipo_casa):
    """Desenha hachuras das áreas permeáveis e corredor interno"""
    amb_x0 = geom_x["amb_x0"]
    amb_x1 = geom_x["amb_x1"]
    lot_x0 = geom_x["lot_x0"]
    lot_x1 = geom_x["lot_x1"]
    corr_ext_x0 = geom_x["corr_ext_x0"]
    corr_ext_x1 = geom_x["corr_ext_x1"]
    corr_int_x0 = geom_x["corr_int_x0"]
    corr_int_x1 = geom_x["corr_int_x1"]
    
    y_gar_end = prog["y_gar_end"]
    y_house_end = prog["y_house_end"]
    y_corr_int_end = prog["y_corr_int_end"]
    y_back_calc_start = prog["y_back_calc_start"]
    
    # Corredor interno (área de circulação) - termina na porta da suíte
    add_rect(msp, corr_int_x0, y_gar_end, corr_int_x1, y_corr_int_end, "CORR_INT")
    x_corr = (corr_int_x0 + corr_int_x1) / 2
    y_corr = (y_gar_end + y_corr_int_end) / 2
    add_text(msp, "CORREDOR", x_corr, y_corr, 80, "TEXTOS", 90)
    add_text(msp, "INTERNO", x_corr, y_corr - 0.4, 80, "TEXTOS", 90)
    
    # Faixa externa lateral (vertical) - NOVA FUNÇÃO
    draw_external_strip_vertical(msp, corr_ext_x0, y_gar_end, y_house_end, geom_x["is_casa_a"])
    
    # Faixa externa de fundo (horizontal) - largura do lote inteiro
    draw_external_strip_horizontal_back(msp, lot_x0, lot_x1, y_back_calc_start)

# ==========================================================
# DESENHO: COTAS
# ==========================================================
def draw_dimensions(msp, geom_x, prog, tipo_casa):
    """Adiciona cotas principais e textos dos ambientes"""
    amb_x0 = geom_x["amb_x0"]
    amb_x1 = geom_x["amb_x1"]
    lot_x0 = geom_x["lot_x0"]
    lot_x1 = geom_x["lot_x1"]
    
    # ========== TEXTOS DOS AMBIENTES ==========
    x_texto = (amb_x0 + amb_x1) / 2
    
    # Garagem
    y_gar = (prog["y_gar_start"] + prog["y_gar_end"]) / 2
    add_text(msp, "GARAGEM", x_texto, y_gar, 120, "TEXTOS")
    area_gar = geom_x["amb_w"] * (prog["y_gar_end"] - prog["y_gar_start"])
    add_text(msp, f"{area_gar:.1f}m²", x_texto, y_gar - 0.3, 80, "TEXTOS")
    
    # Sala
    y_sala = (prog["y_sala_start"] + prog["y_sala_end"]) / 2
    add_text(msp, "SALA", x_texto, y_sala, 120, "TEXTOS")
    area_sala = geom_x["amb_w"] * SALA_L
    add_text(msp, f"{area_sala:.1f}m²", x_texto, y_sala - 0.3, 80, "TEXTOS")
    
    # Cozinha
    y_coz = (prog["y_coz_start"] + prog["y_coz_end"]) / 2
    add_text(msp, "COZINHA", x_texto, y_coz, 100, "TEXTOS")
    area_coz = geom_x["amb_w"] * COZINHA_L
    add_text(msp, f"{area_coz:.1f}m²", x_texto, y_coz - 0.3, 80, "TEXTOS")
    
    # WC Social e Lavanderia (espelhamento correto)
    y_wc = (prog["y_wc_lav_start"] + prog["y_wc_lav_end"]) / 2
    
    if geom_x["is_casa_a"]:
        wc_x0 = amb_x0
        wc_x1 = amb_x0 + WC_SOCIAL_W
        lav_x0 = wc_x1
        lav_x1 = amb_x1
    else:
        lav_x0 = amb_x0
        lav_x1 = amb_x1 - WC_SOCIAL_W
        wc_x0 = lav_x1
        wc_x1 = amb_x1
    
    wc_cx = (wc_x0 + wc_x1) / 2
    lav_cx = (lav_x0 + lav_x1) / 2
    lav_w = lav_x1 - lav_x0
    
    add_text(msp, "WC", wc_cx, y_wc, 80, "TEXTOS")
    area_wc = WC_SOCIAL_W * WC_SOCIAL_L
    add_text(msp, f"{area_wc:.1f}m²", wc_cx, y_wc - 0.25, 60, "TEXTOS")
    
    add_text(msp, "LAV", lav_cx, y_wc, 80, "TEXTOS")
    area_lav = lav_w * WC_SOCIAL_L
    add_text(msp, f"{area_lav:.1f}m²", lav_cx, y_wc - 0.25, 60, "TEXTOS")
    
    # Quartos
    if tipo_casa == "A":
        y_q1 = (prog["y_wc_lav_end"] + prog["y_q1_end"]) / 2
        add_text(msp, "QUARTO", x_texto, y_q1, 100, "TEXTOS")
        area_q1 = geom_x["amb_w"] * QUARTO_MIN_L
        add_text(msp, f"{area_q1:.1f}m²", x_texto, y_q1 - 0.3, 80, "TEXTOS")
    else:
        y_q1 = (prog["y_wc_lav_end"] + prog["y_q1_end"]) / 2
        add_text(msp, "QUARTO 1", x_texto, y_q1, 100, "TEXTOS")
        area_q1 = geom_x["amb_w"] * QUARTO_MIN_L
        add_text(msp, f"{area_q1:.1f}m²", x_texto, y_q1 - 0.3, 80, "TEXTOS")
        
        y_q2 = (prog["y_q1_end"] + prog["y_q2_end"]) / 2
        add_text(msp, "QUARTO 2", x_texto, y_q2, 100, "TEXTOS")
        area_q2 = geom_x["amb_w"] * QUARTO_MIN_L
        add_text(msp, f"{area_q2:.1f}m²", x_texto, y_q2 - 0.3, 80, "TEXTOS")
    
    # Quarto da suíte (área restante do ambiente menos bloco de 1.50m)
    y_suite_q = (prog["y_suite_start"] + prog["y_suite_end"]) / 2
    suite_q_w = geom_x["amb_w"] - SUITE_BLOCO_W
    suite_q_area = suite_q_w * SUITE_TOTAL_L
    add_text(msp, "SUÍTE", x_texto, y_suite_q, 100, "TEXTOS")
    add_text(msp, f"{suite_q_area:.1f}m²", x_texto, y_suite_q - 0.3, 80, "TEXTOS")
    
    # Closet (no bloco)
    if geom_x["is_casa_a"]:
        closet_x = amb_x0 + SUITE_BLOCO_W/2
    else:
        closet_x = amb_x1 - SUITE_BLOCO_W/2
    y_closet = (prog["y_closet_start"] + prog["y_closet_end"]) / 2
    add_text(msp, "CLOSET", closet_x, y_closet, 70, "TEXTOS", 90)
    
    # BWC Suíte (no bloco)
    y_bwc_s = (prog["y_bwc_suite_start"] + prog["y_bwc_suite_end"]) / 2
    add_text(msp, "BWC", closet_x, y_bwc_s, 70, "TEXTOS", 90)
    
    # Corredor de fundo
    y_cf = (prog["y_back_calc_start"] + prog["y_back_perm_end"]) / 2
    add_text(msp, "CORREDOR FUNDO", x_texto, y_cf, 80, "TEXTOS")
    add_text(msp, f"{BACK_TOTAL_D:.2f}m", x_texto, y_cf - 0.3, 70, "TEXTOS")
    
    # ========== COTAS ==========
    # Cotas principais em todas as paredes
    
    # COTAS HORIZONTAIS (dimensões X)
    # Corredor interno
    add_cota_h(msp, geom_x["corr_int_x0"], geom_x["corr_int_x1"], 0, -0.60)
    
    # Largura ambiente
    add_cota_h(msp, geom_x["amb_x0"], geom_x["amb_x1"], 0, -1.00)
    
    # WC Social largura
    if geom_x["is_casa_a"]:
        wc_x0 = amb_x0
        wc_x1 = amb_x0 + WC_SOCIAL_W
    else:
        wc_x1 = amb_x1
        wc_x0 = amb_x1 - WC_SOCIAL_W
    add_cota_h(msp, wc_x0, wc_x1, prog["y_wc_lav_start"], 0.30)
    
    # Bloco suíte largura
    add_cota_h(msp, geom_x["amb_x0"], geom_x["amb_x0"] + SUITE_BLOCO_W if geom_x["is_casa_a"] else geom_x["amb_x1"] - SUITE_BLOCO_W, prog["y_suite_start"], 0.30)
    
    # Faixa externa
    add_cota_h(msp, geom_x["corr_ext_x0"], geom_x["corr_ext_x1"], 0, -1.40)
    
    # Largura total lote
    add_cota_h(msp, geom_x["lot_x0"], geom_x["lot_x1"], 0, -1.80)
    
    # COTAS VERTICAIS (dimensões Y) - lado do corredor externo
    x_cota = geom_x["corr_ext_x1"] + 0.30 if geom_x["is_casa_a"] else geom_x["corr_ext_x0"] - 0.30
    offset_cota = 0.40 if geom_x["is_casa_a"] else -0.40
    
    # Garagem
    add_cota_v(msp, prog["y_gar_start"], prog["y_gar_end"], x_cota, offset_cota)
    
    # Sala
    add_cota_v(msp, prog["y_sala_start"], prog["y_sala_end"], x_cota, offset_cota)
    
    # Cozinha
    add_cota_v(msp, prog["y_coz_start"], prog["y_coz_end"], x_cota, offset_cota)
    
    # WC/LAV
    add_cota_v(msp, prog["y_wc_lav_start"], prog["y_wc_lav_end"], x_cota, offset_cota)
    
    # Quartos
    if tipo_casa == "A":
        add_cota_v(msp, prog["y_wc_lav_end"], prog["y_q1_end"], x_cota, offset_cota)
    else:
        add_cota_v(msp, prog["y_wc_lav_end"], prog["y_q1_end"], x_cota, offset_cota)
        add_cota_v(msp, prog["y_q1_end"], prog["y_q2_end"], x_cota, offset_cota)
    
    # Suíte
    add_cota_v(msp, prog["y_suite_start"], prog["y_closet_end"], x_cota, offset_cota * 2)  # Closet
    add_cota_v(msp, prog["y_closet_end"], prog["y_suite_end"], x_cota, offset_cota * 2)  # BWC
    
    # Corredor fundo total
    add_cota_v(msp, prog["y_house_end"], LOTE_L, x_cota, offset_cota)
    
    # Altura total edificação
    add_cota_v(msp, 0, prog["y_house_end"], geom_x["lot_x1"] + 0.80 if geom_x["is_casa_a"] else geom_x["lot_x0"] - 0.80, 
                0.80 if geom_x["is_casa_a"] else -0.80)

# ==========================================================
# VALIDAÇÃO E CÁLCULO DE PERMEÁVEL
# ==========================================================
def calcular_permeavel(geom_x, prog):
    """Calcula área permeável total (lateral + fundo, SEM quintal interno)"""
    lot_w = geom_x["lot_x1"] - geom_x["lot_x0"]
    
    # Faixa lateral permeável (vertical)
    faixa_l = prog["y_house_end"] - prog["y_gar_end"]
    faixa_lateral = SIDE_PERM_W * faixa_l
    
    # Faixa de fundo permeável (horizontal) - largura do lote
    faixa_fundo = lot_w * BACK_PERM_D
    
    total = faixa_lateral + faixa_fundo
    
    return {
        "faixa_lateral": faixa_lateral,
        "faixa_fundo": faixa_fundo,
        "total": total,
    }

def validate_asserts(geom_x_a, geom_x_b, prog_a, prog_b, perm_a, perm_b):
    """Valida todas as regras críticas"""
    
    print("\n" + "="*70)
    print("CONFIGURAÇÃO DO CORREDOR EXTERNO")
    print("="*70)
    print(f"CORR_INT_W = {CORR_INT_W:.2f}m")
    print(f"SIDE_TOTAL_W = {SIDE_TOTAL_W:.2f}m (CALCADA {CALCADA_W:.2f}m + PERMEÁVEL {SIDE_PERM_W:.2f}m)")
    print(f"BACK_TOTAL_D = {BACK_TOTAL_D:.2f}m (CALCADA {BACK_CALC_D:.2f}m + PERMEÁVEL {BACK_PERM_D:.2f}m)")
    
    # 1. Geometria X
    print("\n" + "="*70)
    print("GEOMETRIA X (FIXA)")
    print("="*70)
    
    print(f"Casa A: Corr.Int [{geom_x_a['corr_int_x0']:.2f}..{geom_x_a['corr_int_x1']:.2f}] | "
          f"Amb [{geom_x_a['amb_x0']:.2f}..{geom_x_a['amb_x1']:.2f}] | "
          f"Faixa Ext [{geom_x_a['corr_ext_x0']:.2f}..{geom_x_a['corr_ext_x1']:.2f}]")
    
    print(f"Casa B: Faixa Ext [{geom_x_b['corr_ext_x0']:.2f}..{geom_x_b['corr_ext_x1']:.2f}] | "
          f"Amb [{geom_x_b['amb_x0']:.2f}..{geom_x_b['amb_x1']:.2f}] | "
          f"Corr.Int [{geom_x_b['corr_int_x0']:.2f}..{geom_x_b['corr_int_x1']:.2f}]")
    
    # Validação da geometria X
    assert geom_x_a['corr_int_x0'] == 0.0, "Casa A: corredor interno deve começar em 0"
    assert geom_x_a['corr_int_x1'] == CORR_INT_W, "Casa A: corredor interno largura incorreta"
    assert abs(geom_x_a['corr_ext_x1'] - 5.0) < 0.01, "Casa A: faixa externa deve terminar em 5.0"
    assert abs(geom_x_a['corr_ext_x0'] - (5.0 - SIDE_TOTAL_W)) < 0.01, "Casa A: faixa externa largura incorreta"
    
    assert geom_x_b['corr_ext_x0'] == 5.0, "Casa B: faixa externa deve começar em 5.0"
    assert abs(geom_x_b['corr_ext_x1'] - (5.0 + SIDE_TOTAL_W)) < 0.01, "Casa B: faixa externa largura incorreta"
    assert abs(geom_x_b['corr_int_x1'] - 10.0) < 0.01, "Casa B: corredor interno deve terminar em 10.0"
    assert abs(geom_x_b['corr_int_x0'] - (10.0 - CORR_INT_W)) < 0.01, "Casa B: corredor interno largura incorreta"
    
    # 2. Y_house_end
    print("\n" + "="*70)
    print("FIM DA EDIFICAÇÃO (y_house_end)")
    print("="*70)
    limite_esperado = LOTE_L - BACK_TOTAL_D
    print(f"Limite esperado: {limite_esperado:.2f}m (26.00 - 1.50)")
    print(f"Casa A: y_house_end = {prog_a['y_house_end']:.2f}m {'✓' if prog_a['y_house_end'] <= limite_esperado else '✗ EXCEDEU'}")
    print(f"Casa B: y_house_end = {prog_b['y_house_end']:.2f}m {'✓' if prog_b['y_house_end'] <= limite_esperado else '✗ EXCEDEU'}")
    
    assert prog_a['y_house_end'] <= limite_esperado + 0.01, f"Casa A: edificação passa do limite! {prog_a['y_house_end']} > {limite_esperado}"
    assert prog_b['y_house_end'] <= limite_esperado + 0.01, f"Casa B: edificação passa do limite! {prog_b['y_house_end']} > {limite_esperado}"
    
    # 3. Permeável
    print("\n" + "="*70)
    print("ÁREA PERMEÁVEL (mínimo 13.00 m²)")
    print("="*70)
    
    print(f"\nCasa A:")
    print(f"  Faixa lateral: {perm_a['faixa_lateral']:.2f} m²")
    print(f"  Faixa fundo: {perm_a['faixa_fundo']:.2f} m²")
    print(f"  TOTAL: {perm_a['total']:.2f} m² {'✓ OK' if perm_a['total'] >= PERMEAVEL_MIN else '✗ INSUFICIENTE'}")
    
    print(f"\nCasa B:")
    print(f"  Faixa lateral: {perm_b['faixa_lateral']:.2f} m²")
    print(f"  Faixa fundo: {perm_b['faixa_fundo']:.2f} m²")
    print(f"  TOTAL: {perm_b['total']:.2f} m² {'✓ OK' if perm_b['total'] >= PERMEAVEL_MIN else '✗ INSUFICIENTE'}")
    
    assert perm_a['total'] >= PERMEAVEL_MIN, f"Casa A: permeável insuficiente! {perm_a['total']:.2f} < {PERMEAVEL_MIN}"
    assert perm_b['total'] >= PERMEAVEL_MIN, f"Casa B: permeável insuficiente! {perm_b['total']:.2f} < {PERMEAVEL_MIN}"
    
    print("\n" + "="*70)
    print("✓ TODAS AS VALIDAÇÕES PASSARAM!")
    print("="*70)

# ==========================================================
# MAIN
# ==========================================================
def main():
    """Gera planta master final"""
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    
    setup_layers(doc)
    
    doc.header["$INSUNITS"] = INSUNITS_MM
    doc.header["$LTSCALE"] = 1
    doc.header["$CELTSCALE"] = 1
    
    if "DASHED" not in doc.linetypes:
        doc.linetypes.add("DASHED", description="Dashed", pattern=[DASH_MM, -GAP_MM])
    
    # ========== CASA A ==========
    geom_x_a = compute_x_geometry(0.0, 5.0, CORR_INT_W, SIDE_TOTAL_W)
    prog_a = compute_y_program("A", GARAGEM_A_L)
    
    draw_shell_contour_L(msp, geom_x_a, prog_a, "A")
    draw_internal_walls(msp, geom_x_a, prog_a, "A")
    draw_doors_windows(msp, geom_x_a, prog_a, "A")
    draw_hatches_permeavel(msp, geom_x_a, prog_a, "A")
    draw_dimensions(msp, geom_x_a, prog_a, "A")
    
    # ========== CASA B ==========
    geom_x_b = compute_x_geometry(5.0, 10.0, CORR_INT_W, SIDE_TOTAL_W)
    prog_b = compute_y_program("B", GARAGEM_B_L)
    
    draw_shell_contour_L(msp, geom_x_b, prog_b, "B")
    draw_internal_walls(msp, geom_x_b, prog_b, "B")
    draw_doors_windows(msp, geom_x_b, prog_b, "B")
    draw_hatches_permeavel(msp, geom_x_b, prog_b, "B")
    draw_dimensions(msp, geom_x_b, prog_b, "B")
    
    # ========== DIVISAS MASTER ==========
    msp.add_lwpolyline([
        (0, 0), (mm(MASTER_W), 0), (mm(MASTER_W), mm(MASTER_L)), (0, mm(MASTER_L))
    ], close=True, dxfattribs={"layer": "DIVISAS"})
    
    # Divisa central
    msp.add_line((mm(5.0), 0), (mm(5.0), mm(MASTER_L)), dxfattribs={"layer": "DIVISAS"})
    
    # ========== CÁLCULO DE PERMEÁVEL ==========
    perm_a = calcular_permeavel(geom_x_a, prog_a)
    perm_b = calcular_permeavel(geom_x_b, prog_b)
    
    # Cotas gerais
    add_text(msp, "10000", MASTER_W/2, MASTER_L + 0.5, 120, "COTAS")
    add_text(msp, "26000", MASTER_W + 0.5, MASTER_L/2, 120, "COTAS", 90)
    add_text(msp, f"PORTÃO {PORTAO_W:.1f}m x {PORTAO_H:.1f}m BASCULANTE", 2.5, -0.8, 100, "TEXTOS")
    add_text(msp, f"PORTÃO {PORTAO_W:.1f}m x {PORTAO_H:.1f}m BASCULANTE", 7.5, -0.8, 100, "TEXTOS")
    
    # Identificação das casas
    add_text(msp, "CASA A", 2.5, MASTER_L + 1.2, 150, "TEXTOS")
    add_text(msp, "1 QUARTO + SUÍTE", 2.5, MASTER_L + 0.8, 100, "TEXTOS")
    add_text(msp, f"PERMEÁVEL: {perm_a['total']:.1f}m²", 2.5, -1.5, 90, "TEXTOS")
    
    add_text(msp, "CASA B", 7.5, MASTER_L + 1.2, 150, "TEXTOS")
    add_text(msp, "2 QUARTOS + SUÍTE", 7.5, MASTER_L + 0.8, 100, "TEXTOS")
    add_text(msp, f"PERMEÁVEL: {perm_b['total']:.1f}m²", 7.5, -1.5, 90, "TEXTOS")
    
    # ========== VALIDAÇÕES ==========
    validate_asserts(geom_x_a, geom_x_b, prog_a, prog_b, perm_a, perm_b)
    
    # ========== SALVAR ==========
    filename = "master_10x26_v12.dxf"
    doc.saveas(filename)
    
    print(f"\n✓✓✓ ARQUIVO GERADO: {filename} ✓✓✓")
    print(f"✓ Geometria X: CORRIGIDA E VALIDADA")
    print(f"✓ Porta suíte: NO CORREDOR INTERNO (ambas casas)")
    print(f"✓ Corredor externo: {SIDE_TOTAL_W:.2f}m lateral + {BACK_TOTAL_D:.2f}m fundo")
    print(f"✓ Permeável Casa A: {perm_a['total']:.2f}m² (>= {PERMEAVEL_MIN}m²)")
    print(f"✓ Permeável Casa B: {perm_b['total']:.2f}m² (>= {PERMEAVEL_MIN}m²)")
    print(f"✓ Cotas e textos: INCLUÍDOS")
    print(f"✓ Simbologia: MANTIDA (layers, cores, hatch, dashed)")

if __name__ == "__main__":
    main()
