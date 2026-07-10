// Product search helpers — the single source of truth for search behavior.
// Used server-side by /api/products; the frontend just passes ?search= through.

const MIN_STEM_LENGTH = 4

// Light plural forgiveness: searching "hoodies" must match "Hoodie".
// Substring matching already covers the reverse ("hoodie" matches "Hoodies"),
// so stripping one trailing "s" from the search term handles both directions.
// Words ending in "ss" (glass, dress) are left alone.
const stemTerm = (term) =>
    term.length >= MIN_STEM_LENGTH && term.endsWith('s') && !term.endsWith('ss')
        ? term.slice(0, -1)
        : term

// "  White  HOODIES " -> { query: "white hoodies", stemmedQuery: "white hoodie", stems: ["white", "hoodie"] }
export function normalizeSearchQuery(raw) {
    const query = (raw || '').trim().replace(/\s+/g, ' ').toLowerCase()
    const stemmedTerms = query ? query.split(' ').map(stemTerm) : []
    return {
        query,
        stemmedQuery: stemmedTerms.join(' '),
        stems: [...new Set(stemmedTerms)],
    }
}

// Every word must match at least one searchable field (AND of ORs), so
// "white hoodie" finds products relating to both words instead of treating
// the sentence as one literal string.
export function buildSearchWhere(stems) {
    return stems.map((stem) => ({
        OR: [
            { name: { contains: stem, mode: 'insensitive' } },
            { description: { contains: stem, mode: 'insensitive' } },
            { category: { contains: stem, mode: 'insensitive' } },
            { store: { name: { contains: stem, mode: 'insensitive' } } },
        ],
    }))
}

// Relevance tiers, strongest first. A lower tier can never outweigh a higher
// one (450 name-match floor > 300 category + 150 description + 75 store).
const TIER = {
    NAME_EXACT: 1000,
    NAME_STARTS_WITH: 800,
    NAME_PHRASE: 600,
    NAME_ALL_WORDS: 450,
    NAME_PER_WORD: 40,
    CATEGORY: 300,
    DESCRIPTION: 150,
    STORE_NAME: 75,
}

function scoreProduct(product, { query, stemmedQuery, stems }) {
    const name = (product.name || '').toLowerCase()
    const category = (product.category || '').toLowerCase()
    const description = (product.description || '').toLowerCase()
    const storeName = (product.store?.name || '').toLowerCase()

    let score = 0

    // Phrase tiers match the raw query or its stemmed form, so "white hoodies"
    // still counts a product named "White Hoodie" as an exact match.
    if (name === query || name === stemmedQuery) score += TIER.NAME_EXACT
    else if (name.startsWith(query) || name.startsWith(stemmedQuery)) score += TIER.NAME_STARTS_WITH
    else if (name.includes(query) || name.includes(stemmedQuery)) score += TIER.NAME_PHRASE
    else if (stems.every((stem) => name.includes(stem))) score += TIER.NAME_ALL_WORDS

    score += stems.filter((stem) => name.includes(stem)).length * TIER.NAME_PER_WORD
    if (stems.some((stem) => category.includes(stem))) score += TIER.CATEGORY
    if (stems.some((stem) => description.includes(stem))) score += TIER.DESCRIPTION
    if (stems.some((stem) => storeName.includes(stem))) score += TIER.STORE_NAME

    return score
}

// Sort.prototype.sort is stable, so products with equal scores keep the
// caller's order (newest first).
export function rankSearchResults(products, search) {
    return products
        .map((product) => [scoreProduct(product, search), product])
        .sort((a, b) => b[0] - a[0])
        .map(([, product]) => product)
}
