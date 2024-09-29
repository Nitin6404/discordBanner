const { Client, GatewayIntentBits } = require('discord.js');
const { Index } = require('@upstash/vector');
require('dotenv').config();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// console.log(process.env.DISCORD_TOKEN);

// Initialize the vector index
const index = new Index({
    url: process.env.VECTOR_URL,
    token: process.env.VECTOR_TOKEN,
});


// Toxicity check function
async function checkToxicity(messageContent) {
    const WORDS_THRESHOLD = 0.86; // Adjust threshold based on your needs

    // Split the message into words
    const words = messageContent.split(/\s+/);
    const results = await Promise.all(
        words.map(async (word) => {
            const [result] = await index.query({
                topK: 1,
                data: word,
                includeMetadata: true,
            });
            return result;
        })
    );

    // Check if any words are toxic
    const flaggedWords = results.filter((result) => result && result.score > WORDS_THRESHOLD);
    return flaggedWords.length > 0 ? flaggedWords : null;
}

// When the client is ready, run this code (once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for messages
client.on('messageCreate', async message => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;

    // Check for toxicity
    const toxicityResults = await checkToxicity(message.content);

    // Check for specific keywords and reply
    if (message.content.includes('hello')) {
        message.reply('Hello! How can I help you today?');
        console.log('Hello detected');
    } else if (message.content.includes('bye')) {
        message.reply('Goodbye! Have a great day!');
        console.log('Bye detected');
    } else if (message.content.includes('fuck you')) {
        message.reply('These words are not allowedd in this server');
        console.log('Fuck You detected!!!! BAN NEED TO GIVEN')
    }

    if (toxicityResults) {
        message.reply('This message may contain toxic content.');
    }
});

// Log in to Discord with your app's token
client.login(process.env.DISCORD_TOKEN);
