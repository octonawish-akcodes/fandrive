import { Suspense } from "react";
import { PlanClient } from "./PlanClient";

export const metadata = { title: "Plan drives · FanDrive" };
export default function Page() {
  return <Suspense fallback={null}><PlanClient /></Suspense>;
}
