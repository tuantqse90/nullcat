"""Pixel engine for the AvaxCats collection (Team Avalanche - Team1 VN).

Pure-stdlib: 32x32 RGB grids ("layers") with None = transparent,
composited and written out as PNG via zlib/struct. No Pillow needed.
"""

import struct
import zlib

SIZE = 32


def new_grid():
    return [[None] * SIZE for _ in range(SIZE)]


def P(g, x, y, c):
    """Set one pixel (silently clipped at edges)."""
    if 0 <= x < SIZE and 0 <= y < SIZE:
        g[y][x] = c


def H(g, y, x0, x1, c):
    for x in range(x0, x1 + 1):
        P(g, x, y, c)


def V(g, x, y0, y1, c):
    for y in range(y0, y1 + 1):
        P(g, x, y, c)


def R(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        H(g, y, x0, x1, c)


def overlay(base, top):
    for y in range(SIZE):
        for x in range(SIZE):
            if top[y][x] is not None:
                base[y][x] = top[y][x]


def mask_of(g):
    return [[g[y][x] is not None for x in range(SIZE)] for y in range(SIZE)]


def dilate(mask):
    out = [[False] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            if mask[y][x]:
                for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < SIZE and 0 <= ny < SIZE:
                        out[ny][nx] = True
    return out


def darken(c, f=0.72):
    return tuple(max(0, int(v * f)) for v in c)


def lighten(c, f=0.35):
    return tuple(min(255, int(v + (255 - v) * f)) for v in c)


def _chunk(tag, data):
    raw = tag + data
    return struct.pack(">I", len(data)) + raw + struct.pack(">I", zlib.crc32(raw) & 0xFFFFFFFF)


def write_png(path, rows):
    """rows: list of scanlines, each a list of (r,g,b) tuples."""
    h = len(rows)
    w = len(rows[0])
    raw = b"".join(
        b"\x00" + bytes(ch for px in row for ch in px) for row in rows
    )
    png = (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + _chunk(b"IDAT", zlib.compress(raw, 9))
        + _chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)


def upscale(rows, k):
    out = []
    for row in rows:
        big = []
        for px in row:
            big.extend([px] * k)
        out.extend([big] * k)
    return out


def grid_to_rows(g, fallback=(20, 20, 26)):
    return [[(g[y][x] or fallback) for x in range(SIZE)] for y in range(SIZE)]


def save_grid(path, g, scale=1):
    rows = grid_to_rows(g)
    if scale > 1:
        rows = upscale(rows, scale)
    write_png(path, rows)


def contact_sheet(path, grids, cols, scale=6, gap=8, bg=(24, 24, 30)):
    """Lay out many 32x32 grids on one sheet for quick review."""
    import math
    n = len(grids)
    rows_n = math.ceil(n / cols)
    cell = SIZE * scale
    W = cols * cell + (cols + 1) * gap
    Hh = rows_n * cell + (rows_n + 1) * gap
    sheet = [[bg] * W for _ in range(Hh)]
    for i, g in enumerate(grids):
        r, c = divmod(i, cols)
        ox = gap + c * (cell + gap)
        oy = gap + r * (cell + gap)
        img = upscale(grid_to_rows(g), scale)
        for y in range(cell):
            sheet[oy + y][ox:ox + cell] = img[y]
    write_png(path, sheet)
