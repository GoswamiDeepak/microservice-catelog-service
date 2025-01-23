/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// export function mapToObject(map: Map<string, any>): { [key: string]: any } {
//     const obj: { [key: string]: any } = {};
//     for (const [key, value] of map) {
//         obj[key] = value instanceof Map ? mapToObject(value) : value;
//     }
//     return obj;
// }

// export function mapToObject(map: Map<string, any>): { [key: string]: any } {
//     const obj: { [key: string]: any } = {};
//     for (const [key, value] of map) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//         obj[key] = value instanceof Map ? mapToObject(value as Map<string, unknown>) : value;
//     }
//     return obj;
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapToObject(map: Map<string, any>) {
    const obj = {};
    for (const [key, value] of map) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        obj[key] = value instanceof Map ? mapToObject(value) : value;
    }
    return obj;
}
