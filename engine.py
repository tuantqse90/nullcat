"""Pixel engine for the AvaxCats collection (Team Avalanche - Team1 VN).

Pure-stdlib: 32x32 RGB grids ("layers") with None = transparent,
composited and written out as PNG via zlib/struct. No Pillow needed.
"""

import struct
import zlib

# ❓ Tại sao mọi con mèo đều đúng 32x32 pixel?
# → SIZE là cạnh của grid vuông; mọi hàm vẽ, mask và PNG header đều dùng hằng số này.
# → Đổi số này là toàn bộ toạ độ cứng trong traits.py (mắt ở x=10, đầu ở y=4…) lệch hết.
SIZE = 32


def new_grid():
    # ❓ Grid (layer) là gì và tại sao khởi tạo bằng None chứ không phải màu đen?
    # → Một layer = list 32 hàng, mỗi hàng 32 ô; ô chứa tuple (r,g,b) hoặc None = trong suốt.
    # → Nhờ None mà khi chồng layer, ô chưa vẽ sẽ để lộ layer bên dưới (compositing).
    return [[None] * SIZE for _ in range(SIZE)]


def P(g, x, y, c):
    """Set one pixel (silently clipped at edges)."""
    # ❓ Tại sao không báo lỗi khi vẽ ra ngoài lưới 32x32?
    # → Nhiều trait (đuôi, tia laser, mũ) cố tình vẽ tràn mép; bỏ qua lặng lẽ giúp hàm vẽ
    # → ngắn gọn thay vì phải kiểm tra biên ở mọi nơi. Bỏ dòng này sẽ gây IndexError.
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
            # ❓ Ghép layer (compositing) hoạt động thế nào?
            # → Chỉ chép pixel của layer trên khi nó khác None; pixel trong suốt giữ nguyên nền.
            # → Đây là cách thân, mắt, mũ... chồng lên nhau theo đúng thứ tự vẽ.
            if top[y][x] is not None:
                base[y][x] = top[y][x]


# ❓ Mask là gì và dùng để làm gì?
# → Chuyển grid thành ma trận True/False: True ở nơi đã có pixel (silhouette).
# → generate.py lấy mask của thân mèo để cắt (clip) họa tiết bụng/outfit không tràn ra ngoài thân.
def mask_of(g):
    return [[g[y][x] is not None for x in range(SIZE)] for y in range(SIZE)]


def dilate(mask):
    out = [[False] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            if mask[y][x]:
                # ❓ dilate làm gì với mask?
                # → "Nở" mask ra 1 pixel theo 4 hướng (trên/dưới/trái/phải). Gọi 3 lần = nở 3 pixel,
                # → đủ chỗ cho áo/khăn chờm ra ngoài thân một chút mà vẫn không bay lung tung.
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
    # ❓ Một PNG chunk gồm những gì, và CRC để làm gì?
    # → Format PNG: [độ dài data, 4 byte big-endian][tag 4 chữ][data][CRC32 của tag+data].
    # → Trình xem ảnh kiểm tra CRC để phát hiện file hỏng; sai CRC thì ảnh không mở được.
    return struct.pack(">I", len(data)) + raw + struct.pack(">I", zlib.crc32(raw) & 0xFFFFFFFF)


def write_png(path, rows):
    """rows: list of scanlines, each a list of (r,g,b) tuples."""
    h = len(rows)
    w = len(rows[0])
    # ❓ Byte 0x00 ở đầu mỗi hàng là gì?
    # → PNG yêu cầu mỗi scanline bắt đầu bằng 1 byte "filter type"; 0 = không lọc.
    # → Sau đó là 3 byte R,G,B cho từng pixel. Thiếu byte này thì dữ liệu lệch 1 byte mỗi hàng và ảnh vỡ.
    raw = b"".join(
        b"\x00" + bytes(ch for px in row for ch in px) for row in rows
    )
    # ❓ Tại sao tự viết PNG encoder thay vì dùng Pillow?
    # → Chỉ cần 3 chunk: IHDR (kích thước, 8 bit/kênh, color type 2 = RGB), IDAT (pixel), IEND.
    # → Toàn bộ dùng stdlib (struct + zlib) nên workshop chạy được mà không cần pip install.
    png = (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        # ❓ zlib nén gì ở đây?
        # → IDAT chứa toàn bộ pixel đã nén bằng DEFLATE (zlib), mức 9 = nén mạnh nhất.
        # → PNG bắt buộc phải nén: trình xem ảnh luôn giải nén IDAT bằng zlib, nên không thể bỏ bước này.
        + _chunk(b"IDAT", zlib.compress(raw, 9))
        + _chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)


def upscale(rows, k):
    out = []
    # ❓ Làm sao phóng ảnh 32px lên 512px mà không bị mờ?
    # → Nearest-neighbour: mỗi pixel lặp k lần theo chiều ngang, rồi cả hàng lặp k lần theo chiều dọc.
    # → Không nội suy màu nên giữ nguyên nét pixel-art.
    for row in rows:
        big = []
        for px in row:
            big.extend([px] * k)
        out.extend([big] * k)
    return out


def grid_to_rows(g, fallback=(20, 20, 26)):
    # ❓ fallback dùng khi nào?
    # → PNG RGB ở đây không có kênh alpha, nên ô None (trong suốt) phải đổi thành một màu thật.
    # → Thực tế Background luôn phủ kín 32x32 nên hiếm khi thấy màu xám này.
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
