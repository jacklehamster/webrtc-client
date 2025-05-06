// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { firebaseWrappedServer } from "@dobuki/firebase-store";
import { Connector } from "@dobuki/webrtc-client";

const url = new URL(location.href);
const room = url.searchParams.get("room") ?? "sample";
const host = url.searchParams.get("host") ?? undefined;
const connector = new Connector({
  kvStore: firebaseWrappedServer("https://firebase.dobuki.net"),
  room,
  host,
});

const data = {};
const {processor, setData} = connector.createProcessor(data);

const button = document.body.appendChild(document.createElement("button"));
button.textContent = "Click";
button.addEventListener("click", () =>   setData("test", Date.now()));

const div = document.body.appendChild(document.createElement("div"));
div.style.whiteSpace = "pre";
processor.observe(`test`).onChange((value) => {
  div.textContent = value;
});

if (!host) {
  connector.getQRCode().then(({code, url}) => {
    const qr = document.querySelector<HTMLImageElement>("#qr-code");
    if (qr) {
      qr.src = code;
      qr.style.display = "";
    }
    const link = document.querySelector<HTMLLinkElement>("#qr-link");
    if (link) {
      link.href = url;
    }
  });  
  (window as any).connector = connector;  
}

addEventListener("unload", () => {
  connector.destroy();
});

(window as any).data = data;
