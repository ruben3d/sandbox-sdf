/*
/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

const ctx = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<string>) => {
    console.log(`Received: ${e.data}`);

    ctx.postMessage('Pong!');
};

export { };
*/