import React from "react";
import { AnalyticsCard, AnalyticsCardProps } from "../AnalyticsCard";

export default function SpendingCard(props: Omit<AnalyticsCardProps, "icon" | "variant">) {
  return <AnalyticsCard {...props} icon="dollar-sign" variant="green" />;
}
