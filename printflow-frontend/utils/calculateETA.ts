export const calculateETA = (queuePosition = 0, pagesPerMinute = 10, totalPages = 1, copies = 1) => {
  const speed = Math.max(1, pagesPerMinute);
  const pages = Math.max(1, totalPages * copies);
  const currentJobMinutes = Math.ceil(pages / speed);
  return Math.max(0, queuePosition) * currentJobMinutes;
};
