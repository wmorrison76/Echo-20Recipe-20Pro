// Toast POS Integration
// Connects Echo Recipe Pro to Toast POS for real-time order and menu synchronization
// Reference: https://dev.toastab.com/

export interface ToastConfig {
  restaurantId: string;
  apiKey: string;
  accessToken?: string;
  environment: "production" | "staging";
}

export interface ToastMenuItem {
  guid: string;
  name: string;
  description?: string;
  plu?: string;
  price: number;
  taxIncluded: boolean;
  course?: string;
  ingredients?: string[];
}

export interface ToastOrder {
  guid: string;
  checkGuid: string;
  orderNumber: string;
  timestamp: number;
  items: Array<{
    itemGuid: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{
      name: string;
      price: number;
    }>;
  }>;
  status: "open" | "closed" | "voided";
  totalAmount: number;
  discounts?: number;
  tax: number;
  deliveryFee?: number;
  gratuity?: number;
}

export interface ToastSalesData {
  date: string;
  itemName: string;
  itemGuid: string;
  quantitySold: number;
  totalSales: number;
  averagePrice: number;
  course?: string;
}

export interface MenuSyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  errors?: Array<{ itemId: string; error: string }>;
}

export interface OrderSyncResult {
  success: boolean;
  ordersImported: number;
  salesProcessed: number;
}

// Toast API endpoints
const TOAST_API_BASE = {
  production: "https://api.toastapi.com/v1",
  staging: "https://api-staging.toastapi.com/v1",
};

/**
 * Initialize Toast POS connection
 * @param config - Toast configuration with restaurant ID and API key
 * @returns Boolean indicating successful connection
 */
export async function initializeToastConnection(config: ToastConfig): Promise<boolean> {
  try {
    const baseUrl = TOAST_API_BASE[config.environment];

    // Verify connection by fetching restaurant info
    const response = await fetch(`${baseUrl}/restaurants/${config.restaurantId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Toast POS connection failed:", response.statusText);
      return false;
    }

    // Store config in session storage (not localStorage for security)
    sessionStorage.setItem(
      "toast:config",
      JSON.stringify({
        restaurantId: config.restaurantId,
        environment: config.environment,
        // Never store API key in storage
      }),
    );

    return true;
  } catch (error) {
    console.error("Toast connection error:", error);
    return false;
  }
}

/**
 * Fetch menu items from Toast POS
 * @param config - Toast configuration
 * @returns Array of Toast menu items
 */
export async function fetchToastMenu(config: ToastConfig): Promise<ToastMenuItem[]> {
  try {
    const baseUrl = TOAST_API_BASE[config.environment];

    const response = await fetch(
      `${baseUrl}/restaurants/${config.restaurantId}/menus`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.statusText}`);
    }

    const data = await response.json() as { items: ToastMenuItem[] };
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Toast menu:", error);
    return [];
  }
}

/**
 * Sync recipes from Echo Recipe Pro to Toast POS
 * Maps recipes to menu items and updates Toast
 * @param config - Toast configuration
 * @param recipes - Recipes to sync
 * @returns Sync result with success/failure counts
 */
