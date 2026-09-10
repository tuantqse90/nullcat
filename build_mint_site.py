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
    for fn in sorted(os.listdir(meta_dir)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(meta_dir, fn)) as f:
            m = json.load(f)
        idx = fn[:-5]
        with open(os.path.join(OUT, "thumbs", idx + ".png"), "rb") as f:
            img = base64.b64encode(f.read()).decode()
        cats.append({
            "name": m["name"],
            "image": "data:image/png;base64," + img,
            "attributes": m["attributes"],
        })

    data = json.dumps(cats, ensure_ascii=True)

    os.makedirs(SITE, exist_ok=True)
    path = os.path.join(SITE, "cats.js")
    with open(path, "w") as f:
        f.write("const CATS = " + data + ";\n")
    print(f"built {path} ({os.path.getsize(path) // 1024} KB, {len(cats)} cats)")

    ts_dir = os.path.join("mint-dapp", "src", "lib")
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
