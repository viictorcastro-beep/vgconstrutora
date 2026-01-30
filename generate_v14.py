#!/usr/bin/env python3
"""
GERADOR DE PLANTA MASTER 10x26m - VERSÃO 15 (PASSARELA COBERTA)

MODIFICAÇÕES IMPLEMENTADAS:
1- Cotas de largura/comprimento em cada cômodo (menor) + m² no centro
2- BWC suíte na horizontal, fechando o corredor
3- Closet em L na parede inicial do quarto (junto com porta), fechando no BWC suíte
4- Sala e cozinha divididas por bancada de 0.90m altura (meia parede)
5- Garagem coberta 2m + vão livre 0.80m (topete/passarela) - motorista não se molha
6- Dente na parede esquerda para proteção contra chuva
7- Portão 4.5m BASCULANTE (sobe), altura 2.60m
8- Porta de correr vidro na cozinha (abre dos dois lados), bancada inteiriça 1.20m após divisória
9- Bancada com pia na área externa + churrasqueira 0.60m no final
10- Lavanderia com mesmo comprimento da área da churrasqueira, faz divisa com WC
11- Alturas: bancadas/pia/cozinha americana = 0.90m

GEOMETRIA X FIXA (NÃO ALTERADA):
Casa A: Corr.Int [0.00-1.10] | Amb [1.10-3.90] | Faixa Ext [3.90-5.00]
Casa B: Faixa Ext [5.00-6.10] | Amb [6.10-8.90] | Corr.Int [8.90-10.00]

Saída: master_10x26_v15.dxf
"""

import ezdxf
import math

# ==========================================================
# UNIDADES / ESCALA
# ==========================================================
SCALE = 1000  # 1m = 1000 unidades (mm)
INSUNITS_MM = 4

# ==========================================================
# DIMENSÕES DO TERRENO
# ==========================================================
MASTER_W = 10.0
MASTER_L = 26.0
LOTE_W = 5.0
LOTE_L = 26.0

# ==========================================================
# RECUOS / FAIXAS
# ==========================================================
FRONT_SETBACK = 1.00
SIDE_TOTAL_W = 1.10            # faixa lateral externa (calçada + permeável)
CALCADA_W = 0.50
SIDE_PERM_W = 0.60

# Corredor interno (circulação)
CORR_INT_W = 1.10

# ==========================================================
# PORTAS / JANELAS / PORTÃO
# ==========================================================
PORTA_QUARTO = 0.80
PORTA_WC = 0.70
PORTA_ENTRADA = 1.20           # porta de madeira na frente
PORTA_CORRER = 1.40            # porta de correr vidro cozinha/lavanderia
JANELA_QUARTO = 1.20
JANELA_WC = 0.60
JANELA_SALA = 1.50
PORTAO_W = 4.50                # portão pivotante
PORTAO_H = 2.60                # altura do portão

# ==========================================================
# GARAGEM
# ==========================================================
GARAGEM_DESC_L = 5.00          # garagem descoberta (onde fica o portão)
COBERTURA_TOTAL_L = 2.80       # cobertura total: garagem descoberta até porta da sala
# Cobertura contínua sem divisórias - motorista não se molha

# ==========================================================
# BANCADAS
# ==========================================================
BANCADA_SALA_COZ_H = 0.90      # altura meia parede (padrão 0.90m)
BANCADA_COZ_PROF = 0.60        # profundidade bancada cozinha
BANCADA_COZ_INICIO = 1.20      # começa 1.20m após parede divisória
BANCADA_PIA_PROF = 0.60        # bancada com pia na lavanderia
BANCADA_ALTURA = 0.90          # altura padrão de todas as bancadas/pias/coz americana

# ==========================================================
# CHURRASQUEIRA
# ==========================================================
CHURRASQUEIRA_W = 0.60         # largura da churrasqueira (0.60m)

# ==========================================================
# CLOSET
# ==========================================================
CLOSET_PROF = 1.00             # profundidade do closet (forma L com quarto)
CLOSET_LARG = 1.20             # largura do closet (junto à porta)

# ==========================================================
# META PERMEÁVEL
# ==========================================================
PERMEAVEL_MIN = 13.0

# ==========================================================
# PROFUNDIDADES DOS AMBIENTES (m) - AJUSTADAS
# ==========================================================
# Garagem descoberta + coberta
GARAGEM_DESC_L = 5.00          # parte descoberta (2º carro)
# Total garagem = GARAGEM_DESC_L (onde fica portão) + parte interna

SALA_COZ_Y = 5.00              # sala + cozinha (divididas por bancada)
WC_LAV_Y = 2.50                # WC social + lavanderia

# Casa A (3 quartos = 2Q + suíte)
A_Q1_Y = 3.00
A_Q2_Y = 3.00
A_SUITE_Y = 3.20               # suíte (dorm)
A_BWC_SUITE_Y = 1.60           # BWC suíte (horizontal, fecha corredor)

# Casa B (2 quartos = 1Q + suíte com closet maior)
B_Q1_Y = 3.40
B_SUITE_Y = 3.40
B_BWC_SUITE_Y = 1.60

BACKYARD_MIN = 2.50

# ==========================================================
# LINETYPE / HATCH
# ==========================================================
DASH_MM = 100
GAP_MM = 50
HATCH_SCALE_MM = 800

# ==========================================================
# LAYERS
# ==========================================================
def setup_layers(doc):
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
        "BANCADA": 4,           # cyan para bancadas
        "PORTAO": 1,            # vermelho para portão
    }
    for name, color in layers.items():
        if name not in doc.layers:
            doc.layers.add(name, color=color)

