"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface OpenDashboardButtonProps {
  className?: string;
}

export default function OpenDashboardButton({ className }: OpenDashboardButtonProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();

  function handleClick() {
    if (isConnected) {
      router.push("/dashboard");
    } else {
      openConnectModal?.();
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      Open Dashboard →
    </button>
  );
}
