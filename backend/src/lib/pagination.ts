export function getPagination(page = 1, limit = 20) {
  const currentPage = Math.max(1, page);
  const take = Math.min(100, Math.max(1, limit));
  const skip = (currentPage - 1) * take;
  return { page: currentPage, limit: take, skip, take };
}

export function buildPageResult<T>(data: T[], total: number, page: number, limit: number) {
  return {
    items: data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
