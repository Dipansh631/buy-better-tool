// ClickUp API service for price tracking and task management
import { config } from './config';

const CLICKUP_API_KEY = config.clickup.apiKey;
const CLICKUP_BASE_URL = config.clickup.baseUrl;

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  custom_fields: any[];
}

export interface ClickUpList {
  id: string;
  name: string;
  task_count: number;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  lists: ClickUpList[];
}

export interface PriceTrackingTask {
  productName: string;
  currentPrice: number;
  targetPrice: number;
  platform: string;
  productUrl: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  lastChecked: string;
}

export class ClickUpApiService {
  private static instance: ClickUpApiService;
  private apiKey: string;
  private useMockData: boolean;

  private constructor() {
    this.apiKey = CLICKUP_API_KEY;
    this.useMockData = !this.apiKey;
    
    if (config.debug.enabled) {
      console.log('ClickUpApiService constructor - API Key:', this.apiKey ? 'Present' : 'Missing');
      console.log('Using mock data:', this.useMockData);
    }
    
    if (!this.apiKey) {
      console.warn('CLICKUP_API_KEY is not configured. Using mock data for demonstration.');
    }
  }

  public static getInstance(): ClickUpApiService {
    if (!ClickUpApiService.instance) {
      ClickUpApiService.instance = new ClickUpApiService();
    }
    return ClickUpApiService.instance;
  }

  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (this.useMockData) {
      throw new Error('Using mock data mode');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${CLICKUP_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getSpaces(): Promise<ClickUpSpace[]> {
    try {
      if (this.useMockData) {
        return this.generateMockSpaces();
      }

      const data = await this.makeApiRequest('/team');
      return data.teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        lists: []
      })) || [];
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return this.generateMockSpaces();
    }
  }

  async getLists(spaceId: string): Promise<ClickUpList[]> {
    try {
      if (this.useMockData) {
        return this.generateMockLists();
      }

      const data = await this.makeApiRequest(`/space/${spaceId}/list`);
      return data.lists?.map((list: any) => ({
        id: list.id,
        name: list.name,
        task_count: list.task_count || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching lists:', error);
      return this.generateMockLists();
    }
  }

  async createPriceTrackingTask(
    listId: string,
    productName: string,
    currentPrice: number,
    targetPrice: number,
    platform: string,
    productUrl: string
  ): Promise<ClickUpTask> {
    try {
      if (this.useMockData) {
        return this.generateMockTask(productName, currentPrice, targetPrice, platform);
      }

      const taskData = {
        name: `Track Price: ${productName}`,
        description: `
**Product**: ${productName}
**Current Price**: ₹${currentPrice.toLocaleString()}
**Target Price**: ₹${targetPrice.toLocaleString()}
**Platform**: ${platform}
**Product URL**: ${productUrl}
**Tracking Started**: ${new Date().toLocaleString()}

This task will be updated when the price reaches the target or significant changes occur.
        `,
        status: 'in progress',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(), // 30 days from now
        custom_fields: [
          {
            id: 'current_price',
            value: currentPrice
          },
          {
            id: 'target_price',
            value: targetPrice
          },
          {
            id: 'platform',
            value: platform
          },
          {
            id: 'product_url',
            value: productUrl
          }
        ]
      };

      const data = await this.makeApiRequest(`/list/${listId}/task`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status.status,
        due_date: data.due_date,
        created_at: data.date_created,
        updated_at: data.date_updated,
        custom_fields: data.custom_fields || []
      };
    } catch (error) {
      console.error('Error creating price tracking task:', error);
      return this.generateMockTask(productName, currentPrice, targetPrice, platform);
    }
  }

  async updatePriceTrackingTask(
    taskId: string,
    newPrice: number,
    priceChange: number
  ): Promise<ClickUpTask> {
    try {
      if (this.useMockData) {
        return this.generateMockTask('Updated Product', newPrice, newPrice * 0.9, 'Amazon');
      }

      const updateData = {
        description: `Price updated: ₹${newPrice.toLocaleString()} (${priceChange > 0 ? '+' : ''}${priceChange}%)`,
        custom_fields: [
          {
            id: 'current_price',
            value: newPrice
          }
        ]
      };

      const data = await this.makeApiRequest(`/task/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status.status,
        due_date: data.due_date,
        created_at: data.date_created,
        updated_at: data.date_updated,
        custom_fields: data.custom_fields || []
      };
    } catch (error) {
      console.error('Error updating price tracking task:', error);
      return this.generateMockTask('Updated Product', newPrice, newPrice * 0.9, 'Amazon');
    }
  }

  async getPriceTrackingTasks(listId: string): Promise<PriceTrackingTask[]> {
    try {
      if (this.useMockData) {
        return this.generateMockPriceTrackingTasks();
      }

      const data = await this.makeApiRequest(`/list/${listId}/task`);
      return data.tasks?.map((task: any) => ({
        productName: task.name.replace('Track Price: ', ''),
        currentPrice: task.custom_fields?.find((f: any) => f.id === 'current_price')?.value || 0,
        targetPrice: task.custom_fields?.find((f: any) => f.id === 'target_price')?.value || 0,
        platform: task.custom_fields?.find((f: any) => f.id === 'platform')?.value || 'Unknown',
        productUrl: task.custom_fields?.find((f: any) => f.id === 'product_url')?.value || '',
        status: task.status.status === 'in progress' ? 'active' : 'completed',
        createdAt: task.date_created,
        lastChecked: task.date_updated
      })) || [];
    } catch (error) {
      console.error('Error fetching price tracking tasks:', error);
      return this.generateMockPriceTrackingTasks();
    }
  }

  private generateMockSpaces(): ClickUpSpace[] {
    return [
      {
        id: 'mock-space-1',
        name: 'Price Tracking Workspace',
        lists: []
      },
      {
        id: 'mock-space-2',
        name: 'Product Research',
        lists: []
      }
    ];
  }

  private generateMockLists(): ClickUpList[] {
    return [
      {
        id: 'mock-list-1',
        name: 'Active Price Tracking',
        task_count: 5
      },
      {
        id: 'mock-list-2',
        name: 'Completed Tracking',
        task_count: 12
      },
      {
        id: 'mock-list-3',
        name: 'Watch List',
        task_count: 8
      }
    ];
  }

  private generateMockTask(
    productName: string,
    currentPrice: number,
    targetPrice: number,
    platform: string
  ): ClickUpTask {
    return {
      id: `mock-task-${Date.now()}`,
      name: `Track Price: ${productName}`,
      description: `Tracking ${productName} on ${platform}`,
      status: 'in progress',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      custom_fields: []
    };
  }

  private generateMockPriceTrackingTasks(): PriceTrackingTask[] {
    return [
      {
        productName: 'iPhone 15 Pro Max',
        currentPrice: 129999,
        targetPrice: 119999,
        platform: 'Amazon',
        productUrl: 'https://amazon.in/iphone15',
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastChecked: new Date().toISOString()
      },
      {
        productName: 'MacBook Air M3',
        currentPrice: 78999,
        targetPrice: 72999,
        platform: 'Flipkart',
        productUrl: 'https://flipkart.com/macbook-air',
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastChecked: new Date().toISOString()
      },
      {
        productName: 'Samsung Galaxy S24',
        currentPrice: 89999,
        targetPrice: 84999,
        platform: 'Croma',
        productUrl: 'https://croma.com/samsung-s24',
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        lastChecked: new Date().toISOString()
      }
    ];
  }
}

export default ClickUpApiService;
