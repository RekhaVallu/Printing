export const formatCurrency = (amount: number | string | null | undefined) => {
  const numericAmount = Number(amount || 0);
  return `Rs ${numericAmount.toFixed(2)}`;
};
