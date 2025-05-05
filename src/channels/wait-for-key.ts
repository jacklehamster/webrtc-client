import { KeyValueStore } from "@dobuki/firebase-store";

export function waitForKey(key: string, kvStore: KeyValueStore, maxWait?: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(async () => {
      const value = await kvStore.getValue(key);
      if (value || (maxWait && Date.now() - start >= maxWait)) {
        clearInterval(interval);
        if (value) {
          resolve(value);
        } else {
          reject("Timeout");
        }
      }
    }, 1000);
  });
}
