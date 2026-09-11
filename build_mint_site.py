"""Embed the generated AvaxCats batch into both mint frontends.

Reads output/metadata/*.json + output/thumbs/*.png and writes:
  mint-site/cats.js           — plain-HTML version (const CATS = [...])
  mint-dapp/src/lib/cats.ts   — Next.js version (typed export)
Each entry: {name, image (data URI), attributes} — the pages build each
tokenURI from this, so no IPFS is needed for the academy demo.

Run after every new generate batch:
  python3 build_mint_site.py
"""

import base64
import json
import os

OUT = "output"
SITE = "mint-site"


def build():
    cats = []
    meta_dir = os.path.join(OUT, "metadata")
    # ❓ Vì sao phải sorted()?
    # → os.listdir trả về thứ tự tuỳ hệ điều hành. sorted đảm bảo 0000.json → 0047.json đúng thứ tự,
    # → nên index trong mảng CATS trùng với tokenId khi mint.
    for fn in sorted(os.listdir(meta_dir)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(meta_dir, fn)) as f:
            m = json.load(f)
        idx = fn[:-5]
        with open(os.path.join(OUT, "thumbs", idx + ".png"), "rb") as f:
            # ❓ base64 là gì và tại sao phải encode ảnh?
            # → PNG là binary; file .js/.ts chỉ chứa text. base64 đổi mỗi 3 byte thành 4 ký tự ASCII (to hơn ~33%)
            # → để nhúng thẳng ảnh vào code. Dùng thumbs 32px nên mỗi con chỉ vài trăm byte.
            img = base64.b64encode(f.read()).decode()
        cats.append({
            "name": m["name"],
            # ❓ data URI là gì?
            # → Chuỗi "data:<mime>;base64,<dữ liệu>" mà trình duyệt hiểu như một URL ảnh.
            # → Đặt vào <img src> hoặc tokenURI là hiển thị ngay, không cần IPFS hay server ảnh cho demo.
            "image": "data:image/png;base64," + img,
            # ❓ Sao chỉ lấy name/image/attributes mà bỏ rarity, seed?
            # → Đây là đúng 3 field marketplace cần theo chuẩn ERC-721 metadata; frontend ghép chúng
            # → thành tokenURI khi mint. Bỏ bớt để cats.js gọn nhất có thể.
            "attributes": m["attributes"],
        })

    # ❓ ensure_ascii=True để làm gì?
    # → Ký tự ngoài ASCII (ví dụ "—" trong tên) được escape thành \uXXXX, nên file .js/.ts
    # → an toàn với mọi encoding và không vỡ khi mở trong editor khác charset.
    data = json.dumps(cats, ensure_ascii=True)

    os.makedirs(SITE, exist_ok=True)
    path = os.path.join(SITE, "cats.js")
    with open(path, "w") as f:
        # ❓ Tại sao ghi thành file .js thay vì .json?
        # → mint-site là HTML tĩnh mở bằng file://, không fetch() được JSON do CORS.
        # → Khai báo const CATS trong <script src="cats.js"> thì trình duyệt nạp được ngay, 48 con đã nằm sẵn trong bộ nhớ.
        f.write("const CATS = " + data + ";\n")
    print(f"built {path} ({os.path.getsize(path) // 1024} KB, {len(cats)} cats)")

    ts_dir = os.path.join("mint-dapp", "src", "lib")
    # ❓ Vì sao phải kiểm tra thư mục mint-dapp tồn tại?
    # → Cùng một data ghi ra 2 frontend: cats.js (HTML thuần) và cats.ts (Next.js, có type Cat).
    # → Nếu ai chỉ clone mint-site thì script vẫn chạy mà không lỗi.
    if os.path.isdir(ts_dir):
        ts_path = os.path.join(ts_dir, "cats.ts")
        with open(ts_path, "w") as f:
            f.write("export type Cat = {\n"
                    "  name: string;\n"
                    "  image: string;\n"
                    "  attributes: { trait_type: string; value: string }[];\n"
                    "};\n\n")
            f.write("export const CATS: Cat[] = " + data + ";\n")
        print(f"built {ts_path} ({os.path.getsize(ts_path) // 1024} KB)")


if __name__ == "__main__":
    build()
