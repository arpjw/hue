export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

const VELA_WS_URL = "wss://vela-engine.fly.dev/ws";

export class VelaWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1_000;
  private readonly maxReconnectDelay = 30_000;
  private destroyed = false;
  private currentStatus: WsStatus = "disconnected";

  constructor(
    private readonly onMessage: (data: unknown) => void,
    private readonly onStatusChange: (status: WsStatus) => void,
    private readonly wsUrl: string = VELA_WS_URL
  ) {}

  connect(): void {
    if (this.destroyed) return;
    this.setStatus("connecting");
    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch {
      this.setStatus("error");
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1_000;
      this.setStatus("connected");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as unknown;
        this.onMessage(data);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onerror = () => {
      this.setStatus("error");
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (!this.destroyed) {
        this.setStatus("disconnected");
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.destroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  reconnect(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.destroyed = false;
    this.connect();
  }

  private setStatus(s: WsStatus): void {
    if (this.currentStatus !== s) {
      this.currentStatus = s;
      this.onStatusChange(s);
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
