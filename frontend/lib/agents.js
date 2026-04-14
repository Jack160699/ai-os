export function getAgentCenterItems() {
  return [
    {
      id: "chat-agent",
      name: "Chat Agent",
      status: "online",
      statusLabel: "Online",
      currentTask: "Handling WhatsApp leads",
      successRate: "94%",
      lastActive: "Just now",
    },
    {
      id: "calling-agent",
      name: "Calling Agent",
      status: "busy",
      statusLabel: "Busy",
      currentTask: "Outbound follow-up campaign",
      successRate: "89%",
      lastActive: "1 min ago",
    },
    {
      id: "finance-agent",
      name: "Finance Agent",
      status: "online",
      statusLabel: "Online",
      currentTask: "Payment links + invoices",
      successRate: "97%",
      lastActive: "3 min ago",
    },
    {
      id: "tech-agent",
      name: "Tech Agent",
      status: "offline",
      statusLabel: "Offline",
      currentTask: "No active tasks",
      successRate: "--",
      lastActive: "27 min ago",
    },
  ];
}

