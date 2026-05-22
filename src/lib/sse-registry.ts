type Controller = ReadableStreamDefaultController;

class NotificationRegistry {
  // businessId → set of active stream controllers
  // A chef might have multiple browser tabs open
  private subscribers = new Map<string, Set<Controller>>();

  register(businessId: string, controller: Controller) {
    if (!this.subscribers.has(businessId)) {
      this.subscribers.set(businessId, new Set());
    }
    this.subscribers.get(businessId)!.add(controller);
  }

  unregister(businessId: string, controller: Controller) {
    this.subscribers.get(businessId)?.delete(controller);
  }

  push(businessId: string, event: object) {
    const controllers = this.subscribers.get(businessId);
    if (!controllers?.size) return;

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const controller of controllers) {
      try {
        controller.enqueue(payload);
      } catch {
        // Controller is closed — remove it
        controllers.delete(controller);
      }
    }
  }
}

// Singleton — persists for the lifetime of the server process
export const notificationRegistry = new NotificationRegistry();