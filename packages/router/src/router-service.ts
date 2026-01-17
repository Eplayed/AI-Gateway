import type { IRouter, RoutingRequest, ModelRouteResult, RouteConfig } from '@ai-gateway/core';
import { CostFirstRoutingStrategy } from './strategies/index.js';

export class RouterService implements IRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private strategy = new CostFirstRoutingStrategy([]); // TODO: 从数据库加载模型

  async route(request: RoutingRequest): Promise<ModelRouteResult> {
    const context = request.context;

    // 默认使用成本优先策略
    return this.strategy.route(request, context);
  }

  async addRoute(route: RouteConfig): Promise<void> {
    this.routes.set(route.id, route);
  }

  async updateRoute(id: string, updates: Partial<RouteConfig>): Promise<void> {
    const existing = this.routes.get(id);
    if (!existing) {
      throw new Error(`Route not found: ${id}`);
    }
    this.routes.set(id, { ...existing, ...updates });
  }

  async deleteRoute(id: string): Promise<void> {
    this.routes.delete(id);
  }

  async getRoute(id: string): Promise<RouteConfig | null> {
    return this.routes.get(id) || null;
  }

  async listRoutes(): Promise<RouteConfig[]> {
    return Array.from(this.routes.values());
  }
}

export { RouterService };
