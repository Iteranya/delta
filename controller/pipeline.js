// pipeline.js

const messageQueue = [];
let running = false;

export function enqueueMessage(clientId, message) {
    messageQueue.push({ clientId, message });
}

export function startPipeline() {
    if (running) return;
    running = true;

    console.log(`[Pipeline] Starting message processor...`);
    processLoop();
}

async function processLoop() {
    while (true) {
        if (messageQueue.length === 0) {
            await sleep(100); // No message? Chill briefly
            continue;
        }

        const { clientId, message } = messageQueue.shift();

        try {
            await handleMessage(clientId, message);
        } catch (err) {
            console.error(`[Pipeline] Error handling message from ${clientId}:`, err);
        }
    }
}

async function handleMessage(clientId, message) {
    console.log(`[Pipeline] Message from ${clientId}: ${message.body}`);
    // Nyaaa~
    // Anyway, no fancy discord stuff...
    // Thank Fuck For That

    // Anyway...
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
