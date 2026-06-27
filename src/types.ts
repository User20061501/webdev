export interface PhoneProduct {
  id?: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  specs: Record<string, string>;
  colorOptions: string[];
  isPopular?: boolean;
  rating?: number;
  image: string;
  images?: string[];
  category?: string;
  emiAvailable?: boolean;
  minDownpaymentPercent?: number;
  allowedTenures?: number[];
  outOfStock?: boolean;
  hidden?: boolean;
}

export interface OrderItem {
  id: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  brand: string;
  model: string;
  buyType: "Direct" | "EMI";
  selectedColor: string;
  emiTenure: number | null;
  emiDownpayment: number;
  emiMonthly: number;
  timestamp: string;
  status: "New" | "Contacted" | "Confirmed" | "Delivered" | "Paid" | "Canceled";
  notes: string;
  totalPrice?: number;
  emiPaidMonths?: number;
  emiSentMonths?: number[];
  paymentStatus?: string;
  deliveryStatus?: string;
  paymentMethod?: string;
  esewaTxnId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface Staff {
  username: string;
  passcode: string;
  role: "Owner" | "Admin" | "Moderator";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  username: string;
  role: "Owner" | "Admin" | "Moderator";
  action: string;
  timestamp: string;
}

