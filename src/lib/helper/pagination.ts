/**
 * ✅ Generate pagination metadata
 *
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @param total - Total items count
 * @returns Pagination metadata object
 */
export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
    offset: number;
}

export default function MetaPagination(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    // --- Sanitize inputs
    const currentPage = Math.max(1, Math.floor(page || 1));
    const perPage = Math.max(1, Math.floor(limit || 10));
    const totalItems = Math.max(0, Math.floor(total || 0));

    const lastPage = Math.max(1, Math.ceil(totalItems / perPage));

    // --- Compute boundaries
    const from = totalItems === 0 ? null : (currentPage - 1) * perPage + 1;
    const to = totalItems === 0 ? null : Math.min(currentPage * perPage, totalItems);

    // --- Offset (for DB queries)
    const offset = (currentPage - 1) * perPage;

    return {
        current_page: currentPage,
        per_page: perPage,
        total: totalItems,
        last_page: lastPage,
        from,
        to,
        offset,
    };
}