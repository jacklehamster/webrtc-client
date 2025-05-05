import { CommInterface, SyncClient, Update } from "napl";
import { Connector } from "./Connector";
import { BlobBuilder } from "@dobuki/data-blob";
import { Payload } from "napl";

export function createSyncClient(connector: Connector, root: Record<string, any> = {}) {
  const syncClient = new SyncClient((): CommInterface => {
    connector.addOnNewClient((peer) => {
      const updates: Update[] = [];
      const now = Date.now();
      Object.entries(syncClient.state).forEach(([key, value]) => {
        updates.push({
          path: key,
          value: syncClient.state[value],
          confirmed: now,
        });
      });

      const welcomeBlobBuilder = BlobBuilder.payload<Payload>("payload", {
        myClientId: peer,
        updates,
      });
      connector.sendData(welcomeBlobBuilder.build());
    });
    connector.addCloseListener(peer => {
      syncClient.setData(`clients/${peer}`, undefined, {
        active: true,
        flush: true,
      });
    });

    return {
      send(data) {
        if (data instanceof Blob) {
          connector.sendData(data);
        }
      },
      onMessage(listener) {
        connector.addDataListener(listener);
      },
      onClose(listener) {
        connector.addOnDestroy(listener);
      },
      onError(listener) {
        connector.addOnError(listener);
      },
      close() {
        connector.destroy();
      },
    };
  }, root);
  return syncClient;
}
