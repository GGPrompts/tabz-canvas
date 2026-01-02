#!/usr/bin/env node
/**
 * TabzCanvas MCP Server
 *
 * Provides tools for Claude to spawn and control terminals on the infinite canvas.
 *
 * Tools:
 * - canvas_spawn_terminal: Spawn a new terminal at specific canvas coordinates
 * - canvas_list_terminals: List all terminals on the canvas
 * - canvas_health: Check if canvas is running
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Canvas dev server URL
const CANVAS_URL = process.env.CANVAS_URL || "http://localhost:5174";

// =====================================
// Tool Schemas
// =====================================

const SpawnTerminalSchema = z.object({
  name: z.string()
    .default("Terminal")
    .describe("Display name for the terminal (e.g., 'Build Server', 'Git')"),
  x: z.number()
    .default(100)
    .describe("X position on canvas (pixels from left)"),
  y: z.number()
    .default(100)
    .describe("Y position on canvas (pixels from top)"),
  width: z.number()
    .min(200)
    .max(2000)
    .default(600)
    .describe("Terminal width in pixels (200-2000)"),
  height: z.number()
    .min(150)
    .max(1500)
    .default(400)
    .describe("Terminal height in pixels (150-1500)"),
  command: z.string()
    .optional()
    .describe("Initial command to run in terminal (optional)"),
  profile: z.string()
    .optional()
    .describe("Terminal profile name for theming (optional)")
}).strict();

type SpawnTerminalInput = z.infer<typeof SpawnTerminalSchema>;

// =====================================
// API Helpers
// =====================================

interface SpawnResult {
  success: boolean;
  command?: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    command?: string;
  };
  message?: string;
  error?: string;
}

interface HealthResult {
  success: boolean;
  status?: string;
  pendingCount?: number;
  error?: string;
}

async function spawnTerminal(params: SpawnTerminalInput): Promise<SpawnResult> {
  try {
    const response = await fetch(`${CANVAS_URL}/api/canvas/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: `Cannot connect to TabzCanvas at ${CANVAS_URL}. Make sure the canvas dev server is running (npm run dev in tabz-canvas directory).`
      };
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkHealth(): Promise<HealthResult> {
  try {
    const response = await fetch(`${CANVAS_URL}/api/canvas/health`);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// =====================================
// MCP Server Setup
// =====================================

const server = new McpServer({
  name: "tabz-canvas-mcp",
  version: "1.0.0"
});

// Tool: canvas_spawn_terminal
server.tool(
  "canvas_spawn_terminal",
  `Spawn a new terminal on the TabzCanvas infinite canvas.

Creates a new terminal window at the specified canvas coordinates with the given dimensions.
The terminal connects to the TabzChrome backend for PTY/tmux integration.

Args:
  - name: Display name for the terminal (default: "Terminal")
  - x: X position on canvas in pixels (default: 100)
  - y: Y position on canvas in pixels (default: 100)
  - width: Terminal width in pixels, 200-2000 (default: 600)
  - height: Terminal height in pixels, 150-1500 (default: 400)
  - command: Initial command to run (optional)
  - profile: Terminal profile for theming (optional)

Returns:
  - success: Whether the terminal was spawned
  - command: Details of the spawn command queued
  - error: Error message if failed

Examples:
  - Basic terminal: name="Dev"
  - Positioned terminal: name="Build", x=800, y=100
  - With command: name="Server", command="npm run dev"
  - Sized terminal: name="Logs", width=800, height=600

Layout Tips:
  - Default terminal: 600x400 pixels
  - Use x offset of ~650 to place terminals side by side
  - Use y offset of ~450 to stack terminals vertically
  - Grid layout: (100,100), (750,100), (100,550), (750,550)

Error Handling:
  - "Cannot connect": Ensure TabzCanvas dev server is running (npm run dev)`,
  SpawnTerminalSchema.shape,
  async (params: SpawnTerminalInput) => {
    const result = await spawnTerminal(params);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: `## Terminal Spawn Failed\n\n**Error:** ${result.error}`
        }],
        isError: true
      };
    }

    const cmd = result.command!;
    const text = `## Terminal Spawned

**Name:** ${cmd.name}
**Position:** (${cmd.x}, ${cmd.y})
**Size:** ${cmd.width}x${cmd.height}
${cmd.command ? `**Command:** ${cmd.command}` : ''}

The terminal has been queued for creation on the canvas.
The canvas will pick up this command and create the terminal window.`;

    return {
      content: [{ type: "text", text }]
    };
  }
);

// Tool: canvas_health
server.tool(
  "canvas_health",
  `Check if TabzCanvas is running and responsive.

Verifies connectivity to the canvas dev server and reports status.

Returns:
  - success: Whether canvas is reachable
  - status: "ok" if healthy
  - pendingCount: Number of pending spawn commands
  - error: Error message if unhealthy`,
  {},
  async () => {
    const result = await checkHealth();

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: `## Canvas Health Check Failed\n\n**Error:** ${result.error}\n\nMake sure TabzCanvas is running: \`cd tabz-canvas && npm run dev\``
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `## Canvas Health Check\n\n**Status:** ${result.status}\n**Pending Commands:** ${result.pendingCount}`
      }]
    };
  }
);

// =====================================
// Main
// =====================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("TabzCanvas MCP server running via stdio");
  console.error(`Canvas URL: ${CANVAS_URL}`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
