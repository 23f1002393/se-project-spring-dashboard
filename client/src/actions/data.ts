import dummyData from '@/assets/dummy.json';

// Utility to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchSalesDashboardData() {
  await delay(500);
  return {
    enquiries: dummyData.enquiries,
    quotations: dummyData.quotations,
    orders: dummyData.orders
  };
}

export async function fetchForemanDashboardData() {
  await delay(500);
  return {
    orders: dummyData.orders,
    production_tasks: dummyData.production_tasks,
    machines: dummyData.machines,
    materials: dummyData.materials
  };
}

export async function fetchQCDashboardData() {
  await delay(500);
  return {
    production_tasks: dummyData.production_tasks,
    quality_reports: dummyData.quality_reports
  };
}

export async function fetchAccountsDashboardData() {
  await delay(500);
  return {
    orders: dummyData.orders,
    invoices: dummyData.invoices,
    quotations: dummyData.quotations
  };
}

export async function fetchCustomerDashboardData(userId: number) {
  await delay(500);
  const customerInfo = dummyData.customers.find(c => c.user_id === userId);
  const myEnquiries = dummyData.enquiries.filter(e => e.customer_id === customerInfo?.customer_id);
  const enquiryIds = myEnquiries.map(e => e.enquiry_id);
  const myQuotations = dummyData.quotations.filter(q => enquiryIds.includes(q.enquiry_id));
  
  return {
    customer: customerInfo,
    enquiries: myEnquiries,
    quotations: myQuotations,
    orders: dummyData.orders // In real app, filter by quote_id linked to customer
  };
}

export async function fetchVendorDashboardData(vendorId: number) {
  await delay(500);
  const tasks = dummyData.production_tasks.filter(t => t.vendor_id === vendorId);
  return {
    outsourced_tasks: tasks
  };
}

export async function fetchLogisticsDashboardData() {
  await delay(500);
  return {
    shipments: dummyData.shipments,
    orders: dummyData.orders.filter(o => o.production_status === 'ready_for_dispatch')
  };
}

// Action methods (simulating mutations)
export async function updateEnquiryStatus(enquiryId: number, status: string) {
  await delay(300);
  // In a real app we'd mutate DB, here we might just return success
  return { success: true, enquiryId, status };
}

export async function generateQuotation(_enquiryId: number, _price: number, _estDelivery: string) {
  await delay(300);
  return { success: true, quote_id: Math.floor(Math.random() * 1000) };
}

export async function updateProductionTaskStatus(taskId: number, status: string) {
  await delay(300);
  return { success: true, taskId, status };
}

export async function createQualityReport(_taskId: number, _result: string) {
  await delay(300);
  return { success: true, report_id: Math.floor(Math.random() * 1000) };
}

export async function generateInvoice(_orderId: number, _amount: number) {
  await delay(300);
  return { success: true, invoice_id: Math.floor(Math.random() * 1000) };
}
