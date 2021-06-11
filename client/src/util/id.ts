export function generateId(): string {
    const length = 16;
    let id = ''
    for (let i = 0; i < length; i++) {
        id += String.fromCharCode(65 + Math.trunc(Math.random() * 26));
    }
    return id;
}