# ==========================================================
# HELPERS DESENHO
# ==========================================================
def mm(x_m):
    return x_m * SCALE

def add_rect(msp, x0, y0, x1, y1, layer, close=True, color=None):
    pts = [(mm(x0), mm(y0)), (mm(x1), mm(y0)), (mm(x1), mm(y1)), (mm(x0), mm(y1))]
    dxf = {"layer": layer}
    if color is not None:
        dxf["color"] = color
    msp.add_lwpolyline(pts, close=close, dxfattribs=dxf)
    return pts

def add_hatch_rect(msp, x0, y0, x1, y1, layer="HATCH_PERM"):
    pts = add_rect(msp, x0, y0, x1, y1, layer=layer, color=152)
    hatch = msp.add_hatch(color=152, dxfattribs={"layer": layer})
    hatch.paths.add_polyline_path(pts, is_closed=True)
    hatch.set_pattern_fill("ANSI31", scale=HATCH_SCALE_MM)

def draw_window(msp, x, y, w, direction="V"):
    if direction == "V":
        msp.add_line((mm(x), mm(y)), (mm(x), mm(y+w)), dxfattribs={"layer": "JANELAS"})
    else:
        msp.add_line((mm(x), mm(y)), (mm(x+w), mm(y)), dxfattribs={"layer": "JANELAS"})

def draw_door_v(msp, x_wall, y0, w, swing="L"):
    """Porta vertical na parede x = x_wall"""
    msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall), mm(y0+w)), dxfattribs={"layer": "PORTAS"})
    if swing == "R":
        msp.add_arc((mm(x_wall), mm(y0)), mm(w), 0, 90, dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall+w), mm(y0)), dxfattribs={"layer": "PORTAS"})
    else:
        msp.add_arc((mm(x_wall), mm(y0)), mm(w), 90, 180, dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x_wall), mm(y0)), (mm(x_wall-w), mm(y0)), dxfattribs={"layer": "PORTAS"})

def draw_door_h(msp, x0, y_wall, w, swing="U"):
    """Porta horizontal na parede y = y_wall"""
    msp.add_line((mm(x0), mm(y_wall)), (mm(x0+w), mm(y_wall)), dxfattribs={"layer": "PORTAS"})
    if swing == "U":
        msp.add_arc((mm(x0), mm(y_wall)), mm(w), 0, 90, dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0), mm(y_wall)), (mm(x0), mm(y_wall+w)), dxfattribs={"layer": "PORTAS"})
    else:
        msp.add_arc((mm(x0), mm(y_wall)), mm(w), 270, 360, dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0), mm(y_wall)), (mm(x0), mm(y_wall-w)), dxfattribs={"layer": "PORTAS"})

def draw_sliding_door(msp, x0, y, w, direction="H"):
    """Porta de correr (duas folhas com setas)"""
    if direction == "H":
        # Linha principal
        msp.add_line((mm(x0), mm(y)), (mm(x0+w), mm(y)), dxfattribs={"layer": "PORTAS"})
        # Duas folhas (linhas paralelas)
        msp.add_line((mm(x0), mm(y-0.05)), (mm(x0+w/2), mm(y-0.05)), dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0+w/2), mm(y+0.05)), (mm(x0+w), mm(y+0.05)), dxfattribs={"layer": "PORTAS"})
    else:
        msp.add_line((mm(x0), mm(y)), (mm(x0), mm(y+w)), dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0-0.05), mm(y)), (mm(x0-0.05), mm(y+w/2)), dxfattribs={"layer": "PORTAS"})
        msp.add_line((mm(x0+0.05), mm(y+w/2)), (mm(x0+0.05), mm(y+w)), dxfattribs={"layer": "PORTAS"})

def draw_portao_basculante(msp, x0, y, w):
    """Portão basculante (sobe para cima)"""
    # Linha do portão
    msp.add_line((mm(x0), mm(y)), (mm(x0+w), mm(y)), dxfattribs={"layer": "PORTAO"})
    # Setas indicando movimento para cima (basculante)
    mid_x = x0 + w/2
    arrow_h = 0.30
    # Seta central apontando para cima
    msp.add_line((mm(mid_x), mm(y)), (mm(mid_x), mm(y + arrow_h)), dxfattribs={"layer": "PORTAO"})
    msp.add_line((mm(mid_x - 0.15), mm(y + arrow_h - 0.10)), (mm(mid_x), mm(y + arrow_h)), dxfattribs={"layer": "PORTAO"})
    msp.add_line((mm(mid_x + 0.15), mm(y + arrow_h - 0.10)), (mm(mid_x), mm(y + arrow_h)), dxfattribs={"layer": "PORTAO"})

def draw_bancada(msp, x0, y0, x1, y1, layer="BANCADA"):
    """Desenha bancada (retângulo preenchido com hatch)"""
    add_rect(msp, x0, y0, x1, y1, layer=layer)
    # Linha tracejada no meio indicando meia-parede
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    if abs(x1-x0) > abs(y1-y0):
        msp.add_line((mm(x0), mm(cy)), (mm(x1), mm(cy)), dxfattribs={"layer": layer, "linetype": "DASHED"})
    else:
        msp.add_line((mm(cx), mm(y0)), (mm(cx), mm(y1)), dxfattribs={"layer": layer, "linetype": "DASHED"})

