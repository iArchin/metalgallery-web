import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny file-backed JSON database.
 *
 * Each collection is one JSON array/object file under /data. Writes are
 * atomic (tmp file + rename) and serialized through a per-collection promise
 * queue so concurrent route handlers can't interleave read-modify-write
 * cycles within this process.
 *
 * That queue lives in a single Node process, so exactly one process may ever
 * write to a given data dir. Never run two replicas against the same volume.
 */

// In a container the data dir is a mounted volume rather than a subdirectory of
// the app, and `output: "standalone"` moves what process.cwd() resolves to.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export type CollectionName =
  | "products"
  | "categories"
  | "brands"
  | "orders"
  | "articles"
  | "news"
  | "gallery"
  | "messages"
  | "users"
  | "customers"
  | "otps"
  | "chats"
  | "settings"
  | "pages";

const writeQueues = new Map<CollectionName, Promise<unknown>>();

/**
 * What a collection looks like before anything has been written to it. Every
 * collection is a list except `otps`, which is keyed by phone. `settings` and
 * `pages` are singletons with no meaningful empty form, so they are absent
 * here and a missing file stays a real error rather than an empty homepage.
 */
const EMPTY: Partial<Record<CollectionName, unknown>> = {
  products: [],
  categories: [],
  brands: [],
  orders: [],
  articles: [],
  news: [],
  gallery: [],
  messages: [],
  users: [],
  customers: [],
  chats: [],
  otps: {},
};

function fileFor(name: CollectionName): string {
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readCollection<T>(name: CollectionName): Promise<T> {
  try {
    const raw = await fs.readFile(fileFor(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    // A never-written collection is not a failure: a fresh data volume has no
    // otps.json until the first login, and a release that adds a collection
    // meets volumes that predate it. Corrupt JSON or a permissions problem
    // still throws.
    const notFound = (err as NodeJS.ErrnoException).code === "ENOENT";
    if (notFound && name in EMPTY) return EMPTY[name] as T;
    throw err;
  }
}

async function writeCollection<T>(name: CollectionName, data: T): Promise<void> {
  const target = fileFor(name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, target);
}

/**
 * Serialized read-modify-write. The mutator receives the current value and
 * returns the next value (or a tuple with a result to hand back to the
 * caller).
 */
export async function updateCollection<T, R = void>(
  name: CollectionName,
  mutate: (current: T) => { next: T; result: R } | Promise<{ next: T; result: R }>
): Promise<R> {
  const prev = writeQueues.get(name) ?? Promise.resolve();
  const job = prev
    .catch(() => {}) // a failed predecessor must not poison the queue
    .then(async () => {
      const current = await readCollection<T>(name);
      const { next, result } = await mutate(current);
      await writeCollection(name, next);
      return result;
    });
  writeQueues.set(name, job);
  return job;
}

/** Next numeric id for an array collection. */
export function nextId(items: { id: number }[]): number {
  return items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
}
