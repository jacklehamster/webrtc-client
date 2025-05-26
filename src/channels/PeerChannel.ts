import { KeyValueStore } from "@dobuki/firebase-store";
import { Connector } from "@/Connector";
import { waitForKey } from "./wait-for-key";

const RTCCONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

const DATA_CHANNEL_LABEL = "data";

export class PeerChannel {
  private dataChannel?: RTCDataChannel;
  private readonly connection = new RTCPeerConnection(RTCCONFIG);
  private readonly keysSet: Set<string> = new Set();

  constructor(private connector: Connector, private kvStore: KeyValueStore) {
    this.connection.addEventListener("connectionstatechange", () => {
      if (this.connection.connectionState === "failed") {
        console.warn("Connection failed");
      }
    });
  }

  async #setKey(key: string, value: any) {
    this.keysSet.add(key);
    this.kvStore.setKeyValue(key, value);
  }

  #deleteKey(key: string) {
    this.keysSet.delete(key);
    this.kvStore.deleteKey(key);
  }

  async #handleIceCandidates(peer: string) {
    const iceCandidates: RTCIceCandidate[] = [];
    this.connection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      } else {
        //  ice candidate gathering is done
        await this.#setKey(`${this.room}_${peer}_ice_from_${this.connector.uid}`, iceCandidates);
      }
    });

    this.connection.addEventListener("iceconnectionstatechange", () => {
      if (this.connection.iceConnectionState === "failed") {
        console.warn("ICE connection failed");
      }
    });
  }

  async #receiveIceCandidates(peer: string) {
    const key: string = `${this.room}_${this.connector.uid}_ice_from_${peer}`;
    const candidates = await waitForKey(key, this.kvStore);
    this.#deleteKey(key);
    await this.addIceCandidates(candidates);
  }

  async makeOffer(peer: string) {
    //  handle ice candidates
    this.#handleIceCandidates(peer);

    //  #1 - Create data channel
    this.dataChannel = this.connection.createDataChannel(DATA_CHANNEL_LABEL);
    this.setupDataChannel(this.dataChannel, peer);

    //  #2 - guest enters a room and make offer
    const offer = await this.createOffer();
    this.#setKey(`${this.room}_${peer}_offer_from_${this.connector.uid}`, offer);

    //  ...

    //  #5 guest receives answer
    const answerKey = `${this.room}_${this.connector.uid}_answer_from_${peer}`;
    const answer = await waitForKey(answerKey, this.kvStore);
    this.#deleteKey(answerKey);
    await this.connection.setRemoteDescription(new RTCSessionDescription(answer));

    //  Receive ice candidates
    this.#receiveIceCandidates(peer);
  }

  private get room() {
    return this.connector.room;
  }

  async acceptOffer(peer: string, offerPassed?: any) {
    // Listen for offerer's data channel (for answerer)
    this.connection.addEventListener("datachannel", (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel, peer);
    });

    //  handle ice candidates
    this.#handleIceCandidates(peer);

    //  #3 - host accept offer
    const offerKey = `${this.room}_${this.connector.uid}_offer_from_${peer}`;
    const offer = offerPassed ?? await this.kvStore.getValue(offerKey);
    this.#deleteKey(offerKey);
    await this.connection.setRemoteDescription(new RTCSessionDescription(offer));

    //  Receive ice candidates
    this.#receiveIceCandidates(peer);

    //  #4 - provide answer
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    await this.#setKey(`${this.room}_${peer}_answer_from_${this.connector.uid}`, answer);
  }

  private async createOffer() {
    try {
      const offer = await this.connection.createOffer();
      await this.connection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private async addIceCandidates(candidates: RTCIceCandidate[]) {
    candidates.forEach(candidate => this.connection.addIceCandidate(candidate));
  }

  sendData(blob: Blob) {
    if (this.dataChannel?.readyState === "open") {
      try {
        this.dataChannel.send(blob);
      } catch (error) {
        this.connector.onError.forEach(callback => callback(error));
      }
    } else {
      requestAnimationFrame(() => this.sendData(blob));
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peer: string) {
    const onError = (error: any) => {
      console.error("Data channel error:", error);
      this.connector.onError.forEach(callback => callback(error));
    }
    const onMessage = (event: MessageEvent) => {
      const data = event.data instanceof ArrayBuffer ? new Blob([event.data]) : event.data;
      this.connector.receiveData(data);
    };

    dataChannel.addEventListener("open", () => {
      dataChannel.send(JSON.stringify({ hello: `Hello from ${this.connector.uid}` }));
      this.connector.onNewClient.forEach(callback => callback(peer));
    });
    dataChannel.addEventListener("message", onMessage);
    dataChannel.addEventListener("closing", () => {
      console.log("Data channel closing");
      this.dataChannel?.removeEventListener("error", onError);
      this.dataChannel = undefined;
    });
    dataChannel.addEventListener("close", () => {
      console.log("Data channel closed");
      this.connector.onClosePeer.forEach(callback => callback(peer));
    });
    dataChannel.addEventListener("error", onError);
  }

  destroy() {
    this.dataChannel?.close();
    this.connection.close();
    this.keysSet.forEach(key => this.#deleteKey(key));
  }
}
