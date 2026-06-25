import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegacyOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/order-details/${id}`} />;
}
