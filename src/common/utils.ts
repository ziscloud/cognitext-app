type Path = string;
export function isSamePath(
    p1: Path,
    p2: Path
): boolean {
    // 解析为绝对URL并验证类型
    // const url1 = new URL(p1);
    // const url2 = new URL(p2);

    // 提取路径并标准化
    const path1 = normalizePath(p1);
    const path2 = normalizePath(p2);

    return path1 === path2;
}

function normalizePath(rawPath: string): string {
    // 统一分隔符为 '/'
    let path = rawPath.replace(/\\/g, '/');

    // 处理根路径（如 /C:/ 在file://协议中）
    if (path.startsWith('/')) {
        const parts = path.split('/');
        if (parts[1] && parts[1].match(/[A-Za-z]:/)) { // 处理Windows盘符（如 /C:/）
            path = '/' + parts.slice(1).join('/').replace(/^[A-Za-z]:/, '');
        } else {
            path = '/' + parts.slice(1).join('/').replace(/^\.\.\.\//, '');
        }
    }

    // 处理 '.' 和 '..'
    const segments = path.split('/').filter(s => s !== '');
    const stack: string[] = [];

    for (const seg of segments) {
        if (seg === '.') continue;
        if (seg === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(seg);
        }
    }

    return '/' + stack.join('/');
}
