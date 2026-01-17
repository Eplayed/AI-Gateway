import type { Model, RoutingStrategy } from '../models/model';
import type { ChatRequest, TextGenerationRequest } from './model-adapter';

export interface IRouter {
  route(request: RoutingRequest): Promise<ModelRouteResult>;
  addRoute(route: RouteConfig): Promise<void>;
  updateRoute(id: string, updates: Partial<RouteConfig>): Promise<void>;
  deleteRoute(id: string): Promise<void>;
  getRoute(id: string): Promise<RouteConfig | null>;
  listRoutes(): Promise<RouteConfig[]>;
}

export interface RoutingRequest {
  type: 'chat' | 'completion' | 'image_analysis' | 'speech';
  input: string | ChatRequest | TextGenerationRequest;
  context: RoutingContext;
}

export interface RoutingContext {
  apiKey: string;
  userId?: string;
  costLimit?: number;
  latencyRequirement?: number;
  qualityRequirement?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface ModelRouteResult {
  model: Model;
  strategy: RoutingStrategy;
  reason: string;
  estimatedCost: number;
  estimatedLatency: number;
}

export interface RouteConfig {
  id: string;
  name: string;
  description: string;
  strategy: RoutingStrategy;
  rules: RoutingRule[];
  defaultModelId: string;
  fallbackModelId?: string;
  isActive: boolean;
  priority: number;
}

export interface RoutingRule {
  condition: string;
  modelId: string;
  priority: number;
  weight?: number;
}
