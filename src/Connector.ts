import { firebaseWrappedServer, KeyValueStore } from "@dobuki/firebase-store";
import QRCode from "qrcode";
import { PeerChannel } from "./channels/PeerChannel";
import { CommInterface, createProcessor, Data } from "napl";

export interface Config {
  uid?: string;
  makeUrl?: () => string;
  firebaseServer?: string;
  kvStore?: KeyValueStore;
  room: string;
  host?: string;
  maxUsers?: number;
}

export class Connector {
  readonly uid: string;
  readonly room: string;
  private readonly kvStore: KeyValueStore;
  private readonly makeUrl: () => string;
  private readonly channels: Map<string, PeerChannel> = new Map();
  private readonly onData: Set<(data: any) => void> = new Set();
  readonly onClosePeer: Set<(peer: string) => void> = new Set();
  readonly onNewClient: Set<(peer: string) => void> = new Set();
  readonly onError: Set<(error: any) => void> = new Set();
  readonly onDestroy: Set<() => void> = new Set();
  maxUsers: number;

  constructor({
    uid = crypto.randomUUID(), makeUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("room", this.room);
      url.searchParams.set("host", this.uid);
      return url.toString();
    }, kvStore, firebaseServer, room, host,
    maxUsers = Number.MAX_SAFE_INTEGER,
  }: Config) {
    this.kvStore = kvStore ?? firebaseWrappedServer(firebaseServer ?? "");
    this.makeUrl = makeUrl;
    this.uid = uid;
    this.room = room;
    this.maxUsers = maxUsers;

    this.kvStore.checkBeaconFailures();
    if (host) {
      this.makeOffer(host);
    } else {
      this.enableClientReceiver();
    }
  }

  private enableClientReceiver() {
    const interval = setInterval(async () => {
      await this.checkClients();
      if (this.channels.size >= this.maxUsers) {
        clearInterval(interval);
      }
    }, 1000);
  }

  private async makeOffer(host: string) {
    if (this.channels.has(host) || this.channels.size >= this.maxUsers) {
      return;
    }
    const channel = new PeerChannel(this, this.kvStore);
    this.channels.set(host, channel);
    await channel.makeOffer(host);
  }

  private async acceptOffer(peer: string, offer?: any) {
    if (this.channels.has(peer) || this.channels.size >= this.maxUsers) {
      return;
    }
    const channel = new PeerChannel(this, this.kvStore);
    this.channels.set(peer, channel);
    await channel.acceptOffer(peer, offer);
  }

  receiveData(data: any) {
    this.onData.forEach(callback => callback(data));
  }

  addDataListener(callback: (data: any) => void) {
    this.onData.add(callback);
  }

  addCloseListener(callback: (peer: string) => void) {
    this.onClosePeer.add(callback);
  }

  addOnError(callback: (error: any) => void) {
    this.onError.add(callback);
  }

  addOnNewClient(callback: (peer: string) => void) {
    this.onNewClient.add(callback);
  }

  addOnDestroy(callback: () => void) {
    this.onDestroy.add(callback);
  }

  async checkClients() {
    const entries = Object.entries(await this.kvStore.list());
    entries.filter(([key]) => {
      return key.startsWith(`${this.room}_${this.uid}_offer_from_`);
    }).forEach(async ([key, offer]) => {
      const [, peer] = key.split(`${this.room}_${this.uid}_offer_from_`);
      if (peer?.length) {
        await this.acceptOffer(peer, offer);
      }
    });
  }

  sendData(blob: Blob, peer?: string) {
    if (!peer) {
      this.channels.keys().forEach(peer => this.sendData(blob, peer));
    } else {
      this.channels.get(peer)?.sendData(blob);
    }
  }

  async getQRCode(): Promise<{ code: string; url: string }> {
    const { code, url } = await new Promise<{ code: string; url: string }>((resolve, reject) => {
      const url = this.makeUrl();
      QRCode.toDataURL(url, (err, code) => {
        if (err) {
          reject(err);
        } else {
          resolve({ code, url });
        }
      });
    });
    return { code, url };
  }

  createProcessor(
    root: Data = {},
    properties: Record<string, any> = {}
  ) {
    const self = this;
    const com: CommInterface = {
      send: function (data: Blob, peer?: string): void {
        self.sendData(data, peer);
      },
      onMessage: function (listener: (data: any) => void): void {
        self.addDataListener(listener);
      },
      onNewClient: function (listener: (peer: string) => void): void {
        self.addOnNewClient(listener);
      },
      close: function (): void {
        self.destroy();
      }
    };
    return createProcessor(com, root, properties);
  }

  destroy() {
    this.channels.forEach(channel => channel.destroy());
    this.onDestroy.forEach(callback => callback());
  }
}
