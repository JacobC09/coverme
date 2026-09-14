export { cn } from "cn"

export function fuzzyScore(text: string, query: string) {
    let score = 0;
    let index = 0;
    const source = text.toLowerCase();
    const needle = query.toLowerCase();

    for (const char of needle) {
        const found = source.indexOf(char, index);
        if (found === -1) return 0;
        score += found === index ? 2 : 1;
        index = found + 1;
    }

    return score + (source.includes(needle) ? 10 : 0);
}
