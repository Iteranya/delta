const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

class AIResponder {
    constructor({
        configPath = 'config.json',
        knowledgeDir = './knowledge',
        onLog = () => {}
    } = {}) {
        this.configPath = configPath;
        this.knowledgeDir = knowledgeDir;
        this.onLog = onLog;

        this.config = this.loadConfig();

        this.openai = new OpenAI({
            baseURL: this.config.ai?.endpoint || 'https://openrouter.ai/api/v1',
            apiKey: this.config.ai?.key || 'dummy-key',
        });
    }

    // --- CONFIG MANAGEMENT ---

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

                // Backward compatibility
                if (!config.ai) {
                    config.ai = {
                        endpoint: "https://openrouter.ai/api/v1",
                        key: config.apiKey || process.env.OPENROUTER_API || '',
                        model: "google/gemini-2.0-flash-exp:free",
                        systemPrompt: config.instruction || "You are a helpful assistant."
                    };
                    this.saveConfig(config); // Upgrade config
                }

                return config;
            } else {
                const defaultConfig = {
                    ai: {
                        endpoint: "https://openrouter.ai/api/v1",
                        key: process.env.OPENROUTER_API || '',
                        model: "google/gemini-2.0-flash-exp:free",
                        systemPrompt: "You are a tsundere cat girl, nyaa~!"
                    }
                };
                this.saveConfig(defaultConfig);
                return defaultConfig;
            }
        } catch (err) {
            this.onLog(`Config load error: ${err.message}`);
            return { ai: {} };
        }
    }

    saveConfig(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            this.config = config;
            this.openai.apiKey = config.ai.key;
            this.openai.baseURL = config.ai.endpoint;
            this.onLog('Config saved successfully');
        } catch (err) {
            this.onLog(`Config save error: ${err.message}`);
        }
    }

    updateConfig(updates = {}) {
        const merged = {
            ...this.config,
            ai: {
                ...this.config.ai,
                ...updates
            }
        };
        this.saveConfig(merged);
    }

    getConfig() {
        return this.config;
    }

    // --- AI RESPONSE LOGIC ---

    loadKnowledge() {
        let context = '';
        try {
            const files = fs.readdirSync(this.knowledgeDir);
            for (const file of files) {
                if (file.endsWith('.txt')) {
                    const filePath = path.join(this.knowledgeDir, file);
                    context += fs.readFileSync(filePath, 'utf8') + '\n\n';
                }
            }
        } catch (err) {
            this.onLog(`Knowledge load error: ${err.message}`);
        }
        return context;
    }

    async respondTo(message, history) {
        const { systemPrompt, model } = this.config.ai;
        const jobContext = this.loadKnowledge();
        const systemMessage = `${systemPrompt}\n\nAvailable job listings:\n${jobContext}`;

        const messages = [
            { role: "system", content: systemMessage },
            ...history
        ];

        try {
            const completion = await this.openai.chat.completions.create({
                model: model,
                messages: messages,
            });

            return completion.choices[0].message.content;
        } catch (err) {
            this.onLog(`AI Error: ${err.message}`);
            return "Oops! My AI brain just stubbed its toe on a logic brick 🧱💥";
        }
    }
}

module.exports = AIResponder;