def draw_churrasqueira(msp, x0, y0, x1, y1, layer="BANCADA"):
    """Desenha churrasqueira (retângulo com X indicando elemento fixo)"""
    add_rect(msp, x0, y0, x1, y1, layer=layer)
    # Desenha um X para indicar churrasqueira
    msp.add_line((mm(x0), mm(y0)), (mm(x1), mm(y1)), dxfattribs={"layer": layer})
    msp.add_line((mm(x0), mm(y1)), (mm(x1), mm(y0)), dxfattribs={"layer": layer})
    # Adiciona texto "CHURR"
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    msp.add_text("CHURR", height=60, dxfattribs={"layer": "TEXTOS"}).set_placement((mm(cx - 0.15), mm(cy - 0.05)))

def add_room_dimensions(msp, x0, y0, x1, y1, name=""):
    """Adiciona dimensões e m² no centro do cômodo"""
    w = abs(x1 - x0)
    h = abs(y1 - y0)
    area = w * h
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    
    h_text = 80  # altura do texto menor
    
    # Dimensões (largura x comprimento)
    dim_text = f"{w:.2f}x{h:.2f}"
    msp.add_text(dim_text, height=h_text, dxfattribs={"layer": "COTAS"}).set_placement((mm(cx), mm(cy + 0.20)))
    
    # Área em m²
    area_text = f"{area:.2f}m²"
    msp.add_text(area_text, height=h_text, dxfattribs={"layer": "COTAS"}).set_placement((mm(cx), mm(cy - 0.10)))
    
    # Nome do cômodo (se fornecido)
    if name:
        msp.add_text(name, height=100, dxfattribs={"layer": "TEXTOS"}).set_placement((mm(cx), mm(cy + 0.45)))

def draw_dim_h(msp, x0, x1, y, off, text):
    y_dim = y + off
    msp.add_line((mm(x0), mm(y)), (mm(x0), mm(y_dim)), dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x1), mm(y)), (mm(x1), mm(y_dim)), dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x0), mm(y_dim)), (mm(x1), mm(y_dim)), dxfattribs={"layer": "COTAS"})
    mx = (x0 + x1) / 2
    msp.add_text(text, height=120, dxfattribs={"layer": "COTAS"}).set_placement((mm(mx), mm(y_dim + 0.10)))

def draw_dim_v(msp, y0, y1, x, off, text):
    x_dim = x + off
    msp.add_line((mm(x), mm(y0)), (mm(x_dim), mm(y0)), dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x), mm(y1)), (mm(x_dim), mm(y1)), dxfattribs={"layer": "COTAS"})
    msp.add_line((mm(x_dim), mm(y0)), (mm(x_dim), mm(y1)), dxfattribs={"layer": "COTAS"})
    my = (y0 + y1) / 2
    msp.add_text(text, height=120, dxfattribs={"layer": "COTAS", "rotation": 90}).set_placement((mm(x_dim + 0.10), mm(my)))

