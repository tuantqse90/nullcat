"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { activeChain, CHAIN_LABEL } from "@/lib/chains";
import { AVAXCATS_ABI, explorerAddress } from "@/lib/contract";
import { useContractAddress } from "@/lib/deployed";
import {
  Button,
  Card,
  Chapter,
  Hint,
  Icon,
  Input,
  Label,
  Mono,
  Status,
} from "./ui";
import {
  forgetKpi,
  hasKpiEndpoint,
  submitKpi,
  useKpiSubmitted,
  type KpiPayload,
} from "@/lib/kpi";

function normalizeTelegram(v: string) {
  const t = v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^telegram\.me\//i, "")
    .replace(/^@/, "")
    .trim();
  return t ? "@" + t : "";
}

function normalizeX(v: string) {
  const t = v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?(x|twitter)\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "")
    .trim();
  return t ? "@" + t : "";
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </label>
  );
}

export function RegisterPanel() {
  const { address: wallet, isConnected } = useAccount();
  const { address: contract, isConfigured } = useContractAddress();
  const done = useKpiSubmitted();

  const { data: balance } = useReadContract({
    abi: AVAXCATS_ABI,
    address: contract,
    chainId: activeChain.id,
    functionName: "balanceOf",
    args: wallet ? [wallet] : undefined,
    query: { enabled: isConfigured && !!wallet },
  });

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [telegram, setTelegram] = useState("");
  const [x, setX] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const minted = Number(balance ?? 0n);
  const canSend =
    isConnected &&
    name.trim() !== "" &&
    contact.trim() !== "" &&
    normalizeTelegram(telegram) !== "" &&
    normalizeX(x) !== "" &&
    !sending;

  async function send() {
    setSending(true);
    setResult(null);
    setFailed(false);
    const payload: KpiPayload = {
      name: name.trim(),
      contact: contact.trim(),
      telegram: normalizeTelegram(telegram),
      x: normalizeX(x),
      wallet: wallet ?? "",
      contract,
      l1: "",
      chain: CHAIN_LABEL,
      chainId: activeChain.id,
      minted,
      at: new Date().toISOString(),
    };
    const r = await submitKpi(payload);
    setSending(false);
    if (r.ok) {
      setResult(
        r.confirmed
          ? "Đã gửi, server xác nhận đã nhận."
          : "Đã gửi. Trình duyệt không đọc được phản hồi (Apps Script chặn CORS) — kiểm tra Google Sheet xem đã có dòng mới chưa.",
      );
    } else {
      setFailed(true);
      setResult(`Gửi thất bại: ${r.reason}`);
    }
  }

  if (done) {
    return (
      <section className="anim-rise">
        <Chapter n="03" label="Đăng ký" title="Đã ghi nhận" />
        <Card className="p-5 md:p-6">
          {done.confirmed ? (
            <Status tone="ok">Đã gửi, server xác nhận đã nhận.</Status>
          ) : (
            <Status tone="warn">
              Đã gửi đi, nhưng trình duyệt không đọc được phản hồi (Apps Script
              chặn CORS) nên không chắc chắn — mở Google Sheet kiểm tra, chưa có
              dòng mới thì gửi lại.
            </Status>
          )}

          <dl className="mt-6 border-t border-line">
            {[
              ["Tên", done.name],
              ["Gmail (Builder Hub)", done.contact],
              ["Telegram", done.telegram],
              ["Account X", done.x],
              ["Ví", done.wallet],
              ["Contract", done.contract],
              ...(done.l1 ? [["L1", done.l1]] : []),
              ["NFT đã mint", String(done.minted)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid gap-x-8 gap-y-1 border-b border-line py-3 sm:grid-cols-[12rem_1fr]"
              >
                <dt className="eyebrow self-center text-muted">{k}</dt>
                <dd className="min-w-0">
                  <Mono className="text-fg">{v}</Mono>
                </dd>
              </div>
            ))}
          </dl>

          <Button className="mt-6" onClick={forgetKpi}>
            Sửa lại / gửi lần nữa
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="anim-rise">
      <Chapter
        n="03"
        label="Đăng ký"
        title="Đăng ký hoàn thành"
        desc="Điền để ban tổ chức ghi nhận bạn đã hoàn thành bài. Contract và ví lấy tự động từ bước 1–2."
      />

      <Card className="p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Gmail" hint="Gmail ĐÃ đăng ký Builder Hub">
            <Input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="ban@gmail.com"
            />
          </Field>

          <Field label="Tên">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </Field>

          <Field label="Telegram" hint="@handle, t.me/handle hay handle trơn đều được">
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@tenban"
            />
          </Field>

          <Field label="Account X (Twitter)" hint="@handle hay link x.com đều được">
            <Input
              value={x}
              onChange={(e) => setX(e.target.value)}
              placeholder="@tenban"
            />
          </Field>

          <Field label="Contract đã deploy" hint="Tự điền từ bước 1">
            <Input value={contract} readOnly />
          </Field>

          <Field label="Ví của bạn" hint="Tự điền từ ví đang kết nối">
            <Input value={wallet ?? "chưa kết nối ví"} readOnly />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" disabled={!canSend} onClick={send}>
            {sending ? "Đang gửi" : "Gửi đăng ký"}
          </Button>
          {failed && <Button onClick={send}>Thử lại</Button>}
        </div>

        <div className="mt-4 space-y-1.5">
          {result && <Status tone={failed ? "err" : "ok"}>{result}</Status>}
          {!isConnected && <Status tone="warn">Kết nối ví trước đã.</Status>}
          {!hasKpiEndpoint && (
            <Status tone="warn">
              Chưa cấu hình{" "}
              <code className="font-mono text-[12.5px]">NEXT_PUBLIC_KPI_ENDPOINT</code>{" "}
              — form sẽ không gửi đi đâu được. Xem README mục &quot;Thu thập KPI&quot;.
            </Status>
          )}
          <p className="text-xs leading-5 text-muted">
            Gửi đi: tên · Gmail (Builder Hub) · Telegram · Account X · địa chỉ ví ·
            địa chỉ contract · mạng · số NFT đã mint ({minted}).
          </p>
          {isConfigured && explorerAddress(contract) && (
            <a
              className="eyebrow inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
              href={explorerAddress(contract)!}
              target="_blank"
              rel="noreferrer"
            >
              Xem contract trên Snowtrace
              <Icon name="external" className="size-3" />
            </a>
          )}
        </div>
      </Card>
    </section>
  );
}
