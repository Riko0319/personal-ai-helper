import { toolRegistry } from './toolRegistry.js';
import { exportToExcel, parseTableData } from './tools/excelTool.js';

toolRegistry.registerTool(exportToExcel);
toolRegistry.registerTool(parseTableData);

export class Agent {
    constructor(apiConfig) {
        this.apiConfig = apiConfig;
        this.messages = [];
    }

    setMessages(messages) {
        this.messages = messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    async processUserMessage(userMessage) {
        this.messages.push({
            role: 'user',
            content: userMessage
        });

        let response = await this.callAPI();
        let finalResponse = response;

        while (response.choices[0].message.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;
            
            this.messages.push({
                role: 'assistant',
                content: response.choices[0].message.content,
                tool_calls: toolCalls
            });

            for (const toolCall of toolCalls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);
                
                const toolResult = await toolRegistry.executeTool(toolName, toolArgs);
                
                this.messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }

            response = await this.callAPI();
            finalResponse = response;
        }

        return finalResponse.choices[0].message.content;
    }

    async callAPI() {
        const response = await fetch(`${this.apiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: this.apiConfig.model,
                messages: this.messages,
                tools: toolRegistry.getToolsForOpenAI(),
                tool_choice: 'auto',
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        return await response.json();
    }
}

export { toolRegistry };