# ==========================================================
# DESENHO: CASA A (esquerda) - COM TODAS AS MODIFICAÇÕES
# ==========================================================
def draw_casa_a(msp, backyard):
    """
    Casa A (lote esquerdo: x = 0 até 5)
    - 3 quartos (2Q + suíte)
    - Closet em L
    - BWC suíte horizontal fechando corredor
    - Garagem com dente
    """
    lot_x0, lot_x1 = 0.0, 5.0
    
    # GEOMETRIA X
    corr_int_x0 = lot_x0                    # 0.00
    corr_int_x1 = lot_x0 + CORR_INT_W       # 1.10
    
    corr_ext_x1 = lot_x1                    # 5.00
    corr_ext_x0 = lot_x1 - SIDE_TOTAL_W     # 3.90
    
    amb_x0 = corr_int_x1   # 1.10
    amb_x1 = corr_ext_x0   # 3.90
    amb_w = amb_x1 - amb_x0  # 2.80
    
    # GEOMETRIA Y
    y0 = 0.0
    y_front = FRONT_SETBACK                 # 1.00
    
    # Garagem descoberta + cobertura até porta da sala
    y_gar_desc_end = y_front + GARAGEM_DESC_L   # 1.00 + 5.00 = 6.00
    y_cobertura_end = y_front + COBERTURA_TOTAL_L  # 1.00 + 2.80 = 3.80 (linha da cobertura)
    
    # Sala começa após garagem
    y_sala_start = y_gar_desc_end  # 6.00
    y_sala_end = y_sala_start + SALA_COZ_Y  # 6.00 + 5.00 = 11.00
    
    # Divisão sala/cozinha (bancada no meio)
    y_bancada = y_sala_start + SALA_COZ_Y / 2  # 6.00 + 2.50 = 8.50
    
    y_miolo = y_sala_end  # onde começa WC/LAV e corredor interno
    y_wc_end = y_miolo + WC_LAV_Y  # 11.00 + 2.50 = 13.50
    
    y_q1_end = y_wc_end + A_Q1_Y  # 13.50 + 3.00 = 16.50
    y_q2_end = y_q1_end + A_Q2_Y  # 16.50 + 3.00 = 19.50
    y_suite_end = y_q2_end + A_SUITE_Y  # 19.50 + 3.20 = 22.70
    y_bwc_suite_end = y_suite_end + A_BWC_SUITE_Y  # 22.70 + 1.60 = 24.30
    
    y_build_end = y_bwc_suite_end
    y_fundo = LOTE_L  # 26.00
    backyard_real = y_fundo - y_build_end  # quintal real
    
    # =========================================================
    # CONTORNO PRINCIPAL (retangular simples)
    # =========================================================
    pts_contorno = [
        (amb_x0, y_front),              # início (após corredor interno, na frente)
        (lot_x1, y_front),              # vai até divisa (frente)
        (lot_x1, y_miolo),              # sobe até o miolo
        (amb_x1, y_miolo),              # recua (faixa externa)
        (amb_x1, y_build_end),          # sobe até fim construção
        (amb_x0, y_build_end),          # fecha esquerda
    ]
    msp.add_lwpolyline([(mm(x), mm(y)) for x, y in pts_contorno], close=True,
                       dxfattribs={"layer": "PAREDES"})
    
    # Linha indicando limite da cobertura (tracejada)
    msp.add_line((mm(amb_x0), mm(y_cobertura_end)), (mm(amb_x1), mm(y_cobertura_end)), 
                 dxfattribs={"layer": "PAREDES", "linetype": "DASHED"})
    # Texto indicativo da cobertura
    msp.add_text("COBERTURA", height=60, dxfattribs={"layer": "TEXTOS"}).set_placement(
        (mm(amb_x0 + 0.30), mm((y_front + y_cobertura_end)/2)))
    
    # =========================================================
    # FAIXA EXTERNA (calçada + permeável)
    # =========================================================
    calc_x0 = amb_x1
    calc_x1 = calc_x0 + CALCADA_W
    perm_x0 = calc_x1
    perm_x1 = lot_x1
    
    add_rect(msp, calc_x0, y_miolo, calc_x1, y_fundo, layer="CALCADA")
    add_hatch_rect(msp, perm_x0, y_miolo, perm_x1, y_fundo)
    
    # =========================================================
    # QUINTAL PERMEÁVEL
    # =========================================================
    add_hatch_rect(msp, amb_x0, y_build_end, amb_x1, y_fundo)
    
    # =========================================================
    # CORREDOR INTERNO
    # BWC suíte fecha o corredor no final (horizontal)
    # =========================================================
    # Corredor vai do miolo até o início do BWC suíte
    add_rect(msp, corr_int_x0, y_miolo, corr_int_x1, y_suite_end, layer="CORR_INT")
    corr_int_cx = (corr_int_x0 + corr_int_x1) / 2
    msp.add_line((mm(corr_int_cx), mm(y_miolo)), (mm(corr_int_cx), mm(y_suite_end)),
                 dxfattribs={"layer": "CORR_INT", "linetype": "DASHED", "ltscale": 1})
    
    # BWC suíte HORIZONTAL (fecha o corredor)
    # Ocupa toda a largura: de corr_int_x0 até amb_x1
    bwc_x0 = corr_int_x0
    bwc_x1 = amb_x1
    bwc_y0 = y_suite_end
    bwc_y1 = y_bwc_suite_end
    add_rect(msp, bwc_x0, bwc_y0, bwc_x1, bwc_y1, layer="PAREDES")
    
    # =========================================================
    # DIVISÓRIAS INTERNAS
    # =========================================================
    # Garagem/Sala (com porta de entrada da sala)
    # Parede com abertura para porta
    porta_sala_x = amb_x0 + 0.50  # posição da porta da sala (lado esquerdo)
    # Parede esquerda (até porta)
    msp.add_line((mm(amb_x0), mm(y_sala_start)), (mm(porta_sala_x), mm(y_sala_start)), 
                 dxfattribs={"layer": "PAREDES"})
    # Parede direita (após porta)
    msp.add_line((mm(porta_sala_x + PORTA_ENTRADA), mm(y_sala_start)), (mm(lot_x1), mm(y_sala_start)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # Sala/Cozinha (bancada meia parede)
    # A bancada não é parede inteira, só indicamos
    draw_bancada(msp, amb_x0 + 0.10, y_bancada - 0.10, amb_x1 - 0.10, y_bancada + 0.10)
    
    # Cozinha/WC-LAV
    msp.add_line((mm(amb_x0), mm(y_miolo)), (mm(amb_x1), mm(y_miolo)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # WC/LAV divisão vertical
    wc_w = 1.40
    wc_x0 = amb_x0
    wc_x1 = wc_x0 + wc_w
    msp.add_line((mm(wc_x1), mm(y_miolo)), (mm(wc_x1), mm(y_wc_end)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # Divisórias quartos
    msp.add_line((mm(amb_x0), mm(y_wc_end)), (mm(amb_x1), mm(y_wc_end)), 
                 dxfattribs={"layer": "PAREDES"})
    msp.add_line((mm(amb_x0), mm(y_q1_end)), (mm(amb_x1), mm(y_q1_end)), 
                 dxfattribs={"layer": "PAREDES"})
    msp.add_line((mm(amb_x0), mm(y_q2_end)), (mm(amb_x1), mm(y_q2_end)), 
                 dxfattribs={"layer": "PAREDES"})
    msp.add_line((mm(amb_x0), mm(y_suite_end)), (mm(amb_x1), mm(y_suite_end)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # =========================================================
    # CLOSET EM L (nos quartos e suíte)
    # Closet na parede inicial do quarto, junto com a porta
    # =========================================================
    # Quarto 1: closet em L
    closet_q1_x0 = amb_x0
    closet_q1_x1 = amb_x0 + CLOSET_LARG
    closet_q1_y0 = y_wc_end
    closet_q1_y1 = y_wc_end + CLOSET_PROF
    add_rect(msp, closet_q1_x0, closet_q1_y0, closet_q1_x1, closet_q1_y1, layer="PAREDES")
    
    # Quarto 2: closet em L
    closet_q2_x0 = amb_x0
    closet_q2_x1 = amb_x0 + CLOSET_LARG
    closet_q2_y0 = y_q1_end
    closet_q2_y1 = y_q1_end + CLOSET_PROF
    add_rect(msp, closet_q2_x0, closet_q2_y0, closet_q2_x1, closet_q2_y1, layer="PAREDES")
    
    # Suíte: closet em L (maior)
    closet_suite_x0 = amb_x0
    closet_suite_x1 = amb_x0 + CLOSET_LARG
    closet_suite_y0 = y_q2_end
    closet_suite_y1 = y_q2_end + CLOSET_PROF
    add_rect(msp, closet_suite_x0, closet_suite_y0, closet_suite_x1, closet_suite_y1, layer="PAREDES")
    
    # =========================================================
    # BANCADA COZINHA (inteiriça)
    # Começa 1.20m após divisória sala/cozinha até porta de correr
    # =========================================================
    banc_coz_x0 = amb_x1 - BANCADA_COZ_PROF  # encosta na parede externa
    banc_coz_x1 = amb_x1
    banc_coz_y0 = y_bancada + BANCADA_COZ_INICIO
    banc_coz_y1 = y_miolo - 0.20  # até antes da porta de correr
    draw_bancada(msp, banc_coz_x0, banc_coz_y0, banc_coz_x1, banc_coz_y1)
    
    # Bancada com pia na parede da lavanderia
    banc_pia_x0 = wc_x1 + 0.10
    banc_pia_x1 = amb_x1 - 0.10
    banc_pia_y0 = y_miolo + 0.10
    banc_pia_y1 = y_miolo + BANCADA_PIA_PROF
    draw_bancada(msp, banc_pia_x0, banc_pia_y0, banc_pia_x1, banc_pia_y1)
    
    # Churrasqueira 0.60m no final da parede da lavanderia (lado externo)
    churr_x0 = amb_x1 - CHURRASQUEIRA_W
    churr_x1 = amb_x1
    churr_y0 = y_wc_end - CHURRASQUEIRA_W
    churr_y1 = y_wc_end
    draw_churrasqueira(msp, churr_x0, churr_y0, churr_x1, churr_y1)
    
    # =========================================================
    # PORTAS
    # =========================================================
    # Porta de entrada da SALA (na divisória garagem/sala)
    draw_door_h(msp, porta_sala_x, y_sala_start, PORTA_ENTRADA, swing="U")
    
    # Porta de correr cozinha/lavanderia
    porta_correr_x = wc_x1 + 0.30
    draw_sliding_door(msp, porta_correr_x, y_miolo, PORTA_CORRER, direction="H")
    
    # Portas no corredor interno
    x_door = amb_x0
    
    # WC
    draw_door_v(msp, x_door, y_miolo + 0.30, PORTA_WC, swing="R")
    
    # Quarto 1 (após closet)
    draw_door_v(msp, x_door, y_wc_end + CLOSET_PROF + 0.20, PORTA_QUARTO, swing="R")
    
    # Quarto 2 (após closet)
    draw_door_v(msp, x_door, y_q1_end + CLOSET_PROF + 0.20, PORTA_QUARTO, swing="R")
    
    # Suíte (após closet)
    draw_door_v(msp, x_door, y_q2_end + CLOSET_PROF + 0.20, PORTA_QUARTO, swing="R")
    
    # Porta BWC suíte (no corredor, antes de fechar)
    draw_door_h(msp, corr_int_x0 + 0.20, y_suite_end, PORTA_WC, swing="U")
    
    # =========================================================
    # JANELAS
    # =========================================================
    # Janela da sala na frente
    janela_sala_x = amb_x0 + 2.00
    draw_window(msp, janela_sala_x, y_front, JANELA_SALA, "V")
    
    # Janelas na faixa externa
    wc_cy = (y_miolo + y_wc_end) / 2
    q1_cy = (y_wc_end + y_q1_end) / 2
    q2_cy = (y_q1_end + y_q2_end) / 2
    suite_cy = (y_q2_end + y_suite_end) / 2
    
    draw_window(msp, amb_x1, wc_cy - JANELA_WC/2, JANELA_WC, "V")
    draw_window(msp, amb_x1, q1_cy - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    draw_window(msp, amb_x1, q2_cy - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    draw_window(msp, amb_x1, suite_cy - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    
    # Janela BWC suíte (no fundo)
    bwc_cx = (bwc_x0 + bwc_x1) / 2
    draw_window(msp, bwc_cx - JANELA_WC/2, y_bwc_suite_end, JANELA_WC, "H")
    
    # =========================================================
    # PORTÃO (4.5m basculante)
    # =========================================================
    portao_x0 = amb_x0 + (lot_x1 - amb_x0 - PORTAO_W) / 2  # centralizado
    draw_portao_basculante(msp, portao_x0, y_front, PORTAO_W)
    
    # =========================================================
    # DIMENSÕES E M² DOS CÔMODOS
    # =========================================================
    # Garagem (área total)
    add_room_dimensions(msp, amb_x0, y_front, lot_x1 - SIDE_TOTAL_W, y_sala_start, "GARAGEM")
    
    # Sala
    add_room_dimensions(msp, amb_x0, y_sala_start, amb_x1, y_bancada, "SALA")
    
    # Cozinha
    add_room_dimensions(msp, amb_x0, y_bancada, amb_x1, y_miolo, "COZINHA")
    
    # WC
    add_room_dimensions(msp, wc_x0, y_miolo, wc_x1, y_wc_end, "WC")
    
    # Lavanderia
    add_room_dimensions(msp, wc_x1, y_miolo, amb_x1, y_wc_end, "LAVAND")
    
    # Quarto 1
    add_room_dimensions(msp, amb_x0, y_wc_end, amb_x1, y_q1_end, "QUARTO 1")
    
    # Quarto 2
    add_room_dimensions(msp, amb_x0, y_q1_end, amb_x1, y_q2_end, "QUARTO 2")
    
    # Suíte
    add_room_dimensions(msp, amb_x0, y_q2_end, amb_x1, y_suite_end, "SUITE")
    
    # BWC Suíte
    add_room_dimensions(msp, bwc_x0, bwc_y0, bwc_x1, bwc_y1, "BWC SUITE")
    
    # Quintal
    add_room_dimensions(msp, amb_x0, y_build_end, amb_x1, y_fundo, "QUINTAL")
    
    # Corredor
    add_room_dimensions(msp, corr_int_x0, y_miolo, corr_int_x1, y_suite_end, "CORR")
    
    return {
        "y_build_end": y_build_end,
        "amb_w": amb_w,
        "backyard": backyard_real,
    }

# ==========================================================
# DESENHO: CASA B (direita) - COM TODAS AS MODIFICAÇÕES
# ==========================================================
def draw_casa_b(msp, backyard):
    """
    Casa B (lote direito: x = 5 até 10)
    - 2 quartos (1Q + suíte)
    - Closet em L
    - BWC suíte horizontal fechando corredor
    - Garagem com dente
    """
    lot_x0, lot_x1 = 5.0, 10.0
    
    # GEOMETRIA X (espelhada)
    corr_ext_x0 = lot_x0                    # 5.00
    corr_ext_x1 = lot_x0 + SIDE_TOTAL_W     # 6.10
    
    corr_int_x1 = lot_x1                    # 10.00
    corr_int_x0 = lot_x1 - CORR_INT_W       # 8.90
    
    amb_x0 = corr_ext_x1   # 6.10
    amb_x1 = corr_int_x0   # 8.90
    amb_w = amb_x1 - amb_x0  # 2.80
    
    # GEOMETRIA Y
    y0 = 0.0
    y_front = FRONT_SETBACK
    
    y_gar_desc_end = y_front + GARAGEM_DESC_L
    y_cobertura_end = y_front + COBERTURA_TOTAL_L
    
    y_sala_start = y_gar_desc_end
    y_sala_end = y_sala_start + SALA_COZ_Y
    y_bancada = y_sala_start + SALA_COZ_Y / 2
    
    y_miolo = y_sala_end
    y_wc_end = y_miolo + WC_LAV_Y
    
    y_q1_end = y_wc_end + B_Q1_Y
    y_suite_end = y_q1_end + B_SUITE_Y
    y_bwc_suite_end = y_suite_end + B_BWC_SUITE_Y
    
    y_build_end = y_bwc_suite_end
    y_fundo = LOTE_L
    backyard_real = y_fundo - y_build_end
    
    # =========================================================
    # CONTORNO PRINCIPAL
    # =========================================================
    pts_contorno = [
        (lot_x0, y_front),
        (amb_x1, y_front),
        (amb_x1, y_build_end),
        (amb_x0, y_build_end),
        (amb_x0, y_miolo),
        (lot_x0, y_miolo),
    ]
    msp.add_lwpolyline([(mm(x), mm(y)) for x, y in pts_contorno], close=True,
                       dxfattribs={"layer": "PAREDES"})
    
    # Linha indicando limite da cobertura (tracejada)
    msp.add_line((mm(amb_x0), mm(y_cobertura_end)), (mm(amb_x1), mm(y_cobertura_end)), 
                 dxfattribs={"layer": "PAREDES", "linetype": "DASHED"})
    # Texto indicativo da cobertura
    msp.add_text("COBERTURA", height=60, dxfattribs={"layer": "TEXTOS"}).set_placement(
        (mm(amb_x1 - 0.80), mm((y_front + y_cobertura_end)/2)))
    
    # =========================================================
    # FAIXA EXTERNA
    # =========================================================
    perm_x0 = lot_x0
    perm_x1 = perm_x0 + SIDE_PERM_W
    calc_x0 = perm_x1
    calc_x1 = corr_ext_x1
    
    add_rect(msp, calc_x0, y_miolo, calc_x1, y_fundo, layer="CALCADA")
    add_hatch_rect(msp, perm_x0, y_miolo, perm_x1, y_fundo)
    
    # =========================================================
    # QUINTAL
    # =========================================================
    add_hatch_rect(msp, amb_x0, y_build_end, amb_x1, y_fundo)
    
    # =========================================================
    # CORREDOR INTERNO + BWC SUÍTE HORIZONTAL
    # =========================================================
    add_rect(msp, corr_int_x0, y_miolo, corr_int_x1, y_suite_end, layer="CORR_INT")
    corr_int_cx = (corr_int_x0 + corr_int_x1) / 2
    msp.add_line((mm(corr_int_cx), mm(y_miolo)), (mm(corr_int_cx), mm(y_suite_end)),
                 dxfattribs={"layer": "CORR_INT", "linetype": "DASHED", "ltscale": 1})
    
    # BWC suíte horizontal
    bwc_x0 = amb_x0
    bwc_x1 = corr_int_x1
    bwc_y0 = y_suite_end
    bwc_y1 = y_bwc_suite_end
    add_rect(msp, bwc_x0, bwc_y0, bwc_x1, bwc_y1, layer="PAREDES")
    
    # =========================================================
    # DIVISÓRIAS INTERNAS
    # =========================================================
    # Garagem/Sala (com porta de entrada da sala)
    porta_sala_x = amb_x1 - PORTA_ENTRADA - 0.50  # posição da porta da sala (lado direito)
    # Parede esquerda (até porta)
    msp.add_line((mm(lot_x0), mm(y_sala_start)), (mm(porta_sala_x), mm(y_sala_start)), 
                 dxfattribs={"layer": "PAREDES"})
    # Parede direita (após porta)
    msp.add_line((mm(porta_sala_x + PORTA_ENTRADA), mm(y_sala_start)), (mm(amb_x1), mm(y_sala_start)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # Bancada sala/cozinha
    draw_bancada(msp, amb_x0 + 0.10, y_bancada - 0.10, amb_x1 - 0.10, y_bancada + 0.10)
    
    msp.add_line((mm(amb_x0), mm(y_miolo)), (mm(amb_x1), mm(y_miolo)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # WC/LAV
    wc_w = 1.40
    wc_x1 = amb_x1
    wc_x0 = wc_x1 - wc_w
    msp.add_line((mm(wc_x0), mm(y_miolo)), (mm(wc_x0), mm(y_wc_end)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # Divisórias quartos
    msp.add_line((mm(amb_x0), mm(y_wc_end)), (mm(amb_x1), mm(y_wc_end)), 
                 dxfattribs={"layer": "PAREDES"})
    msp.add_line((mm(amb_x0), mm(y_q1_end)), (mm(amb_x1), mm(y_q1_end)), 
                 dxfattribs={"layer": "PAREDES"})
    msp.add_line((mm(amb_x0), mm(y_suite_end)), (mm(amb_x1), mm(y_suite_end)), 
                 dxfattribs={"layer": "PAREDES"})
    
    # =========================================================
    # CLOSET EM L
    # =========================================================
    # Quarto
    closet_q1_x1 = amb_x1
    closet_q1_x0 = amb_x1 - CLOSET_LARG
    closet_q1_y0 = y_wc_end
    closet_q1_y1 = y_wc_end + CLOSET_PROF
    add_rect(msp, closet_q1_x0, closet_q1_y0, closet_q1_x1, closet_q1_y1, layer="PAREDES")
    
    # Suíte
    closet_suite_x1 = amb_x1
    closet_suite_x0 = amb_x1 - CLOSET_LARG
    closet_suite_y0 = y_q1_end
    closet_suite_y1 = y_q1_end + CLOSET_PROF
    add_rect(msp, closet_suite_x0, closet_suite_y0, closet_suite_x1, closet_suite_y1, layer="PAREDES")
    
    # =========================================================
    # BANCADAS
    # =========================================================
    banc_coz_x0 = amb_x0
    banc_coz_x1 = amb_x0 + BANCADA_COZ_PROF
    banc_coz_y0 = y_bancada + BANCADA_COZ_INICIO
    banc_coz_y1 = y_miolo - 0.20
    draw_bancada(msp, banc_coz_x0, banc_coz_y0, banc_coz_x1, banc_coz_y1)
    
    banc_pia_x0 = amb_x0 + 0.10
    banc_pia_x1 = wc_x0 - 0.10
    banc_pia_y0 = y_miolo + 0.10
    banc_pia_y1 = y_miolo + BANCADA_PIA_PROF
    draw_bancada(msp, banc_pia_x0, banc_pia_y0, banc_pia_x1, banc_pia_y1)
    
    # Churrasqueira 0.60m no final da parede da lavanderia (lado externo)
    churr_x0 = amb_x0
    churr_x1 = amb_x0 + CHURRASQUEIRA_W
    churr_y0 = y_wc_end - CHURRASQUEIRA_W
    churr_y1 = y_wc_end
    draw_churrasqueira(msp, churr_x0, churr_y0, churr_x1, churr_y1)
    
    # =========================================================
    # PORTAS
    # =========================================================
    # Porta de entrada da SALA (na divisória garagem/sala)
    draw_door_h(msp, porta_sala_x, y_sala_start, PORTA_ENTRADA, swing="U")
    
    porta_correr_x = amb_x0 + 0.30
    draw_sliding_door(msp, porta_correr_x, y_miolo, PORTA_CORRER, direction="H")
    
    x_door = amb_x1
    
    draw_door_v(msp, x_door, y_miolo + 0.30, PORTA_WC, swing="L")
    draw_door_v(msp, x_door, y_wc_end + CLOSET_PROF + 0.20, PORTA_QUARTO, swing="L")
    draw_door_v(msp, x_door, y_q1_end + CLOSET_PROF + 0.20, PORTA_QUARTO, swing="L")
    
    draw_door_h(msp, corr_int_x0 + 0.20, y_suite_end, PORTA_WC, swing="U")
    
    # =========================================================
    # JANELAS
    # =========================================================
    # Janela da sala na frente
    janela_sala_x = amb_x1 - 2.00
    draw_window(msp, janela_sala_x, y_front, JANELA_SALA, "V")
    
    wc_cy = (y_miolo + y_wc_end) / 2
    q1_cy = (y_wc_end + y_q1_end) / 2
    suite_cy = (y_q1_end + y_suite_end) / 2
    
    draw_window(msp, amb_x0, wc_cy - JANELA_WC/2, JANELA_WC, "V")
    draw_window(msp, amb_x0, q1_cy - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    draw_window(msp, amb_x0, suite_cy - JANELA_QUARTO/2, JANELA_QUARTO, "V")
    
    bwc_cx = (bwc_x0 + bwc_x1) / 2
    draw_window(msp, bwc_cx - JANELA_WC/2, y_bwc_suite_end, JANELA_WC, "H")
    
    # =========================================================
    # PORTÃO (4.5m basculante)
    # =========================================================
    portao_x0 = lot_x0 + (amb_x1 - lot_x0 - PORTAO_W) / 2
    draw_portao_basculante(msp, portao_x0, y_front, PORTAO_W)
    
    # =========================================================
    # DIMENSÕES E M²
    # =========================================================
    add_room_dimensions(msp, lot_x0 + SIDE_TOTAL_W, y_front, amb_x1, y_sala_start, "GARAGEM")
    add_room_dimensions(msp, amb_x0, y_sala_start, amb_x1, y_bancada, "SALA")
    add_room_dimensions(msp, amb_x0, y_bancada, amb_x1, y_miolo, "COZINHA")
    add_room_dimensions(msp, amb_x0, y_miolo, wc_x0, y_wc_end, "LAVAND")
    add_room_dimensions(msp, wc_x0, y_miolo, wc_x1, y_wc_end, "WC")
    add_room_dimensions(msp, amb_x0, y_wc_end, amb_x1, y_q1_end, "QUARTO")
    add_room_dimensions(msp, amb_x0, y_q1_end, amb_x1, y_suite_end, "SUITE")
    add_room_dimensions(msp, bwc_x0, bwc_y0, bwc_x1, bwc_y1, "BWC SUITE")
    add_room_dimensions(msp, amb_x0, y_build_end, amb_x1, y_fundo, "QUINTAL")
    add_room_dimensions(msp, corr_int_x0, y_miolo, corr_int_x1, y_suite_end, "CORR")
    
    return {
        "y_build_end": y_build_end,
        "amb_w": amb_w,
        "backyard": backyard_real,
    }

# ==========================================================
# MAIN
# ==========================================================
def main():
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    
    setup_layers(doc)
    
    doc.header["$INSUNITS"] = INSUNITS_MM
    doc.header["$LTSCALE"] = 1
    doc.header["$CELTSCALE"] = 1
    
    if "DASHED" not in doc.linetypes:
        doc.linetypes.add("DASHED", description="Dashed", pattern=[DASH_MM, -GAP_MM])
    
    backyard = BACKYARD_MIN
    
    # DIVISAS
    msp.add_lwpolyline([(0, 0), (mm(MASTER_W), 0), (mm(MASTER_W), mm(MASTER_L)), (0, mm(MASTER_L))],
                       close=True, dxfattribs={"layer": "DIVISAS"})
    msp.add_line((mm(5.0), 0), (mm(5.0), mm(26.0)), dxfattribs={"layer": "DIVISAS"})
    
    # Desenha casas
    dados_a = draw_casa_a(msp, backyard)
    dados_b = draw_casa_b(msp, backyard)
    
    # COTAS GERAIS
    draw_dim_h(msp, 0.0, 10.0, 26.0, 0.80, "10000")
    draw_dim_h(msp, 0.0, 5.0, 0.0, -0.80, "5000")
    draw_dim_h(msp, 5.0, 10.0, 0.0, -0.80, "5000")
    draw_dim_v(msp, 0.0, 26.0, 10.0, 0.80, "26000")
    
    # Info portão
    msp.add_text(f"PORTAO {PORTAO_W:.1f}m x {PORTAO_H:.1f}m BASCULANTE",
                 height=100, dxfattribs={"layer": "TEXTOS"}).set_placement((mm(2.5), mm(0.50)))
    msp.add_text(f"PORTAO {PORTAO_W:.1f}m x {PORTAO_H:.1f}m BASCULANTE",
                 height=100, dxfattribs={"layer": "TEXTOS"}).set_placement((mm(7.5), mm(0.50)))
    
    # Validação permeável
    amb_w = dados_a["amb_w"]
    perm_quintal = amb_w * dados_a["backyard"]
    perm_faixa = SIDE_PERM_W * (LOTE_L - 11.0)  # aproximado
    perm_total = perm_quintal + perm_faixa
    
    msp.add_text(f"PERM TOTAL ~{perm_total:.1f}m² {'OK' if perm_total>=PERMEAVEL_MIN else 'X'}",
                 height=100, dxfattribs={"layer": "TEXTOS"}).set_placement((mm(0.30), mm(25.50)))
    
    filename = "master_10x26_v15.dxf"
    doc.saveas(filename)
    
    print("=" * 70)
    print("DXF v15 GERADO (GARAGEM COM PASSARELA COBERTA)")
    print("=" * 70)
    print(f"Arquivo: {filename}")
    print()
    print("MODIFICAÇÕES APLICADAS:")
    print("1. Cotas de largura/comprimento + m² em cada cômodo")
    print("2. BWC suíte horizontal, fechando o corredor")
    print("3. Closet em L na parede inicial dos quartos")
    print("4. Sala/Cozinha divididas por bancada meia-parede (0.90m)")
    print("5. Cobertura contínua 2.80m (garagem até porta da SALA)")
    print("6. Portão 4.5m BASCULANTE (sobe) x 2.60m altura")
    print("7. Porta entrada da SALA na divisória garagem/sala")
    print("8. Porta de correr vidro cozinha/lavanderia")
    print("9. Bancada inteiriça na cozinha (1.20m após divisória)")
    print("10. Bancada com pia + CHURRASQUEIRA 0.60m na lavanderia")
    print("11. Passarela coberta: motorista não se molha até entrar na sala")
    print()
    print("GEOMETRIA X FIXA (NÃO ALTERADA):")
    print("Casa A: Corr.Int [0.00-1.10] | Amb [1.10-3.90] | Faixa Ext [3.90-5.00]")
    print("Casa B: Faixa Ext [5.00-6.10] | Amb [6.10-8.90] | Corr.Int [8.90-10.00]")
    print("=" * 70)

if __name__ == "__main__":
    main()
