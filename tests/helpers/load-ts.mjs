// Exercise server TypeScript directly, with only the database/cookie transport replaced.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
export default function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const target = { exports: {} };
    cache.set(file, target);
    const nativeRequire = createRequire(file);
    const requireForTest = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === 'server-only') return {};
      if (name.startsWith('.') || name.startsWith('@/')) {
        const path = name.startsWith('@/') ? resolve(process.cwd(), name.slice(2)) : resolve(dirname(file), name);
        if (existsSync(`${path}.ts`)) return load(`${path}.ts`);
      }
      return nativeRequire(name);
    };
    const result = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
    const run = runInThisContext(`(function(require,module,exports){${result.outputText}\n})`, { filename: file });
    run(requireForTest, target, target.exports);
    return target.exports;
  }
  return load;
};
