class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    registerTool(tool) {
        if (!tool.name || !tool.description || !tool.execute) {
            throw new Error(
                'Tool must have name, description, and execute function'
            );
        }
        this.tools.set(tool.name, tool);
    }

    getTool(name) {
        return this.tools.get(name);
    }

    getAllTools() {
        return Array.from(this.tools.values());
    }

    getToolsForOpenAI() {
        return Array.from(this.tools.values()).map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters || {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        }));
    }

    async executeTool(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        return await tool.execute(args);
    }
}

export const toolRegistry = new ToolRegistry();
