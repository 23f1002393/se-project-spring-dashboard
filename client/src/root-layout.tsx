import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar";

export default function RootLayout() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
