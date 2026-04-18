import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient } from "@tanstack/react-query";

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

export const queryClient = new QueryClient();
