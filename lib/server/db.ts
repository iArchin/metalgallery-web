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
 */

const DATA_DIR = path.join(process.cwd(), "data");

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
  | "settings"
  | "pages";

const writeQueues = new Map<CollectionName, Promise<unknown>>();

function fileFor(name: CollectionName): string {
  return path.join(DATA_DIR, `${name}.json`);
}

export async function readCollection<T>(name: CollectionName): Promise<T> {
  const raw = await fs.readFile(fileFor(name), "utf-8");
  return JSON.parse(raw) as T;
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
