export function parseJsonField(value, defaultValue = null) {
  if (!value) return defaultValue;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return defaultValue;
  }
}

export function buildFilters(query, allowedFields) {
  const filters = {};
  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  }
  return filters;
}

export function buildSearch(search, searchFields) {
  if (!search) return [];
  return searchFields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' },
  }));
}

export function buildSort(sortBy, sortOrder = 'asc', allowedFields) {
  const order = sortOrder === 'desc' ? 'desc' : 'asc';
  if (allowedFields.includes(sortBy)) {
    return { [sortBy]: order };
  }
  return { createdAt: 'desc' };
}
