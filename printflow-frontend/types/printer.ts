export interface Printer {
  _id: string;
  name: string;
  location: string;
  printerType: "bw" | "color";
  status: "online" | "offline" | "maintenance";
  pagesPerMinute: number;
  operatorId?: string | any;
  currentQueueLength: number;
  createdAt: string;
  updatedAt: string;
}
