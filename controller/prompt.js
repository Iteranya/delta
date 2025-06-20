

async function createMessagePrompt(message, clientId){
    client = getClientSetting(clientId)
    history = convertMessagesToChatArray(message)
        
}


async function convertMessagesToChatArray(message) {
    const chat = await message.getChat();
    const allMessages = await chat.fetchMessages({ limit: Infinity });
    return allMessages.map(msg => ({
        role: msg.fromMe ? 'assistant' : 'user',
        content: msg.body
    }));
}

async function getClientSetting(clientId){

}