export async function syncRecipesToToast(
  config: ToastConfig,
  recipes: Array<{
    id: string;
    title: string;
    description?: string;
    course?: string;
    cost: number;
    price: number;
  }>,
): Promise<MenuSyncResult> {
  const baseUrl = TOAST_API_BASE[config.environment];
  let itemsSynced = 0;
  const errors: Array<{ itemId: string; error: string }> = [];

  for (const recipe of recipes) {
    try {
      // Create/update menu item in Toast
      const menuItem = {
        name: recipe.title,
        description: recipe.description,
        plu: recipe.id, // Use recipe ID as PLU
        price: recipe.price * 100, // Toast uses cents
        taxIncluded: true,
        course: recipe.course,
      };

      const response = await fetch(
        `${baseUrl}/restaurants/${config.restaurantId}/menu-items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(menuItem),
        },
      );

      if (response.ok) {
        itemsSynced++;
      } else {
        errors.push({
          itemId: recipe.id,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      errors.push({
        itemId: recipe.id,
        error: String(error),
      });
    }
  }

  return {
    success: errors.length === 0,
    itemsSynced,
    itemsFailed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Fetch recent orders from Toast POS
 * @param config - Toast configuration
 * @param startDate - Start date for orders (ISO string)
 * @param endDate - End date for orders (ISO string)
 * @returns Array of Toast orders
 */
export async function fetchToastOrders(
  config: ToastConfig,
  startDate: string,
  endDate: string,
): Promise<ToastOrder[]> {
  try {
    const baseUrl = TOAST_API_BASE[config.environment];
    const params = new URLSearchParams({
      restaurantId: config.restaurantId,
      startDate,
      endDate,
    });

    const response = await fetch(`${baseUrl}/orders?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json() as { orders: ToastOrder[] };
    return data.orders || [];
  } catch (error) {
    console.error("Error fetching Toast orders:", error);
    return [];
  }
}

/**
 * Process Toast orders and extract sales data
 * @param orders - Toast orders
 * @returns Sales data aggregated by item
 */
export function processOrdersToSalesData(orders: ToastOrder[]): ToastSalesData[] {
  const salesMap = new Map<string, {
    quantitySold: number;
    totalSales: number;
    itemName: string;
    course?: string;
  }>();

  orders.forEach((order) => {
    if (order.status === "closed") {
      order.items.forEach((item) => {
        const key = item.itemGuid;
        const existing = salesMap.get(key) || {
          quantitySold: 0,
          totalSales: 0,
          itemName: item.itemName,
          course: undefined,
        };

        existing.quantitySold += item.quantity;
        existing.totalSales += item.totalPrice;

        salesMap.set(key, existing);
      });
    }
  });

  return Array.from(salesMap.entries()).map(([guid, data]) => ({
    date: new Date().toISOString().split("T")[0],
    itemName: data.itemName,
    itemGuid: guid,
    quantitySold: data.quantitySold,
    totalSales: data.totalSales,
    averagePrice: data.totalSales / Math.max(1, data.quantitySold),
    course: data.course,
  }));
}

/**
 * Setup webhook for real-time order updates
 * @param config - Toast configuration
 * @param webhookUrl - URL to send updates to
 * @returns Success status
 */
export async function setupOrderWebhook(
  config: ToastConfig,
  webhookUrl: string,
): Promise<boolean> {
  try {
    const baseUrl = TOAST_API_BASE[config.environment];

    const response = await fetch(
      `${baseUrl}/restaurants/${config.restaurantId}/webhooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "order.updated",
          url: webhookUrl,
          active: true,
        }),
      },
    );

    return response.ok;
  } catch (error) {
    console.error("Error setting up webhook:", error);
    return false;
  }
}

/**
 * Calculate cost impact from Toast sales
 * Maps Toast orders back to Echo recipes for cost analysis
 * @param orders - Toast orders
 * @param recipeMap - Map of recipe IDs to cost data
 * @returns Cost analysis results
 */
export function calculateCostImpact(
  orders: ToastOrder[],
  recipeMap: Map<
    string,
    { name: string; cost: number; price: number }
  >,
): {
  totalRevenue: number;
  totalCostOfGoods: number;
  foodCostPercent: number;
  itemBreakdown: Array<{
    recipeName: string;
    quantitySold: number;
    totalRevenue: number;
    totalCost: number;
    margin: number;
  }>;
} {
  let totalRevenue = 0;
  let totalCostOfGoods = 0;
  const itemCosts = new Map<
    string,
    {
      recipeName: string;
      quantitySold: number;
      totalRevenue: number;
      totalCost: number;
    }
  >();

  orders.forEach((order) => {
    if (order.status === "closed") {
      totalRevenue += order.totalAmount;

      order.items.forEach((item) => {
        // Try to match Toast item to Echo recipe
        const recipeData = Array.from(recipeMap.values()).find(
          (r) => r.name.toLowerCase() === item.itemName.toLowerCase(),
        );

        if (recipeData) {
          const itemCost = recipeData.cost * item.quantity;
          totalCostOfGoods += itemCost;

          const key = item.itemGuid;
          const existing = itemCosts.get(key) || {
            recipeName: item.itemName,
            quantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
          };

          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.totalPrice;
          existing.totalCost += itemCost;

          itemCosts.set(key, existing);
        }
      });
    }
  });

  const itemBreakdown = Array.from(itemCosts.values()).map((item) => ({
    ...item,
    margin: item.totalRevenue - item.totalCost,
  }));

  return {
    totalRevenue,
    totalCostOfGoods,
    foodCostPercent:
      totalRevenue > 0 ? Math.round((totalCostOfGoods / totalRevenue) * 10000) / 100 : 0,
    itemBreakdown,
  };
}

/**
 * Check if Toast config exists in session
 * @returns Stored config or null
 */
export function getStoredToastConfig(): { restaurantId: string; environment: "production" | "staging" } | null {
  try {
    const raw = sessionStorage.getItem("toast:config");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear Toast configuration from session
 */
export function clearToastConfig(): void {
  sessionStorage.removeItem("toast:config");
}
