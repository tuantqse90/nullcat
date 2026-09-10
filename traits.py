"""AvaxCats trait library — Team Avalanche (Team1 VN).

Every trait is a draw function over the shared 32x32 layer stack:
  ctx = {"bg": grid, "cat": grid, "fg": grid, "fur": palette, "rng": Random}
Backgrounds paint ctx["bg"], body parts paint ctx["cat"], overlays
(laser beams, rain, sparkles) paint ctx["fg"].
"""

from engine import P, H, V, R, darken, lighten, mask_of, dilate, SIZE


TIER_W = {"common": 100, "uncommon": 55, "rare": 28, "epic": 12, "legendary": 5}

GOLD = (250, 200, 60)
DGOLD = (176, 128, 26)
WHITE = (246, 246, 250)
INK = (24, 22, 30)
RED = (222, 62, 62)
GREEN = (52, 200, 108)
DGREEN = (26, 138, 72)
CYAN = (96, 216, 240)
PINK = (246, 122, 162)
GRAY = (150, 156, 168)
AVAX = (232, 65, 66)
AVAX_D = (150, 32, 36)
SNOW = (247, 250, 252)
ICE = (168, 216, 240)


def _n(name, tier, fn):
    return {"name": name, "tier": tier, "w": TIER_W[tier], "fn": fn}


def _draw_head(g, fur):
    o, f, b = fur["o"], fur["f"], fur["b"]

    P(g, 6, 4, o); H(g, 4, 7, 24, o); P(g, 25, 4, o)
    for y in range(5, 12):
        P(g, 6, y, o); H(g, y, 7, 24, f); P(g, 25, y, o)
    for y in range(12, 16):
        P(g, 6, y, o); H(g, y, 7, 11, f); H(g, y, 12, 19, b); H(g, y, 20, 24, f); P(g, 25, y, o)
    H(g, 12, 15, 16, (214, 110, 118))


def _neck(g, fur, x0=7, x1=24):
    o, s = fur["o"], darken(fur["f"], 0.86)
    P(g, x0, 16, o); H(g, 16, x0 + 1, x1 - 1, s); P(g, x1, 16, o)


def _sym(g, y, x, c):
    """Vẽ 1 pixel và bản đối xứng của nó qua trục giữa mặt (x=15.5)."""
    P(g, x, y, c); P(g, 31 - x, y, c)


def _symh(g, y, x0, x1, c):
    """Vẽ đoạn ngang và bản đối xứng của nó."""
    H(g, y, x0, x1, c); H(g, y, 31 - x1, 31 - x0, c)


