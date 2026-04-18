"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface ConnectButtonProps {
  className?: string;
  connectedClassName?: string;
}

export default function ConnectButton({ className, connectedClassName }: ConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <button
        onClick={() => disconnect()}
        className={
          connectedClassName ??
          "flex items-center gap-2 px-5 py-2.5 rounded-full bg-hue-text text-white text-sm font-medium hover:bg-hue-text/85 transition-colors"
        }
      >
        <span className="w-2 h-2 rounded-full bg-hue-dsage inline-block" />
        {truncated}
      </button>
    );
  }

  return (
    <button
      onClick={openConnectModal}
      className={
        className ??
        "px-5 py-2.5 rounded-full bg-hue-text text-white text-sm font-medium hover:bg-hue-text/85 transition-colors"
      }
    >
      Connect Wallet
    </button>
  );
}
