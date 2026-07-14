import { apiFetch } from "./client";
import { apiRoutes } from "./config";

export type Topic = {
  id: string;
  slug: string;
  title: string;
};

export type Category = {
  id: string;
  slug: string;
  title: string;
  topics: Topic[];
};

export async function listCategories(): Promise<Category[]> {
  const res = await apiFetch<{ items: Category[] }>(apiRoutes.catalog.categories);
  return res.items;
}

export function topicTitlesById(categories: Category[]): Map<string, string> {
  const titles = new Map<string, string>();
  for (const category of categories) {
    for (const topic of category.topics) {
      titles.set(topic.id, topic.title);
    }
  }
  return titles;
}
