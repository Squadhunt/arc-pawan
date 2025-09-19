// Connection Manager for maintaining stable connections
export class ConnectionManager {
  private static instance: ConnectionManager;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 10000;
  private isReconnecting = false;

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public async checkConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  public async waitForConnection(url: string, maxWaitTime = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const isConnected = await this.checkConnection(url);
      if (isConnected) {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  public async reconnectWithBackoff(url: string): Promise<boolean> {
    if (this.isReconnecting) {
      return false;
    }

    this.isReconnecting = true;
    
    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );
      
      console.log(`Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isConnected = await this.checkConnection(url);
      if (isConnected) {
        console.log('Connection restored successfully');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        return true;
      }
      
      this.reconnectAttempts++;
    }
    
    console.error('Max reconnection attempts reached');
    this.isReconnecting = false;
    return false;
  }

  public reset() {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
}

export const connectionManager = ConnectionManager.getInstance();