def _ear_pointy(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    o, f, e = fur["o"], fur["f"], fur["e"]
    H(g, 0, 8, 9, o)
    P(g, 7, 1, o); H(g, 1, 8, 9, f); P(g, 10, 1, o)
    P(g, 7, 2, o); P(g, 8, 2, f); P(g, 9, 2, e); P(g, 10, 2, f); P(g, 11, 2, o)
    P(g, 6, 3, o); P(g, 7, 3, f); H(g, 3, 8, 9, e); H(g, 3, 10, 11, f); P(g, 12, 3, o)
    H(g, 4, 7, 12, f)
    H(g, 0, 22, 23, o)
    P(g, 21, 1, o); H(g, 1, 22, 23, f); P(g, 24, 1, o)
    P(g, 20, 2, o); P(g, 21, 2, f); P(g, 22, 2, e); P(g, 23, 2, f); P(g, 24, 2, o)
    P(g, 19, 3, o); H(g, 3, 20, 21, f); H(g, 3, 22, 23, e); P(g, 24, 3, f); P(g, 25, 3, o)
    H(g, 4, 19, 24, f)


def _ear_round(ctx):
    """Tai tròn, thấp — kiểu mèo Anh lông ngắn."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, e = fur["o"], fur["f"], fur["e"]
    for x0 in (7, 18):
        H(g, 1, x0 + 1, x0 + 4, o)
        P(g, x0, 2, o); H(g, 2, x0 + 1, x0 + 4, f); P(g, x0 + 5, 2, o)
        P(g, x0, 3, o); P(g, x0 + 1, 3, f); H(g, 3, x0 + 2, x0 + 3, e); P(g, x0 + 4, 3, f); P(g, x0 + 5, 3, o)
        H(g, 4, x0, x0 + 5, f)


def _ear_folded(ctx):
    """Tai cụp — Scottish Fold, gập xuống trước."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, e = fur["o"], fur["f"], fur["e"]
    for x0 in (7, 18):
        H(g, 2, x0 + 1, x0 + 4, o)
        P(g, x0, 3, o); H(g, 3, x0 + 1, x0 + 4, f); P(g, x0 + 5, 3, o)
        H(g, 4, x0, x0 + 5, f)
        H(g, 5, x0 + 1, x0 + 4, e)
        H(g, 6, x0 + 2, x0 + 3, darken(f, 0.8))


def _ear_tufted(ctx):
    """Tai linh miêu — nhọn, có túm lông chĩa xiên ra ngoài."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f = fur["o"], fur["f"]
    _ear_pointy(ctx)
    _symh(g, 0, 6, 7, f)
    _sym(g, 0, 5, o)
    _sym(g, 1, 5, o); _sym(g, 1, 6, o)
    _sym(g, 2, 4, o); _sym(g, 2, 5, f); _sym(g, 2, 6, o)
    _sym(g, 3, 4, o); _sym(g, 3, 5, o)


def _ear_big(ctx):
    """Tai to bản — tam giác loe hẳn ra ngoài đầu, kiểu tai dơi."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, e = fur["o"], fur["f"], fur["e"]
    _symh(g, 0, 6, 7, o)
    _sym(g, 1, 5, o); _symh(g, 1, 6, 8, f); _sym(g, 1, 9, o)
    _sym(g, 2, 4, o); _symh(g, 2, 5, 6, f); _symh(g, 2, 7, 8, e)
    _sym(g, 2, 9, f); _sym(g, 2, 10, o)
    _sym(g, 3, 3, o); _symh(g, 3, 4, 5, f); _symh(g, 3, 6, 9, e)
    _symh(g, 3, 10, 11, f); _sym(g, 3, 12, o)
    _sym(g, 4, 3, o); _symh(g, 4, 4, 12, f)
    _symh(g, 5, 4, 5, o)


def _ear_notched(ctx):
    """Tai sứt — mèo hoang đã đánh nhau vài trận."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, e = fur["o"], fur["f"], fur["e"]
    _ear_pointy(ctx)

    P(g, 22, 0, None); P(g, 23, 0, None)
    P(g, 22, 1, o); P(g, 23, 1, None); P(g, 24, 1, None)
    P(g, 23, 2, o); P(g, 24, 2, None)
    P(g, 24, 3, o)

    P(g, 9, 6, darken(f, 0.55)); P(g, 10, 7, darken(f, 0.55))


def _tail_curl(g, fur):
    """Đuôi cong bên trái, ôm sát thân ngồi."""
    o, f = fur["o"], fur["f"]
    H(g, 18, 3, 5, o)
    for y in range(19, 24):
        P(g, 3, y, o); H(g, y, 4, 5, f); P(g, 6, y, o)
    P(g, 4, 24, o); H(g, 24, 5, 6, f); P(g, 7, 24, o)
    P(g, 5, 25, o); H(g, 25, 6, 7, f)


def _tail_up(g, fur, x=3, top=10, bottom=20):
    """Đuôi dựng thẳng đứng, đầu đuôi móc sang trái."""
    o, f = fur["o"], fur["f"]
    H(g, top, x + 1, x + 2, o)
    for y in range(top + 1, bottom):
        P(g, x, y, o); H(g, y, x + 1, x + 2, f); P(g, x + 3, y, o)
    H(g, bottom, x + 1, x + 2, o)
    P(g, x, top + 1, o); P(g, x + 1, top, o)


def _tail_fat(g, fur):
    """Đuôi to xù cuộn dưới thân béo."""
    o, f = fur["o"], fur["f"]
    H(g, 20, 2, 4, o)
    for y in range(21, 26):
        P(g, 1, y, o); H(g, y, 2, 4, f); P(g, 5, y, o)
    H(g, 26, 2, 4, o)


def _tail_tuck(g, fur):
    """Đuôi giấu dưới bụng, chỉ ló đầu mút."""
    o, f = fur["o"], fur["f"]
    H(g, 24, 2, 4, o)
    P(g, 1, 25, o); H(g, 25, 2, 4, f); P(g, 5, 25, o)
    H(g, 26, 2, 4, o)


def _body_sitting(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur)
    P(g, 8, 17, o); H(g, 17, 9, 22, f); P(g, 23, 17, o)
    for y in range(18, 25):
        P(g, 8, y, o); H(g, y, 9, 22, f); P(g, 23, y, o)
    P(g, 8, 25, o); H(g, 25, 9, 22, f); P(g, 23, 25, o)
    P(g, 9, 26, o); H(g, 26, 10, 21, f); P(g, 22, 26, o)
    P(g, 12, 26, o); P(g, 19, 26, o)
    H(g, 27, 10, 21, o)
    _tail_curl(g, fur)
    return (4, 15)


def _body_chonk(ctx):
    """Mèo béo — thân phình ra hai bên, không thấy chân."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur)
    P(g, 8, 17, o); H(g, 17, 9, 22, f); P(g, 23, 17, o)
    P(g, 7, 18, o); H(g, 18, 8, 23, f); P(g, 24, 18, o)
    for y in range(19, 25):
        P(g, 6, y, o); H(g, y, 7, 24, f); P(g, 25, y, o)
    P(g, 6, 25, o); H(g, 25, 7, 24, f); P(g, 25, 25, o)
    P(g, 7, 26, o); H(g, 26, 8, 23, f); P(g, 24, 26, o)
    H(g, 27, 8, 23, o)
    _tail_fat(g, fur)
    return (3, 18)


def _body_slim(ctx):
    """Mèo gầy — vai vẫn rộng (để áo vừa) rồi thóp dần xuống chân dài."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur)
    P(g, 8, 17, o); H(g, 17, 9, 22, f); P(g, 23, 17, o)
    for y in range(18, 21):
        P(g, 8, y, o); H(g, y, 9, 22, f); P(g, 23, y, o)
    P(g, 9, 21, o); H(g, 21, 10, 21, f); P(g, 22, 21, o)
    for y in range(22, 25):
        P(g, 10, y, o); H(g, y, 11, 20, f); P(g, 21, y, o)
    for y in range(25, 27):
        P(g, 10, y, o); H(g, y, 11, 13, f); P(g, 14, y, o)
        P(g, 17, y, o); H(g, y, 18, 20, f); P(g, 21, y, o)
    H(g, 27, 10, 14, o); H(g, 27, 17, 21, o)
    _tail_up(g, fur, x=3, top=9, bottom=21)
    return (4, 7)


def _body_loaf(ctx):
    """Ổ bánh mì — không chân, thân bè thấp, đầu đặt thẳng lên."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur, 8, 23)
    P(g, 9, 17, o); H(g, 17, 10, 21, f); P(g, 22, 17, o)
    P(g, 8, 18, o); H(g, 18, 9, 22, f); P(g, 23, 18, o)
    P(g, 7, 19, o); H(g, 19, 8, 23, f); P(g, 24, 19, o)
    P(g, 6, 20, o); H(g, 20, 7, 24, f); P(g, 25, 20, o)
    for y in range(21, 26):
        P(g, 5, y, o); H(g, y, 6, 25, f); P(g, 26, y, o)
    P(g, 6, 26, o); H(g, 26, 7, 24, f); P(g, 25, 26, o)
    H(g, 27, 7, 24, o)
    _tail_tuck(g, fur)
    return (3, 22)


def _body_standing(ctx):
    """Đứng bằng hai chân sau, đuôi dựng — dáng cảnh giác."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur)
    P(g, 8, 17, o); H(g, 17, 9, 22, f); P(g, 23, 17, o)
    for y in range(18, 22):
        P(g, 8, y, o); H(g, y, 9, 22, f); P(g, 23, y, o)
    for y in range(22, 25):
        P(g, 9, y, o); H(g, y, 10, 21, f); P(g, 22, y, o)
    for y in range(25, 27):
        P(g, 10, y, o); H(g, y, 11, 13, f); P(g, 14, y, o)
        P(g, 17, y, o); H(g, y, 18, 20, f); P(g, 21, y, o)
    H(g, 27, 10, 14, o); H(g, 27, 17, 21, o)
    _tail_up(g, fur, x=2, top=11, bottom=22)
    return (3, 9)


def _body_wisp(ctx):
    """Không chân — thân tan dần thành khói ở đáy."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f, b = fur["o"], fur["f"], fur["b"]
    _neck(g, fur)
    P(g, 8, 17, o); H(g, 17, 9, 22, f); P(g, 23, 17, o)
    for y in range(18, 22):
        P(g, 8, y, o); H(g, y, 9, 22, f); P(g, 23, y, o)
    P(g, 9, 22, o); H(g, 22, 10, 21, f); P(g, 22, 22, o)
    P(g, 10, 23, o); H(g, 23, 11, 20, f); P(g, 21, 23, o)
    P(g, 11, 24, o); H(g, 24, 12, 19, f); P(g, 20, 24, o)
    for x in (12, 14, 16, 18):
        P(g, x, 25, f); P(g, x + 1, 25, o)
    P(g, 13, 26, o); P(g, 17, 26, o)

    P(g, 5, 19, f); P(g, 4, 20, f); P(g, 5, 21, f); P(g, 4, 22, f)
    return (4, 16)


def _head_normal(ctx):
    pass


def _head_round(ctx):
    """Má phính — đầu nở rộng thêm 1px mỗi bên."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f = fur["o"], fur["f"]
    for y in range(6, 15):
        P(g, 6, y, f); P(g, 25, y, f)
        P(g, 5, y, o); P(g, 26, y, o)
    P(g, 6, 5, o); P(g, 25, 5, o)
    P(g, 6, 15, o); P(g, 25, 15, o)


def _head_narrow(ctx):
    """Mặt thon — thu đầu vào 1px mỗi bên."""
    g, fur = ctx["cat"], ctx["fur"]
    o = fur["o"]
    for y in range(6, 15):
        P(g, 6, y, None); P(g, 25, y, None)
        P(g, 7, y, o); P(g, 24, y, o)


def _head_fluffy(ctx):
    """Lông má xù, chĩa ra hai bên."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f = fur["o"], fur["f"]
    for y in (7, 9, 11, 13):
        P(g, 5, y, f); P(g, 4, y, o)
        P(g, 26, y, f); P(g, 27, y, o)
        P(g, 5, y - 1, o); P(g, 5, y + 1, o)
        P(g, 26, y - 1, o); P(g, 26, y + 1, o)


def _head_square(ctx):
    """Đầu vuông, hàm bạnh — kiểu mèo già gân."""
    g, fur = ctx["cat"], ctx["fur"]
    o, f = fur["o"], fur["f"]
    for y in range(12, 16):
        P(g, 6, y, f); P(g, 25, y, f)
        P(g, 5, y, o); P(g, 26, y, o)
    H(g, 16, 5, 6, o); H(g, 16, 25, 26, o)


HEADS = [
    _n("Normal", "common", _head_normal),
    _n("Round", "common", _head_round),
    _n("Narrow", "uncommon", _head_narrow),
    _n("Fluffy", "uncommon", _head_fluffy),
    _n("Square", "rare", _head_square),
]


def _mane_none(ctx):
    pass


def _mane_lion(ctx):
    """Bờm sư tử — vòng lông dày bao quanh cả khuôn mặt."""
    g, fur = ctx["cat"], ctx["fur"]
    m, d = darken(fur["f"], 0.72), darken(fur["f"], 0.46)
    spans = {7: (5, 5), 8: (4, 5), 9: (3, 5), 10: (3, 5), 11: (2, 5),
             12: (2, 5), 13: (2, 5), 14: (3, 5), 15: (3, 6), 16: (4, 7)}
    for y, (x0, x1) in spans.items():
        _symh(g, y, x0, x1, m)
    for y in (8, 10, 12, 14):
        _sym(g, y, spans[y][0] - 1, d)
    _symh(g, 17, 8, 15, m)
    _symh(g, 18, 10, 15, d)


def _mane_ruff(ctx):
    """Vòng lông quanh cổ — rìa dưới răng cưa cho ra chất lông, không phải cái ván."""
    g, fur = ctx["cat"], ctx["fur"]
    m, d = lighten(fur["f"], 0.3), darken(fur["f"], 0.62)
    _sym(g, 15, 6, m); _sym(g, 15, 8, m); _sym(g, 15, 11, m); _sym(g, 15, 14, m)
    _sym(g, 16, 6, d); _symh(g, 16, 7, 15, m)
    _sym(g, 17, 5, d); _symh(g, 17, 6, 15, m)
    _sym(g, 18, 6, d); _symh(g, 18, 7, 15, m)
    for x in (7, 9, 11, 13, 15):
        _sym(g, 19, x, m)
        _sym(g, 19, x - 1, d)


def _mane_beard(ctx):
    """Râu cằm — chòm lông dưới mõm."""
    g, fur = ctx["cat"], ctx["fur"]
    m, d = lighten(fur["f"], 0.42), darken(fur["f"], 0.6)
    H(g, 16, 12, 19, m)
    H(g, 17, 13, 18, m)
    H(g, 18, 14, 17, m)
    P(g, 15, 19, d); P(g, 16, 19, d)
    P(g, 11, 16, d); P(g, 20, 16, d)


def _mane_sideburns(ctx):
    """Tóc mai xù hai bên má."""
    g, fur = ctx["cat"], ctx["fur"]
    m, d = darken(fur["f"], 0.78), darken(fur["f"], 0.52)
    for y in range(10, 16):
        P(g, 5, y, m); P(g, 26, y, m)
    P(g, 4, 11, d); P(g, 4, 13, d); P(g, 4, 15, d)
    P(g, 27, 11, d); P(g, 27, 13, d); P(g, 27, 15, d)
    P(g, 5, 9, d); P(g, 26, 9, d)


MANES = [
    _n("None", "common", _mane_none),
    _n("Neck Ruff", "uncommon", _mane_ruff),
    _n("Beard", "uncommon", _mane_beard),
    _n("Sideburns", "rare", _mane_sideburns),
    _n("Lion Mane", "epic", _mane_lion),
]


def _wh_none(ctx):
    pass


def _wh_short(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    w = lighten(fur["o"], 0.55)
    _symh(g, 12, 3, 5, w)
    _symh(g, 14, 3, 5, w)


def _wh_long(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    w = lighten(fur["o"], 0.6)
    H(g, 12, 1, 5, w); H(g, 14, 1, 5, w)
    H(g, 12, 26, 30, w); H(g, 14, 26, 30, w)


def _wh_droopy(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    w = lighten(fur["o"], 0.5)
    P(g, 5, 13, w); P(g, 4, 14, w); P(g, 3, 15, w); P(g, 2, 15, w)
    P(g, 26, 13, w); P(g, 27, 14, w); P(g, 28, 15, w); P(g, 29, 15, w)
    P(g, 5, 15, w); P(g, 26, 15, w)


def _wh_perky(ctx):
    g, fur = ctx["cat"], ctx["fur"]
    w = lighten(fur["o"], 0.62)
    P(g, 5, 13, w); P(g, 4, 12, w); P(g, 3, 11, w)
    P(g, 5, 14, w); P(g, 4, 14, w); P(g, 3, 14, w)
    P(g, 26, 13, w); P(g, 27, 12, w); P(g, 28, 11, w)
    P(g, 26, 14, w); P(g, 27, 14, w); P(g, 28, 14, w)


WHISKERS = [
    _n("None", "common", _wh_none),
    _n("Short", "common", _wh_short),
    _n("Long", "uncommon", _wh_long),
    _n("Droopy", "uncommon", _wh_droopy),
    _n("Perky", "rare", _wh_perky),
]


def _belly_classic(ctx):
    g, b = ctx["cat"], ctx["fur"]["b"]
    R(g, 13, 18, 18, 25, b)


def _belly_bib(ctx):
    """Yếm trắng trước ngực, thuôn xuống như giọt nước."""
    g, b = ctx["cat"], ctx["fur"]["b"]
    H(g, 17, 12, 19, b)
    H(g, 18, 11, 20, b)
    H(g, 19, 11, 20, b)
    H(g, 20, 12, 19, b)
    H(g, 21, 13, 18, b)
    H(g, 22, 14, 17, b)


def _belly_none(ctx):
    pass


def _belly_socks(ctx):
    g, b = ctx["cat"], ctx["fur"]["b"]
    R(g, 13, 20, 18, 25, b)
    H(g, 25, 9, 12, b); H(g, 26, 9, 12, b)
    H(g, 25, 19, 22, b); H(g, 26, 19, 22, b)


def _belly_star(ctx):
    """Ngôi sao 5 cánh trước ngực."""
    g = ctx["cat"]
    b, hl = ctx["fur"]["b"], WHITE
    H(g, 18, 15, 16, hl)
    H(g, 19, 13, 18, hl)
    H(g, 20, 14, 17, b)
    H(g, 21, 13, 18, b)
    H(g, 22, 13, 14, b); H(g, 22, 17, 18, b)
    P(g, 15, 19, b); P(g, 16, 19, b)


BELLIES = [
    _n("Classic", "common", _belly_classic),
    _n("Bib", "common", _belly_bib),
    _n("Solid", "uncommon", _belly_none),
    _n("Socks", "uncommon", _belly_socks),
    _n("Chest Star", "rare", _belly_star),
]


BODIES = [
    _n("Sitting", "common", _body_sitting),
    _n("Chonk", "common", _body_chonk),
    _n("Slim", "uncommon", _body_slim),
    _n("Loaf", "uncommon", _body_loaf),
    _n("Standing", "rare", _body_standing),
    _n("Wisp", "epic", _body_wisp),
]

EARS = [
    _n("Pointy", "common", _ear_pointy),
    _n("Round", "common", _ear_round),
    _n("Folded", "uncommon", _ear_folded),
    _n("Big", "uncommon", _ear_big),
    _n("Tufted", "rare", _ear_tufted),
    _n("Notched", "rare", _ear_notched),
]

BODY_BY_NAME = {t["name"]: t for t in BODIES}
EAR_BY_NAME = {t["name"]: t for t in EARS}
HEAD_BY_NAME = {t["name"]: t for t in HEADS}


def draw_base_cat(ctx, body=None, ears=None, head=None):
    """Vẽ con mèo trần: thân+đuôi (Body) → đầu (cố định) → dáng đầu → tai.

    Trả về toạ độ neo đuôi để trait Tail bám theo đúng dáng.
    """
    g, fur = ctx["cat"], ctx["fur"]
    tail_tip = (body or _body_sitting)(ctx)
    _draw_head(g, fur)
    (head or _head_normal)(ctx)
    (ears or _ear_pointy)(ctx)
    ctx["tail_tip"] = tail_tip
    return tail_tip


FURS = [
    {"name": "Orange Tabby", "tier": "common",
     "o": (66, 42, 30), "f": (240, 158, 66), "b": (255, 230, 196), "e": (232, 120, 116)},
    {"name": "Gray", "tier": "common",
     "o": (46, 46, 58), "f": (148, 154, 168), "b": (224, 227, 236), "e": (222, 130, 142)},
    {"name": "Black", "tier": "uncommon",
     "o": (14, 14, 20), "f": (56, 56, 66), "b": (118, 118, 132), "e": (150, 92, 104)},
    {"name": "White", "tier": "uncommon",
     "o": (108, 108, 122), "f": (240, 240, 246), "b": (255, 255, 255), "e": (255, 168, 180)},
    {"name": "Cream", "tier": "common",
     "o": (94, 70, 46), "f": (238, 212, 162), "b": (255, 244, 219), "e": (240, 148, 138)},
    {"name": "Money Green", "tier": "rare",
     "o": (22, 78, 48), "f": (94, 198, 124), "b": (208, 244, 219), "e": (52, 138, 84)},
    {"name": "Golden", "tier": "epic",
     "o": (118, 80, 18), "f": (246, 198, 64), "b": (255, 240, 189), "e": (230, 148, 88)},
    {"name": "Pink", "tier": "rare",
     "o": (112, 48, 78), "f": (246, 158, 190), "b": (255, 224, 236), "e": (255, 118, 150)},
    {"name": "Zombie", "tier": "epic",
     "o": (52, 72, 48), "f": (148, 178, 128), "b": (198, 214, 178), "e": (108, 138, 98)},
    {"name": "Alien", "tier": "legendary",
     "o": (30, 84, 76), "f": (146, 226, 202), "b": (212, 248, 238), "e": (76, 168, 148)},
    {"name": "Avalanche Red", "tier": "legendary",
     "o": (94, 14, 18), "f": (232, 65, 66), "b": (255, 205, 205), "e": (150, 30, 34)},
]


def _pat_tabby(ctx):
    g, f = ctx["cat"], ctx["fur"]["f"]
    s = darken(f, 0.68)
    for x in (11, 14, 17, 20):
        V(g, x, 5, 7, s)
    for y in (20, 22):
        H(g, y, 9, 11, s); H(g, y, 20, 22, s)
    H(g, 21, 4, 5, s)


def _pat_spots(ctx):
    g, f = ctx["cat"], ctx["fur"]["f"]
    s = darken(f, 0.68)
    for x, y in ((10, 6), (21, 7), (8, 13), (23, 14), (11, 20), (20, 22), (15, 6)):
        P(g, x, y, s)
        P(g, x + 1, y, s)


def _pat_tuxedo(ctx):
    g = ctx["cat"]
    w = (250, 250, 252)
    R(g, 13, 18, 18, 25, w)
    R(g, 15, 6, 16, 11, w)
    H(g, 26, 10, 12, w); H(g, 26, 19, 21, w)


def _pat_patch(ctx):
    g, f = ctx["cat"], ctx["fur"]["f"]
    s = darken(f, 0.55)
    R(g, 9, 7, 13, 12, s)


def _pat_siamese(ctx):
    g, f = ctx["cat"], ctx["fur"]["f"]
    p = darken(f, 0.52)
    H(g, 2, 8, 9, p); H(g, 2, 22, 23, p)
    P(g, 7, 3, p); P(g, 10, 3, p); P(g, 21, 3, p); P(g, 24, 3, p)
    H(g, 25, 9, 22, p); H(g, 26, 9, 22, p)
    for y in range(19, 24):
        H(g, y, 4, 5, p)
    H(g, 24, 5, 6, p); H(g, 25, 6, 7, p)


PATTERNS = [
    _n("Plain", "common", None),
    _n("Tabby Stripes", "common", _pat_tabby),
    _n("Spots", "uncommon", _pat_spots),
    _n("Tuxedo", "uncommon", _pat_tuxedo),
    _n("Pirate Patch", "rare", _pat_patch),
    _n("Siamese Points", "rare", _pat_siamese),
]


def _eye_normal(ctx):
    g = ctx["cat"]
    R(g, 10, 9, 11, 10, INK); R(g, 20, 9, 21, 10, INK)
    P(g, 10, 9, (210, 214, 224)); P(g, 20, 9, (210, 214, 224))


def _eye_sleepy(ctx):
    g = ctx["cat"]
    H(g, 10, 10, 12, INK); H(g, 10, 19, 21, INK)


def _eye_wink(ctx):
    g = ctx["cat"]
    R(g, 10, 9, 11, 10, INK)
    P(g, 10, 9, (210, 214, 224))
    H(g, 10, 19, 21, INK)


def _eye_laser(ctx):
    g, fg = ctx["cat"], ctx["fg"]
    core = (255, 236, 210)
    hot = (255, 84, 48)
    R(g, 10, 9, 11, 10, hot); R(g, 20, 9, 21, 10, hot)
    P(g, 10, 9, core); P(g, 21, 9, core)
    for y in (9, 10):
        H(fg, y, 0, 9, hot); H(fg, y, 22, 31, hot)
    H(fg, 8, 0, 7, (255, 150, 96)); H(fg, 8, 24, 31, (255, 150, 96))


def _eye_dollar(ctx):
    g = ctx["cat"]
    for cx in (11, 20):
        R(g, cx - 1, 9, cx + 1, 11, WHITE)
        P(g, cx, 9, DGREEN); H(g, 10, cx - 1, cx + 1, DGREEN); P(g, cx, 11, DGREEN)


def _eye_diamond(ctx):
    g = ctx["cat"]
    for cx in (11, 20):
        R(g, cx - 1, 9, cx + 1, 11, WHITE)
        P(g, cx, 9, CYAN); P(g, cx - 1, 10, CYAN); P(g, cx + 1, 10, CYAN); P(g, cx, 11, CYAN)
        P(g, cx, 10, (225, 250, 255))


def _eye_hypno(ctx):
    g = ctx["cat"]
    sw = (222, 62, 62)
    for cx in (11, 20):
        R(g, cx - 1, 9, cx + 1, 11, WHITE)
        P(g, cx - 1, 9, sw); P(g, cx + 1, 9, sw); P(g, cx, 10, sw)
        P(g, cx - 1, 11, sw); P(g, cx + 1, 11, sw)


def _eye_heart(ctx):
    g = ctx["cat"]
    hp = (255, 92, 132)
    for cx in (11, 20):
        P(g, cx - 1, 9, hp); P(g, cx + 1, 9, hp)
        H(g, 10, cx - 1, cx + 1, hp); P(g, cx, 11, hp)


def _eye_candle(ctx):
    g = ctx["cat"]
    for cx in (11, 20):
        P(g, cx, 7, (208, 216, 208))
        V(g, cx, 8, 11, GREEN)
        P(g, cx, 8, (150, 240, 178))


def _eye_cyborg(ctx):
    g, fg = ctx["cat"], ctx["fg"]
    R(g, 10, 9, 11, 10, INK); P(g, 10, 9, (210, 214, 224))
    R(g, 19, 8, 21, 11, GRAY)
    P(g, 20, 9, (255, 70, 50)); P(g, 20, 10, (255, 70, 50))
    H(fg, 9, 22, 26, (255, 96, 64))


EYES = [
    _n("Normal", "common", _eye_normal),
    _n("Sleepy", "common", _eye_sleepy),
    _n("Wink", "uncommon", _eye_wink),
    _n("Dollar Signs", "rare", _eye_dollar),
    _n("Diamond Eyes", "rare", _eye_diamond),
    _n("Hypno", "rare", _eye_hypno),
    _n("Heart Eyes", "epic", _eye_heart),
    _n("Candle Eyes", "epic", _eye_candle),
    _n("Cyborg", "epic", _eye_cyborg),
    _n("Laser Eyes", "legendary", _eye_laser),
]


MOUTH_INK = (96, 52, 44)


def _m_smile(ctx):
    g = ctx["cat"]
    P(g, 13, 13, MOUTH_INK); H(g, 14, 14, 17, MOUTH_INK); P(g, 18, 13, MOUTH_INK)


def _m_smirk(ctx):
    g = ctx["cat"]
    H(g, 14, 14, 16, MOUTH_INK); P(g, 17, 13, MOUTH_INK)


def _m_meh(ctx):
    g = ctx["cat"]
    H(g, 14, 14, 17, MOUTH_INK)


def _m_grin(ctx):
    g = ctx["cat"]
    R(g, 12, 13, 19, 14, MOUTH_INK)
    H(g, 13, 13, 18, WHITE)
    P(g, 17, 13, GOLD)


def _m_cigar(ctx):
    g, fg = ctx["cat"], ctx["fg"]
    H(g, 14, 14, 16, MOUTH_INK)
    H(g, 13, 17, 23, (134, 84, 52)); H(g, 14, 17, 23, (104, 62, 38))
    P(g, 24, 13, (255, 128, 44)); P(g, 24, 14, (206, 64, 30))
    P(fg, 25, 11, (184, 190, 198)); P(fg, 26, 9, (202, 208, 214)); P(fg, 26, 8, (216, 220, 226))


def _m_bill(ctx):
    g = ctx["cat"]
    H(g, 14, 14, 16, MOUTH_INK)
    R(g, 16, 14, 21, 16, (72, 172, 92))
    H(g, 14, 16, 21, DGREEN); P(g, 21, 16, DGREEN)
    P(g, 18, 15, (188, 232, 196)); P(g, 19, 15, (188, 232, 196))


def _m_fish(ctx):
    g = ctx["cat"]
    H(g, 14, 13, 15, MOUTH_INK)
    R(g, 16, 13, 20, 14, (122, 152, 172))
    P(g, 21, 13, (98, 124, 144)); P(g, 21, 14, (98, 124, 144))
    P(g, 22, 12, (98, 124, 144)); P(g, 22, 15, (98, 124, 144))
    P(g, 17, 13, WHITE)


def _m_tongue(ctx):
    g = ctx["cat"]
    P(g, 13, 13, MOUTH_INK); H(g, 14, 14, 17, MOUTH_INK); P(g, 18, 13, MOUTH_INK)
    R(g, 15, 15, 16, 16, (240, 118, 142))
    P(g, 15, 16, (214, 92, 118))


MOUTHS = [
    _n("Smile", "common", _m_smile),
    _n("Smirk", "common", _m_smirk),
    _n("Meh", "uncommon", _m_meh),
    _n("Gold Tooth Grin", "rare", _m_grin),
    _n("Cigar", "rare", _m_cigar),
    _n("Dollar Bill", "rare", _m_bill),
    _n("Fresh Fish", "uncommon", _m_fish),
    _n("Blep", "uncommon", _m_tongue),
]


def _h_summit_cap(ctx):
    g = ctx["cat"]
    rd, dr = (216, 58, 60), AVAX_D
    H(g, 2, 10, 21, rd)
    H(g, 3, 9, 22, rd)
    H(g, 4, 8, 23, rd)
    H(g, 5, 6, 25, dr)
    H(g, 1, 10, 12, rd)
    V(g, 22, 0, 2, SNOW); P(g, 23, 1, SNOW); P(g, 21, 0, SNOW)
    P(g, 22, 3, (196, 204, 214))


def _h_crown(ctx):
    g = ctx["cat"]
    R(g, 10, 3, 21, 4, GOLD)
    R(g, 10, 1, 11, 2, GOLD); R(g, 15, 1, 16, 2, GOLD); R(g, 20, 1, 21, 2, GOLD)
    H(g, 5, 10, 21, DGOLD)
    P(g, 13, 4, RED); P(g, 15, 4, CYAN); P(g, 16, 4, CYAN); P(g, 18, 4, RED)


def _h_tophat(ctx):
    g = ctx["cat"]
    H(g, 5, 7, 24, (20, 20, 26))
    R(g, 11, 0, 20, 4, (38, 38, 46))
    H(g, 3, 11, 20, (206, 62, 74))


def _h_beanie(ctx):
    g = ctx["cat"]
    t, lt = (58, 138, 170), (92, 180, 206)
    H(g, 1, 12, 19, t); H(g, 2, 10, 21, t); H(g, 3, 9, 22, t)
    R(g, 8, 4, 23, 5, lt)
    P(g, 15, 0, WHITE); P(g, 16, 0, WHITE)


def _h_cowboy(ctx):
    g = ctx["cat"]
    br, db = (154, 96, 54), (112, 66, 36)
    H(g, 5, 5, 26, db)
    P(g, 4, 4, db); P(g, 27, 4, db)
    R(g, 11, 1, 20, 4, br)
    V(g, 15, 1, 2, db); V(g, 16, 1, 2, db)
    H(g, 4, 11, 20, (84, 46, 24))


def _h_halo(ctx):
    g = ctx["cat"]
    lg = (255, 222, 92)
    H(g, 0, 13, 18, lg)
    P(g, 12, 1, lg); P(g, 19, 1, lg)


def _h_horns(ctx):
    g = ctx["cat"]
    hr = (204, 52, 52)
    P(g, 9, 3, hr); P(g, 8, 2, hr); P(g, 7, 1, hr); P(g, 6, 0, hr)
    P(g, 22, 3, hr); P(g, 23, 2, hr); P(g, 24, 1, hr); P(g, 25, 0, hr)


def _h_wizard(ctx):
    g = ctx["cat"]
    pu, dp = (122, 72, 192), (88, 48, 148)
    H(g, 0, 15, 16, pu); H(g, 1, 14, 17, pu); H(g, 2, 13, 18, pu); H(g, 3, 12, 19, pu)
    H(g, 4, 9, 22, dp); H(g, 5, 9, 22, dp)
    P(g, 15, 2, GOLD); P(g, 17, 3, GOLD); P(g, 13, 3, GOLD)


def _h_party(ctx):
    g = ctx["cat"]
    P(g, 15, 0, WHITE); P(g, 16, 0, WHITE)
    H(g, 1, 15, 16, RED)
    H(g, 2, 14, 17, GOLD)
    H(g, 3, 14, 17, RED)
    H(g, 4, 13, 18, GOLD)


def _h_headband(ctx):
    g = ctx["cat"]
    rb = (212, 62, 62)
    H(g, 5, 6, 25, rb); H(g, 6, 6, 25, darken(rb, 0.8))
    P(g, 26, 6, rb); P(g, 27, 7, rb); P(g, 27, 8, darken(rb, 0.8))


def _h_mohawk(ctx):
    g = ctx["cat"]
    mg = (64, 222, 122)
    V(g, 11, 3, 4, mg); V(g, 13, 1, 4, mg); V(g, 15, 0, 4, mg)
    V(g, 16, 0, 4, mg); V(g, 18, 1, 4, mg); V(g, 20, 3, 4, mg)


def _h_hood(ctx):
    """The Avalanche Hood — summit parka hood in full AVAX red."""
    g = ctx["cat"]
    gr, dg = AVAX, AVAX_D
    H(g, 1, 9, 22, gr)
    H(g, 2, 8, 23, gr)
    H(g, 3, 7, 24, gr)
    H(g, 4, 6, 25, gr)
    P(g, 23, 0, gr); P(g, 24, 1, dg)
    for x in (6, 7):
        V(g, x, 5, 15, gr)
    for x in (24, 25):
        V(g, x, 5, 15, gr)
    V(g, 8, 5, 15, dg)
    V(g, 23, 5, 15, dg)
    H(g, 16, 6, 25, dg)
    P(g, 15, 16, SNOW); P(g, 16, 16, SNOW)


def _h_arrow(ctx):
    g = ctx["cat"]
    sh = (142, 92, 52)
    H(g, 2, 1, 6, sh)
    R(g, 1, 1, 2, 3, RED)
    H(g, 2, 25, 28, sh)
    P(g, 29, 2, GRAY); P(g, 28, 1, GRAY); P(g, 28, 3, GRAY); P(g, 30, 2, GRAY)


HEADWEAR = [
    _n("None", "common", None),
    _n("Summit Cap", "rare", _h_summit_cap),
    _n("Crown", "epic", _h_crown),
    _n("Top Hat", "rare", _h_tophat),
    _n("Beanie", "uncommon", _h_beanie),
    _n("Cowboy Hat", "uncommon", _h_cowboy),
    _n("Halo", "epic", _h_halo),
    _n("Devil Horns", "epic", _h_horns),
    _n("Wizard Hat", "rare", _h_wizard),
    _n("Party Hat", "uncommon", _h_party),
    _n("Ninja Headband", "uncommon", _h_headband),
    _n("Mohawk", "rare", _h_mohawk),
    _n("Arrow Through Head", "legendary", _h_arrow),
    _n("The Avalanche Hood", "epic", _h_hood),
]


def _w_dealwithit(ctx):
    g = ctx["cat"]
    bk = (16, 16, 20)
    R(g, 9, 9, 13, 11, bk); R(g, 18, 9, 22, 11, bk)
    H(g, 9, 14, 17, bk)
    H(g, 9, 7, 8, bk); H(g, 9, 23, 24, bk)
    P(g, 10, 10, (74, 74, 84)); P(g, 19, 10, (74, 74, 84))


def _w_round(ctx):
    g = ctx["cat"]
    for cx in (11, 20):
        H(g, 8, cx - 1, cx + 1, DGOLD); H(g, 12, cx - 1, cx + 1, DGOLD)
        V(g, cx - 2, 9, 11, DGOLD); V(g, cx + 2, 9, 11, DGOLD)
    H(g, 9, 14, 17, DGOLD)


def _w_monocle(ctx):
    g = ctx["cat"]
    H(g, 8, 19, 21, DGOLD); H(g, 12, 19, 21, DGOLD)
    V(g, 18, 9, 11, DGOLD); V(g, 22, 9, 11, DGOLD)
    P(g, 22, 13, GOLD); P(g, 23, 14, GOLD); P(g, 23, 15, GOLD)


def _w_3d(ctx):
    g = ctx["cat"]
    R(g, 9, 8, 13, 12, WHITE); R(g, 18, 8, 22, 12, WHITE)
    R(g, 10, 9, 12, 11, (224, 62, 62)); R(g, 19, 9, 21, 11, (66, 190, 232))
    H(g, 9, 14, 17, WHITE)
    H(g, 9, 7, 8, WHITE); H(g, 9, 23, 24, WHITE)


def _w_vr(ctx):
    g = ctx["cat"]
    R(g, 8, 8, 23, 12, (72, 76, 90))
    R(g, 10, 9, 21, 11, (36, 38, 48))
    H(g, 10, 11, 20, (128, 96, 255))
    H(g, 9, 6, 7, (48, 50, 60)); H(g, 9, 24, 25, (48, 50, 60))


def _w_star(ctx):
    g = ctx["cat"]
    yl = (255, 210, 60)
    for cx in (11, 20):
        P(g, cx, 8, yl)
        H(g, 9, cx - 1, cx + 1, yl)
        H(g, 10, cx - 2, cx + 2, yl)
        H(g, 11, cx - 1, cx + 1, yl)
        P(g, cx, 12, yl)
        P(g, cx, 10, (255, 240, 170))
    H(g, 10, 14, 17, yl)


EYEWEAR = [
    _n("None", "common", None),
    _n("Deal With It", "rare", _w_dealwithit),
    _n("Round Glasses", "uncommon", _w_round),
    _n("Monocle", "rare", _w_monocle),
    _n("3D Glasses", "uncommon", _w_3d),
    _n("VR Headset", "epic", _w_vr),
    _n("Star Shades", "epic", _w_star),
]


def _o_chain(ctx):
    g = ctx["cat"]
    for x in range(10, 22, 2):
        P(g, x, 17, GOLD)
    R(g, 15, 18, 16, 19, GOLD)
    P(g, 16, 19, DGOLD)


def _o_suit(ctx):
    g = ctx["cat"]
    nv = (42, 50, 82)
    R(g, 9, 18, 12, 25, nv); R(g, 19, 18, 22, 25, nv)
    P(g, 13, 18, nv); P(g, 13, 19, nv); P(g, 18, 18, nv); P(g, 18, 19, nv)
    R(g, 14, 18, 17, 25, (245, 245, 248))
    R(g, 15, 18, 16, 21, (204, 52, 62))
    H(g, 17, 15, 16, (154, 36, 46))


def _o_hoodie(ctx):
    g = ctx["cat"]
    gy = (118, 124, 140)
    R(g, 9, 16, 22, 18, gy)
    H(g, 16, 9, 22, lighten(gy, 0.2))
    V(g, 13, 19, 21, WHITE); V(g, 18, 19, 21, WHITE)


def _o_bowtie(ctx):
    g = ctx["cat"]
    R(g, 12, 16, 13, 18, RED); R(g, 18, 16, 19, 18, RED)
    P(g, 15, 17, (154, 36, 46)); P(g, 16, 17, (154, 36, 46))
    P(g, 14, 17, RED); P(g, 17, 17, RED)


def _o_scarf(ctx):
    g = ctx["cat"]
    sc = (212, 72, 62)
    R(g, 9, 16, 22, 17, sc)
    R(g, 18, 18, 20, 21, sc)
    P(g, 18, 22, darken(sc, 0.7)); P(g, 20, 22, darken(sc, 0.7))
    H(g, 17, 9, 22, darken(sc, 0.82))


def _o_cape(ctx):
    g = ctx["cat"]
    cp = (192, 52, 58)
    R(g, 6, 17, 7, 24, cp)
    R(g, 24, 17, 25, 24, cp)
    V(g, 6, 17, 24, darken(cp, 0.75))
    V(g, 25, 17, 24, darken(cp, 0.75))
    P(g, 9, 16, GOLD); P(g, 22, 16, GOLD)


def _o_hoodie_avax(ctx):
    g = ctx["cat"]
    rd = (208, 52, 56)
    R(g, 9, 16, 22, 18, rd)
    H(g, 16, 9, 22, (232, 82, 84))
    V(g, 13, 19, 21, WHITE); V(g, 18, 19, 21, WHITE)
    P(g, 15, 17, WHITE); P(g, 14, 18, WHITE); P(g, 16, 18, WHITE)


def _o_bandana(ctx):
    g = ctx["cat"]
    bl = (70, 112, 202)
    R(g, 9, 16, 22, 17, bl)
    H(g, 18, 13, 18, bl); H(g, 19, 14, 17, bl); H(g, 20, 15, 16, bl)
    P(g, 12, 17, WHITE); P(g, 15, 16, WHITE); P(g, 19, 17, WHITE)


OUTFITS = [
    _n("None", "common", None),
    _n("Gold Chain", "rare", _o_chain),
    _n("Suit & Tie", "rare", _o_suit),
    _n("Hoodie", "uncommon", _o_hoodie),
    _n("Bowtie", "uncommon", _o_bowtie),
    _n("Scarf", "uncommon", _o_scarf),
    _n("Cape", "epic", _o_cape),
    _n("Bandana", "uncommon", _o_bandana),
    _n("AVAX Hoodie", "rare", _o_hoodie_avax),
]


def _i_moneybag(ctx):
    g = ctx["cat"]
    br = (152, 102, 56)
    H(g, 21, 25, 28, br)
    R(g, 24, 22, 29, 26, br)
    H(g, 20, 25, 27, darken(br, 0.6))
    V(g, 24, 22, 26, darken(br, 0.78)); V(g, 29, 22, 26, darken(br, 0.78))
    P(g, 26, 23, GOLD); P(g, 25, 24, GOLD); P(g, 26, 24, GOLD); P(g, 27, 24, GOLD); P(g, 26, 25, GOLD)


def _i_phone(ctx):
    g = ctx["cat"]
    R(g, 24, 18, 28, 26, (30, 32, 40))
    R(g, 25, 19, 27, 25, (16, 42, 32))
    P(g, 25, 24, GREEN); P(g, 26, 23, GREEN); P(g, 26, 22, GREEN); P(g, 27, 21, GREEN)
    P(g, 27, 20, (150, 240, 178))


def _i_diamond(ctx):
    g, fg = ctx["cat"], ctx["fg"]
    H(g, 20, 25, 27, (186, 242, 252))
    H(g, 21, 24, 28, (110, 215, 240))
    H(g, 22, 25, 27, (90, 190, 225))
    P(g, 26, 23, (70, 160, 210))
    P(fg, 29, 19, WHITE)


def _i_rocket(ctx):
    g = ctx["cat"]
    R(g, 25, 19, 27, 24, (206, 210, 220))
    P(g, 26, 17, RED); H(g, 18, 25, 27, RED)
    P(g, 26, 21, (94, 182, 240))
    P(g, 24, 23, RED); P(g, 24, 24, RED); P(g, 28, 23, RED); P(g, 28, 24, RED)
    P(g, 26, 25, (255, 200, 60))
    H(g, 26, 25, 27, (255, 140, 50))
    P(g, 26, 27, (255, 90, 40))


def _i_green_candle(ctx):
    g = ctx["cat"]
    V(g, 26, 17, 19, (208, 216, 208))
    R(g, 25, 20, 27, 25, (42, 192, 96))
    V(g, 27, 20, 25, DGREEN)
    V(g, 26, 26, 27, (208, 216, 208))


def _i_red_candle(ctx):
    g = ctx["cat"]
    V(g, 26, 17, 19, (216, 208, 208))
    R(g, 25, 20, 27, 25, (226, 62, 70))
    V(g, 27, 20, 25, (158, 38, 46))
    V(g, 26, 26, 27, (216, 208, 208))


def _i_coins(ctx):
    g = ctx["cat"]
    R(g, 25, 19, 29, 20, GOLD); H(g, 20, 25, 29, DGOLD); P(g, 27, 19, (255, 236, 150))
    R(g, 24, 22, 28, 23, GOLD); H(g, 23, 24, 28, DGOLD); P(g, 26, 22, (255, 236, 150))
    R(g, 24, 25, 29, 26, GOLD); H(g, 26, 24, 29, DGOLD); P(g, 27, 25, (255, 236, 150))


def _i_briefcase(ctx):
    g = ctx["cat"]
    br = (122, 82, 46)
    R(g, 23, 21, 29, 26, br)
    H(g, 21, 23, 29, darken(br, 0.7))
    H(g, 20, 25, 27, darken(br, 0.6))
    P(g, 26, 23, GOLD)


def _i_trophy(ctx):
    g = ctx["cat"]
    H(g, 19, 24, 28, GOLD); H(g, 20, 24, 28, GOLD); H(g, 21, 25, 27, GOLD)
    P(g, 23, 19, DGOLD); P(g, 29, 19, DGOLD)
    V(g, 26, 22, 23, DGOLD)
    H(g, 24, 25, 27, GOLD); H(g, 25, 24, 28, DGOLD)
    P(g, 25, 19, (255, 236, 150))


def _i_avax_card(ctx):
    """The AVAX Red Card — solid Avalanche red, obviously."""
    g = ctx["cat"]
    R(g, 23, 20, 30, 25, AVAX)
    H(g, 20, 23, 30, (255, 140, 140))
    R(g, 24, 21, 25, 22, SNOW)
    H(g, 24, 24, 29, AVAX_D)
    P(g, 29, 21, (255, 190, 190)); P(g, 28, 22, (255, 190, 190))
    V(g, 30, 21, 25, AVAX_D)


def _i_iceaxe(ctx):
    g = ctx["cat"]
    steel, dsteel = (200, 208, 216), (140, 148, 160)
    H(g, 19, 23, 29, steel)
    P(g, 23, 20, dsteel); P(g, 29, 20, dsteel)
    V(g, 26, 20, 26, (146, 96, 56))
    H(g, 23, 25, 27, AVAX)
    P(g, 26, 27, dsteel)


def _i_snowflake(ctx):
    g = ctx["cat"]
    V(g, 26, 18, 24, SNOW)
    H(g, 21, 23, 29, SNOW)
    P(g, 24, 19, ICE); P(g, 28, 19, ICE)
    P(g, 24, 23, ICE); P(g, 28, 23, ICE)
    P(g, 26, 21, ICE)


PAW_ITEMS = [
    _n("None", "common", None),
    _n("Money Bag", "rare", _i_moneybag),
    _n("Stonks Phone", "rare", _i_phone),
    _n("Diamond (HODL)", "epic", _i_diamond),
    _n("Rocket", "epic", _i_rocket),
    _n("Green Candle", "uncommon", _i_green_candle),
    _n("Red Candle", "uncommon", _i_red_candle),
    _n("Coin Stack", "rare", _i_coins),
    _n("Briefcase", "uncommon", _i_briefcase),
    _n("Golden Trophy", "legendary", _i_trophy),
    _n("AVAX Red Card", "legendary", _i_avax_card),
    _n("Ice Axe", "epic", _i_iceaxe),
    _n("Snowflake", "rare", _i_snowflake),
]


def _e_hoop(ctx):
    g = ctx["cat"]
    P(g, 7, 5, GOLD); P(g, 6, 6, GOLD); P(g, 7, 7, GOLD); P(g, 8, 6, GOLD)


def _e_stud(ctx):
    g, fg = ctx["cat"], ctx["fg"]
    P(g, 7, 5, CYAN)
    P(fg, 5, 4, WHITE)


def _e_cross(ctx):
    g = ctx["cat"]
    V(g, 7, 5, 7, GOLD)
    P(g, 6, 6, GOLD); P(g, 8, 6, GOLD)


EARRINGS = [
    _n("None", "common", None),
    _n("Gold Hoop", "uncommon", _e_hoop),
    _n("Diamond Stud", "rare", _e_stud),
    _n("Gold Cross", "rare", _e_cross),
]


def _t_coin(ctx):
    g = ctx["cat"]; cx, cy = ctx["tail_tip"]
    H(g, cy - 1, cx, cx + 1, GOLD)
    R(g, cx - 1, cy, cx + 2, cy + 1, GOLD)
    H(g, cy + 2, cx, cx + 1, GOLD)
    P(g, cx, cy, DGOLD); P(g, cx + 1, cy + 1, DGOLD)


def _t_flame(ctx):
    g = ctx["cat"]; cx, cy = ctx["tail_tip"]
    P(g, cx, cy + 2, (255, 220, 80)); P(g, cx + 1, cy + 2, (255, 200, 70))
    P(g, cx, cy + 1, (255, 180, 60)); P(g, cx - 1, cy + 1, (255, 140, 50))
    P(g, cx + 1, cy, (255, 160, 50)); P(g, cx, cy - 1, (255, 120, 40))
    P(g, cx + 1, cy - 2, (255, 200, 60))


def _t_lightning(ctx):
    g = ctx["cat"]; cx, cy = ctx["tail_tip"]
    yl = (255, 230, 80)
    P(g, cx + 1, cy - 3, yl); P(g, cx, cy - 2, yl); P(g, cx + 1, cy - 1, yl)
    P(g, cx, cy, yl); P(g, cx + 1, cy + 1, yl); P(g, cx, cy + 2, yl)


def _t_star(ctx):
    g = ctx["cat"]; cx, cy = ctx["tail_tip"]
    yl = (255, 220, 70)
    P(g, cx, cy - 1, yl); P(g, cx - 1, cy, yl); P(g, cx, cy, (255, 245, 190))
    P(g, cx + 1, cy, yl); P(g, cx, cy + 1, yl)


TAILS = [
    _n("Normal", "common", None),
    _n("Coin Tail", "rare", _t_coin),
    _n("Flame Tail", "epic", _t_flame),
    _n("Lightning Tail", "epic", _t_lightning),
    _n("Star Tail", "rare", _t_star),
]


SPARKLE_SPOTS = [(3, 5), (28, 4), (2, 16), (29, 14), (4, 28), (28, 27), (16, 2), (2, 24)]


def _fx_sparkles(ctx):
    fg, rng = ctx["fg"], ctx["rng"]
    for x, y in rng.sample(SPARKLE_SPOTS, 5):
        P(fg, x, y, WHITE)
        P(fg, x - 1, y, (255, 240, 170)); P(fg, x + 1, y, (255, 240, 170))
        P(fg, x, y - 1, (255, 240, 170)); P(fg, x, y + 1, (255, 240, 170))


def _fx_coin_rain(ctx):
    fg, rng = ctx["fg"], ctx["rng"]
    spots = [(3, 3), (27, 2), (1, 12), (29, 10), (3, 21), (29, 22), (13, 1), (20, 29)]
    for x, y in rng.sample(spots, 6):
        R(fg, x, y, x + 1, y + 1, GOLD)
        P(fg, x, y, (255, 236, 150))


def _fx_stonks(ctx):
    bg = ctx["bg"]
    for t in range(24):
        x = 2 + t
        y = 27 - (t * 22) // 23
        P(bg, x, y, GREEN)
        P(bg, x, y + 1, DGREEN)
    P(bg, 27, 2, GREEN); P(bg, 26, 3, GREEN); P(bg, 27, 3, GREEN)
    P(bg, 25, 4, GREEN); P(bg, 27, 4, GREEN)


def _fx_aura(ctx):
    bg, cat = ctx["bg"], ctx["cat"]
    m = mask_of(cat)
    d = dilate(m)
    glow = (255, 138, 138)
    for y in range(SIZE):
        for x in range(SIZE):
            if d[y][x] and not m[y][x]:
                P(bg, x, y, glow)


def _fx_moon(ctx):
    bg, fg = ctx["bg"], ctx["fg"]
    pale = (238, 238, 224)
    H(bg, 2, 26, 29, pale)
    R(bg, 25, 3, 30, 6, pale)
    H(bg, 7, 26, 29, pale)
    P(bg, 27, 4, (206, 206, 192)); P(bg, 29, 6, (206, 206, 192))
    V(fg, 3, 6, 8, (222, 226, 234))
    P(fg, 3, 5, RED)
    P(fg, 3, 9, (255, 180, 60)); P(fg, 3, 10, (255, 120, 50))
    P(fg, 2, 12, (200, 206, 212)); P(fg, 1, 14, (184, 190, 198))


def _fx_snowstorm(ctx):
    """Avalanche incoming: red-and-white flurry swirling around the cat."""
    fg, rng = ctx["fg"], ctx["rng"]
    cols = [SNOW, AVAX, ICE, (255, 150, 150), WHITE, (214, 232, 244)]
    spots = [(2, 3), (5, 1), (10, 2), (22, 1), (27, 3), (30, 8), (1, 9), (30, 18),
             (1, 19), (2, 27), (29, 26), (16, 0), (7, 29), (25, 29), (30, 13), (1, 14)]
    for i, (x, y) in enumerate(rng.sample(spots, 12)):
        c = cols[i % len(cols)]
        P(fg, x, y, c)
        if i % 2:
            P(fg, x, y + 1, c)
        else:
            P(fg, x + 1, y, c)


EFFECTS = [
    _n("None", "common", None),
    _n("Sparkles", "uncommon", _fx_sparkles),
    _n("Coin Rain", "rare", _fx_coin_rain),
    _n("Stonks Arrow", "rare", _fx_stonks),
    _n("Avalanche Aura", "epic", _fx_aura),
    _n("To The Moon", "legendary", _fx_moon),
    _n("Snowstorm", "uncommon", _fx_snowstorm),
]


def _bg_fill(bg, c):
    R(bg, 0, 0, SIZE - 1, SIZE - 1, c)


def _bg_frost(ctx):
    bg = ctx["bg"]
    _bg_fill(bg, (206, 232, 242))
    for y in range(SIZE):
        for x in range(SIZE):
            if (x + y) % 7 == 0:
                P(bg, x, y, (226, 244, 250))


def _bg_avax_red(ctx):
    bg = ctx["bg"]
    _bg_fill(bg, AVAX)
    for y in range(SIZE):
        for x in range(SIZE):
            if (x + y) % 8 < 2:
                P(bg, x, y, (244, 96, 96))


def _bg_night(ctx):
    bg, rng = ctx["bg"], ctx["rng"]
    _bg_fill(bg, (44, 34, 72))
    for _ in range(14):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        P(bg, x, y, (238, 238, 250) if rng.random() < 0.7 else (255, 220, 140))


def _bg_sky(ctx):
    bg = ctx["bg"]
    _bg_fill(bg, (148, 204, 240))
    for ox, oy in ((3, 4), (20, 7), (10, 25)):
        H(bg, oy, ox + 1, ox + 6, WHITE)
        H(bg, oy + 1, ox, ox + 7, WHITE)


def _bg_sunset(ctx):
    bg = ctx["bg"]
    top, bot = (250, 152, 70), (226, 88, 124)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        H(bg, y, 0, SIZE - 1, c)
    H(bg, 3, 13, 18, (255, 224, 140))
    R(bg, 12, 4, 19, 7, (255, 224, 140))
    H(bg, 8, 13, 18, (255, 224, 140))


def _bg_gold(ctx):
    bg = ctx["bg"]
    _bg_fill(bg, (238, 192, 78))
    for y in range(SIZE):
        for x in range(SIZE):
            if (x + y) % 9 < 2:
                P(bg, x, y, (250, 222, 132))


def _candles(ctx, color, wick, rising):
    bg, rng = ctx["bg"], ctx["rng"]
    _bg_fill(bg, (15, 24, 36))
    base = 26 if rising else 6
    for i, x in enumerate(range(2, 30, 4)):
        drift = i * 2 if rising else -i * 2
        top = max(2, min(24, base - drift - rng.randrange(3)))
        bot = min(29, top + 4 + rng.randrange(3))
        V(bg, x, top - 2, bot + 1, wick)
        R(bg, x - 1, top, x + 1, bot, color)


def _bg_candles_up(ctx):
    _candles(ctx, (36, 168, 88), (24, 88, 52), True)


def _bg_candles_down(ctx):
    _candles(ctx, (204, 64, 70), (110, 40, 44), False)


def _bg_matrix(ctx):
    bg, rng = ctx["bg"], ctx["rng"]
    _bg_fill(bg, (18, 8, 9))
    for x in range(1, 31, 3):
        top = rng.randrange(0, 18)
        ln = rng.randrange(5, 12)
        for y in range(top, min(SIZE, top + ln)):
            P(bg, x, y, (96, 30, 34))
        P(bg, x, min(SIZE - 1, top + ln), (240, 96, 100))


def _bg_moon_night(ctx):
    bg, rng = ctx["bg"], ctx["rng"]
    _bg_fill(bg, (18, 24, 48))
    H(bg, 2, 23, 27, (240, 240, 224))
    R(bg, 22, 3, 28, 7, (240, 240, 224))
    H(bg, 8, 23, 27, (240, 240, 224))
    P(bg, 24, 4, (210, 210, 196)); P(bg, 26, 6, (210, 210, 196))
    for _ in range(8):
        P(bg, rng.randrange(SIZE), rng.randrange(SIZE), (226, 230, 244))


def _bg_money_rain(ctx):
    bg, rng = ctx["bg"], ctx["rng"]
    _bg_fill(bg, (24, 58, 48))
    for _ in range(9):
        x, y = rng.randrange(2, 30), rng.randrange(2, 30)
        gl = (44, 96, 76)
        P(bg, x, y - 1, gl); H(bg, y, x - 1, x + 1, gl); P(bg, x, y + 1, gl)


def _bg_vaporwave(ctx):
    bg = ctx["bg"]
    top, bot = (88, 50, 140), (238, 108, 178)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        H(bg, y, 0, SIZE - 1, c)
    H(bg, 19, 0, SIZE - 1, (255, 170, 220))
    for y in (23, 27, 31):
        H(bg, y, 0, SIZE - 1, (255, 150, 210))
    for x in (2, 9, 16, 23, 30):
        V(bg, x, 20, 31, (255, 150, 210))


def _bg_snowfall(ctx):
    """AVAX-red ground with a flurry of little white snowflakes."""
    bg = ctx["bg"]
    _bg_fill(bg, (216, 48, 52))
    wq, pale = SNOW, (255, 170, 170)
    for x, y in ((2, 3), (27, 2), (1, 13), (28, 12), (2, 24), (28, 24), (15, 0)):
        P(bg, x, y - 1, wq)
        H(bg, y, x - 1, x + 1, wq)
        P(bg, x, y + 1, wq)
        P(bg, x, y, pale)


BACKGROUNDS = [
    _n("Frost", "common", _bg_frost),
    _n("Avalanche Red", "uncommon", _bg_avax_red),
    _n("Night Purple", "common", _bg_night),
    _n("Sky", "common", _bg_sky),
    _n("Sunset", "uncommon", _bg_sunset),
    _n("Solid Gold", "epic", _bg_gold),
    _n("Green Candles", "rare", _bg_candles_up),
    _n("Red Candles", "rare", _bg_candles_down),
    _n("Subnet Matrix", "epic", _bg_matrix),
    _n("Moon Night", "uncommon", _bg_moon_night),
    _n("Money Rain", "rare", _bg_money_rain),
    _n("Vaporwave", "epic", _bg_vaporwave),
    _n("Snowfall Red", "epic", _bg_snowfall),
]


FUR_TRAITS = [_n(f["name"], f["tier"], None) for f in FURS]

CATEGORIES = [
    ("Background", BACKGROUNDS),
    ("Fur", FUR_TRAITS),
    ("Body", BODIES),
    ("Head", HEADS),
    ("Ears", EARS),
    ("Mane", MANES),
    ("Whiskers", WHISKERS),
    ("Belly", BELLIES),
    ("Pattern", PATTERNS),
    ("Eyes", EYES),
    ("Mouth", MOUTHS),
    ("Headwear", HEADWEAR),
    ("Eyewear", EYEWEAR),
    ("Outfit", OUTFITS),
    ("Paw Item", PAW_ITEMS),
    ("Earring", EARRINGS),
    ("Tail", TAILS),
    ("Effect", EFFECTS),
]

FUR_BY_NAME = {f["name"]: f for f in FURS}


_NONE_W = {"Headwear": 200, "Eyewear": 260, "Outfit": 280,
           "Paw Item": 260, "Earring": 320, "Effect": 220}
for _cat, _ts in CATEGORIES:
    if _cat in _NONE_W:
        for _t in _ts:
            if _t["name"] == "None":
                _t["w"] = _NONE_W[_cat]


SPECIAL_EYES = {"Laser Eyes", "Dollar Signs", "Diamond Eyes", "Hypno",
                "Heart Eyes", "Candle Eyes", "Cyborg"}
