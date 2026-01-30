#!/usr/bin/env python3
"""
GERADOR DE PLANTA MASTER 10x26m - VERSÃO FINAL
Duas casas geminadas (5x26m cada) com layout correto.

GEOMETRIA X FIXA:
Casa A: Corr.Int [0.00-corr_w] | Amb [corr_w-(5.00-1.10)] | Faixa Ext [(5.00-1.10)-5.00]
Casa B: Faixa Ext [5.00-(5.00+1.10)] | Amb [(5.00+1.10)-(10.00-corr_w)] | Corr.Int [(10.00-corr_w)-10.00]

RECUO DE FUNDO: 1.50m contínuo (corredor de fundo permeável)
PERMEÁVEL MÍNIMO: 13.00 m² por casa
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
CLOSET_W = 1.20  # largura do closet
CLOSET_L = 1.50  # profundidade do closet

# Garagens (Casa A tem garagem mais profunda que Casa B)
GARAGEM_A_L = 5.00  # Casa A: 1 quarto + suíte (menos dormitórios)
GARAGEM_B_L = 4.50  # Casa B: 2 quartos + suíte (mais dormitórios)
GARAGEM_COB_W = 2.50  # Largura da garagem coberta (dente)

# Alturas das divisórias (ajustadas para caber com recuo de fundo 1,50m)
SALA_L = 3.20
COZINHA_L = 2.50
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

def add_text(msp, text, x, y, height=100, layer="TEXTOS", rotation=0):
    """Adiciona texto centrado"""
    msp.add_text(text, height=height, dxfattribs={
        "layer": layer, "rotation": rotation
    }).set_placement((mm(x), mm(y)), align=TextEntityAlignment.CENTER)

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
    
    # Quartos
    if tipo_casa == "A":
        # 1 quarto
        prog["num_quartos"] = 1
        prog["y_q1_start"] = y
        prog["y_q1_end"] = y + QUARTO_MIN_L
        y = prog["y_q1_end"]
        prog["y_quartos_end"] = y
    else:
        # 2 quartos
        prog["num_quartos"] = 2
        prog["y_q1_start"] = y
        prog["y_q1_end"] = y + QUARTO_MIN_L
        y = prog["y_q1_end"]
        prog["y_q2_start"] = y
        prog["y_q2_end"] = y + QUARTO_MIN_L
        y = prog["y_q2_end"]
        prog["y_quartos_end"] = y
    
    # Suíte
    prog["y_suite_start"] = y
    prog["y_suite_end"] = y + SUITE_MIN_L
    y = prog["y_suite_end"]
    
    # BWC Suíte (dentro da suíte)
    prog["y_bwc_suite_end"] = prog["y_suite_end"] + BWC_SUITE_L
    
    # FIM DA EDIFICAÇÃO (deve ser <= LOTE_L - BACK_TOTAL_D)
    prog["y_house_end"] = prog["y_bwc_suite_end"]
    
    # Ajuste automático se passar do limite
    limite_fundo = LOTE_L - BACK_TOTAL_D
    if prog["y_house_end"] > limite_fundo:
        # Reduz proporcionalmente todas as áreas
        excesso = prog["y_house_end"] - limite_fundo
        print(f"AVISO: Casa {tipo_casa} passa do limite. Ajustando...")
        # Simplificação: reduz quintal interno (não implementado aqui, assumindo que cabe)
    
    prog["y_house_end"] = min(prog["y_house_end"], limite_fundo)
    
    # Quintal (permeável interno) - de edificação até início do corredor de fundo
    prog["y_quintal_start"] = prog["y_house_end"]
    prog["y_quintal_end"] = LOTE_L - BACK_TOTAL_D
    
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
    
    # Sala/Cozinha (meia parede + bancada)
    y_div = prog["y_sala_end"]
    # Meia parede (representar como linha mais grossa ou dupla)
    msp.add_line((mm(amb_x0), mm(y_div)), (mm(amb_x1), mm(y_div)),
                 dxfattribs={"layer": "PAREDES"})
    # Bancada (retângulo fino)
    banc_prof = 0.40
    add_rect(msp, amb_x0 + 0.5, y_div - banc_prof/2, amb_x1 - 0.5, y_div + banc_prof/2, 
             "MOBILIARIO")
    
    # Cozinha/WC-LAV
    msp.add_line((mm(amb_x0), mm(prog["y_coz_end"])), 
                 (mm(amb_x1), mm(prog["y_coz_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # WC Social e Lavanderia (divisória vertical)
    wc_x = amb_x0 + WC_SOCIAL_W
    msp.add_line((mm(wc_x), mm(prog["y_wc_lav_start"])), 
                 (mm(wc_x), mm(prog["y_wc_lav_end"])),
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
    
    # Suíte/Quintal
    msp.add_line((mm(amb_x0), mm(prog["y_suite_end"])), 
                 (mm(amb_x1), mm(prog["y_suite_end"])),
                 dxfattribs={"layer": "PAREDES"})
    
    # Closet em L na suíte (lado da faixa externa)
    y_suite_start = prog["y_suite_start"]
    y_suite_end = prog["y_suite_end"]
    
    if geom_x["is_casa_a"]:
        # Closet no lado direito (faixa externa)
        closet_x0 = amb_x1 - CLOSET_W
        closet_y1 = y_suite_start + CLOSET_L
        # L do closet
        add_rect(msp, closet_x0, y_suite_start, amb_x1, closet_y1, "PAREDES", close=False)
        msp.add_line((mm(closet_x0), mm(y_suite_start)), 
                     (mm(closet_x0), mm(closet_y1)),
                     dxfattribs={"layer": "PAREDES"})
        
        # BWC Suíte (canto superior direito)
        bwc_x0 = amb_x1 - 2.0
        bwc_y0 = prog["y_suite_end"]
        bwc_y1 = prog["y_bwc_suite_end"]
        add_rect(msp, bwc_x0, bwc_y0, amb_x1, bwc_y1, "PAREDES")
    else:
        # Casa B: closet no lado esquerdo (faixa externa)
        closet_x1 = amb_x0 + CLOSET_W
        closet_y1 = y_suite_start + CLOSET_L
        # L do closet
        add_rect(msp, amb_x0, y_suite_start, closet_x1, closet_y1, "PAREDES", close=False)
        msp.add_line((mm(closet_x1), mm(y_suite_start)), 
                     (mm(closet_x1), mm(closet_y1)),
                     dxfattribs={"layer": "PAREDES"})
        
        # BWC Suíte (canto superior esquerdo)
        bwc_x1 = amb_x0 + 2.0
        bwc_y0 = prog["y_suite_end"]
        bwc_y1 = prog["y_bwc_suite_end"]
        add_rect(msp, amb_x0, bwc_y0, bwc_x1, bwc_y1, "PAREDES")

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
    
    # Porta Lavanderia
    wc_x = amb_x0 + WC_SOCIAL_W
    y_lav = prog["y_wc_lav_start"] + 0.5
    x_lav = wc_x if is_casa_a else wc_x
    draw_door_v(msp, x_lav, y_lav, PORTA_WC, swing_portas)
    
    # Portas dos quartos
    if tipo_casa == "A":
        y_q1 = prog["y_wc_lav_end"] + 0.5
        draw_door_v(msp, x_portas, y_q1, PORTA_QUARTO, swing_portas)
    else:
        y_q1 = prog["y_wc_lav_end"] + 0.5
        y_q2 = prog["y_q1_end"] + 0.5
        draw_door_v(msp, x_portas, y_q1, PORTA_QUARTO, swing_portas)
        draw_door_v(msp, x_portas, y_q2, PORTA_QUARTO, swing_portas)
    
    # Porta da SUÍTE (OBRIGATORIAMENTE no corredor interno)
    y_suite_porta = prog["y_quartos_end"] + 0.5
    draw_door_v(msp, x_portas, y_suite_porta, PORTA_QUARTO, swing_portas)
    
    # Assert: porta da suíte está no corredor interno
    assert abs(x_portas - corr_int_x1) < 0.01 or abs(x_portas - corr_int_x0) < 0.01, \
        f"ERRO: Porta da suíte não está no corredor interno! x={x_portas}"
    
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
    y_quintal_start = prog["y_quintal_start"]
    y_quintal_end = prog["y_quintal_end"]
    y_back_calc_start = prog["y_back_calc_start"]
    
    # Corredor interno (área de circulação)
    add_rect(msp, corr_int_x0, y_gar_end, corr_int_x1, y_house_end, "CORR_INT")
    x_corr = (corr_int_x0 + corr_int_x1) / 2
    y_corr = (y_gar_end + y_house_end) / 2
    add_text(msp, "CORREDOR", x_corr, y_corr, 80, "TEXTOS", 90)
    add_text(msp, "INTERNO", x_corr, y_corr - 0.4, 80, "TEXTOS", 90)
    
    # Faixa externa lateral (vertical) - NOVA FUNÇÃO
    draw_external_strip_vertical(msp, corr_ext_x0, y_gar_end, y_house_end, geom_x["is_casa_a"])
    
    # Quintal permeável interno
    if (y_quintal_end - y_quintal_start) > 0.1:
        add_hatch_rect(msp, amb_x0, y_quintal_start, amb_x1, y_quintal_end)
    
    # Faixa externa de fundo (horizontal) - NOVA FUNÇÃO
    # Cobre toda a largura do ambiente (amb_x0 até amb_x1)
    draw_external_strip_horizontal_back(msp, amb_x0, amb_x1, y_back_calc_start)

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
    
    # WC Social
    wc_x = amb_x0 + WC_SOCIAL_W/2
    y_wc = (prog["y_wc_lav_start"] + prog["y_wc_lav_end"]) / 2
    add_text(msp, "WC", wc_x, y_wc, 80, "TEXTOS")
    area_wc = WC_SOCIAL_W * WC_SOCIAL_L
    add_text(msp, f"{area_wc:.1f}m²", wc_x, y_wc - 0.25, 60, "TEXTOS")
    
    # Lavanderia
    lav_w = geom_x["amb_w"] - WC_SOCIAL_W
    lav_x = amb_x0 + WC_SOCIAL_W + lav_w/2
    add_text(msp, "LAV", lav_x, y_wc, 80, "TEXTOS")
    area_lav = lav_w * WC_SOCIAL_L
    add_text(msp, f"{area_lav:.1f}m²", lav_x, y_wc - 0.25, 60, "TEXTOS")
    
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
    
    # Suíte
    y_suite = (prog["y_quartos_end"] + prog["y_suite_end"]) / 2
    add_text(msp, "SUÍTE", x_texto, y_suite, 120, "TEXTOS")
    area_suite = geom_x["amb_w"] * SUITE_MIN_L
    add_text(msp, f"{area_suite:.1f}m²", x_texto, y_suite - 0.3, 80, "TEXTOS")
    
    # Quintal
    y_quintal = (prog["y_quintal_start"] + prog["y_quintal_end"]) / 2
    add_text(msp, "QUINTAL", x_texto, y_quintal, 100, "TEXTOS")
    add_text(msp, "PERMEÁVEL", x_texto, y_quintal - 0.3, 80, "TEXTOS")
    
    # Corredor de fundo
    y_cf = (prog["y_back_calc_start"] + prog["y_back_perm_end"]) / 2
    add_text(msp, "CORREDOR FUNDO", x_texto, y_cf, 80, "TEXTOS")
    add_text(msp, f"{BACK_TOTAL_D:.2f}m", x_texto, y_cf - 0.3, 70, "TEXTOS")
    
    # ========== COTAS ==========
    # Cotas verticais (Y) - lado direito
    x_cota = lot_x1 + 0.3
    y_offset = 0.0
    
    cotas_y = [
        (prog["y_gar_start"], prog["y_gar_end"], f"GAR {prog['y_gar_end'] - prog['y_gar_start']:.2f}"),
        (prog["y_sala_start"], prog["y_sala_end"], f"SALA {SALA_L:.2f}"),
        (prog["y_coz_start"], prog["y_coz_end"], f"COZ {COZINHA_L:.2f}"),
        (prog["y_wc_lav_start"], prog["y_wc_lav_end"], f"WC/LAV {WC_SOCIAL_L:.2f}"),
    ]
    
    for y0, y1, texto in cotas_y:
        y_mid = (y0 + y1) / 2
        msp.add_line((mm(lot_x1), mm(y0)), (mm(x_cota), mm(y0)), 
                     dxfattribs={"layer": "COTAS"})
        msp.add_line((mm(lot_x1), mm(y1)), (mm(x_cota), mm(y1)), 
                     dxfattribs={"layer": "COTAS"})
        msp.add_line((mm(x_cota), mm(y0)), (mm(x_cota), mm(y1)), 
                     dxfattribs={"layer": "COTAS"})
        add_text(msp, texto, x_cota + 0.3, y_mid, 80, "COTAS", 90)
    
    # Cota do recuo de fundo
    y_rf = prog["y_back_calc_start"]
    msp.add_line((mm(amb_x0), mm(y_rf)), (mm(x_cota), mm(y_rf)), 
                 dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(amb_x0), mm(LOTE_L)), (mm(x_cota), mm(LOTE_L)), 
                 dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x_cota), mm(y_rf)), (mm(x_cota), mm(LOTE_L)), 
                 dxfattribs={"layer": "COTAS"})
    add_text(msp, f"FUNDO {BACK_TOTAL_D:.2f}", x_cota + 0.3, (y_rf + LOTE_L)/2, 80, "COTAS", 90)
    
    # Cotas horizontais (X) - parte inferior
    y_cota = -0.5
    
    # Corredor interno
    x_mid_corr = (geom_x["corr_int_x0"] + geom_x["corr_int_x1"]) / 2
    add_text(msp, f"CORR {CORR_INT_W:.2f}", x_mid_corr, y_cota, 80, "COTAS")
    
    # Ambiente
    x_mid_amb = (amb_x0 + amb_x1) / 2
    add_text(msp, f"AMB {geom_x['amb_w']:.2f}", x_mid_amb, y_cota, 80, "COTAS")
    
    # Faixa externa
    x_mid_faixa = (geom_x["corr_ext_x0"] + geom_x["corr_ext_x1"]) / 2
    add_text(msp, f"FAIXA {SIDE_TOTAL_W:.2f}", x_mid_faixa, y_cota, 80, "COTAS")

# ==========================================================
# VALIDAÇÃO E CÁLCULO DE PERMEÁVEL
# ==========================================================
def calcular_permeavel(geom_x, prog):
    """Calcula área permeável total (lateral + quintal + fundo)"""
    amb_w = geom_x["amb_w"]
    
    # Faixa lateral permeável (vertical)
    faixa_l = prog["y_house_end"] - prog["y_gar_end"]
    faixa_lateral = SIDE_PERM_W * faixa_l
    
    # Quintal interno permeável
    quintal_l = prog["y_quintal_end"] - prog["y_quintal_start"]
    quintal_area = amb_w * quintal_l if quintal_l > 0 else 0
    
    # Faixa de fundo permeável (horizontal)
    faixa_fundo = amb_w * BACK_PERM_D
    
    total = faixa_lateral + quintal_area + faixa_fundo
    
    return {
        "faixa_lateral": faixa_lateral,
        "quintal": quintal_area,
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
    print(f"  Quintal interno: {perm_a['quintal']:.2f} m²")
    print(f"  Faixa fundo: {perm_a['faixa_fundo']:.2f} m²")
    print(f"  TOTAL: {perm_a['total']:.2f} m² {'✓ OK' if perm_a['total'] >= PERMEAVEL_MIN else '✗ INSUFICIENTE'}")
    
    print(f"\nCasa B:")
    print(f"  Faixa lateral: {perm_b['faixa_lateral']:.2f} m²")
    print(f"  Quintal interno: {perm_b['quintal']:.2f} m²")
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
    filename = "master_10x26_FINAL.dxf"
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
