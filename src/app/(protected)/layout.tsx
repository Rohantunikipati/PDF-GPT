import { auth } from "@clerk/nextjs/server";
import DashBoard from "./dashboard/page";

export default async function HomePage() {
  const { userId } = await auth(); // ✅ await it
  return <div className="bg-red-400" >
    {userId ? "Logged In" : "Guest"}
    <DashBoard />
  </div>;
}
