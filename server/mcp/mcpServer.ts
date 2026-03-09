/**
 * mcpServer.ts
 * ─────────────────────────────────────────────
 * This is your MCP SERVER.
 * It exposes TOOLS that Claude (or any AI) can call.
 *
 * Think of it as a collection of functions you're
 * "offering" to the AI. The AI decides when to call them.
 *
 * Transport: Streamable HTTP (modern, recommended in 2025)
 * ─────────────────────────────────────────────
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { Request, Response } from "express";

// ── Fake in-memory "database" ──────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    name: "Mechanical Keyboard",
    price: 120,
    stock: 15,
    category: "Electronics",
  },
  {
    id: 2,
    name: "Ergonomic Mouse",
    price: 60,
    stock: 32,
    category: "Electronics",
  },
  {
    id: 3,
    name: "Monitor Stand",
    price: 45,
    stock: 8,
    category: "Accessories",
  },
  { id: 4, name: "USB-C Hub", price: 35, stock: 50, category: "Electronics" },
  { id: 5, name: "Desk Lamp", price: 28, stock: 0, category: "Accessories" },
];

const ORDERS: { id: number; product: string; qty: number; status: string }[] =
  [];

// ── Create the MCP Server ──────────────────────────────────
export function createMcpServer() {
  const server = new McpServer({
    name: "demo-store-server",
    version: "1.0.0",
  });

  // ── TOOL 1: Search Products ────────────────────────────
  server.registerTool(
    "search_products",
    {
      description:
        "Search for products by name or category. Returns matching items with price and stock info.",
      inputSchema: {
        query: z.string().describe("Search term — product name or category"),
        inStock: z
          .boolean()
          .optional()
          .describe("If true, only return in-stock items"),
      },
    },
    async ({ query, inStock }) => {
      const q = query.toLowerCase();
      let results = PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
      if (inStock) results = results.filter((p) => p.stock > 0);

      if (results.length === 0) {
        return {
          content: [
            { type: "text", text: `No products found for "${query}".` },
          ],
        };
      }

      const text = results
        .map(
          (p) =>
            `• ${p.name} — $${p.price} | Stock: ${p.stock > 0 ? p.stock : "OUT OF STOCK"}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} product(s):\n${text}`,
          },
        ],
      };
    },
  );

  // ── TOOL 2: Get Product Details ────────────────────────
  server.registerTool(
    "get_product",
    {
      description: "Get full details of a specific product by its ID.",
      inputSchema: { id: z.number().describe("The product ID") },
    },
    async ({ id }) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (!product) {
        return {
          content: [{ type: "text", text: `Product with ID ${id} not found.` }],
        };
      }
      const text = `Product: ${product.name}\nID: ${product.id}\nPrice: $${product.price}\nCategory: ${product.category}\nStock: ${product.stock > 0 ? `${product.stock} units available` : "OUT OF STOCK"}`;
      return { content: [{ type: "text", text }] };
    },
  );

  // ── TOOL 3: Place Order ────────────────────────────────
  server.registerTool(
    "place_order",
    {
      description:
        "Place an order for a product. Checks stock before confirming.",
      inputSchema: {
        productId: z.number().describe("ID of the product to order"),
        quantity: z.number().min(1).describe("How many units to order"),
        customer: z.string().describe("Customer name"),
      },
    },
    async ({ productId, quantity, customer }) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) {
        return {
          content: [
            { type: "text", text: `Product ID ${productId} not found.` },
          ],
        };
      }
      if (product.stock < quantity) {
        return {
          content: [
            {
              type: "text",
              text: `Cannot place order. Only ${product.stock} units of "${product.name}" in stock, but you requested ${quantity}.`,
            },
          ],
        };
      }

      product.stock -= quantity;
      const order = {
        id: ORDERS.length + 1,
        product: product.name,
        qty: quantity,
        status: "Confirmed",
      };
      ORDERS.push(order);

      return {
        content: [
          {
            type: "text",
            text: `Order #${order.id} placed!\nCustomer: ${customer}\nProduct: ${product.name} x${quantity}\nTotal: $${product.price * quantity}\nStatus: Confirmed`,
          },
        ],
      };
    },
  );

  // ── TOOL 4: List All Orders ────────────────────────────
  server.registerTool(
    "list_orders",
    {
      description: "List all orders placed in this session.",
      inputSchema: {},
    },
    async () => {
      if (ORDERS.length === 0) {
        return { content: [{ type: "text", text: "No orders placed yet." }] };
      }
      const text = ORDERS.map(
        (o) => `Order #${o.id}: ${o.product} x${o.qty} — ${o.status}`,
      ).join("\n");
      return { content: [{ type: "text", text: `All orders:\n${text}` }] };
    },
  );

  return server;
}

// ── HTTP Handler (mounted at POST /mcp in Express) ─────────
export async function handleMcpRequest(req: Request, res: Response) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — simple and scalable
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
