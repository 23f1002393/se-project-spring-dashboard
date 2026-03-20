import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <main className="min-h-dvh w-full place-content-center place-items-center">
      <Outlet />
    </main>
  );
}
