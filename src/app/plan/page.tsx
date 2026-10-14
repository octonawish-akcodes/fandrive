import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlanClient } from "./PlanClient";

export const metadata = { title: "Plan drives · FanDrive" };
export default function Page() {
  return <Suspense fallback={<SiteHeader />}><PlanClient /></Suspense>;
}
