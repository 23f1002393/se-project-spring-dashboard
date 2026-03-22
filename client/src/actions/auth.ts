import dummyData from "@/assets/dummy.json";

// Utility to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loginUser(email: string, _password?: string) {
  await delay(600);
  
  // For mock purposes, determine role based on email keyword
  let role = "sales_manager";
  if (email.includes("foreman")) role = "foreman";
  if (email.includes("qc")) role = "quality_control";
  if (email.includes("accounts")) role = "accounts_officer";
  if (email.includes("customer")) role = "customer";
  if (email.includes("vendor")) role = "external_vendor";
  if (email.includes("logistics")) role = "logistics_provider";

  const user = dummyData.users.find(u => u.role === role);
  
  if (user) {
    return { success: true, user: { ...user, email }, token: "mock_jwt_token_123" };
  }
  
  return { success: false, message: "Invalid credentials." };
}
