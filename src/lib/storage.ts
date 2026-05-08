export const storage = {
  get<T>(key: string): T[] {
    const data = localStorage.getItem(`spark-study-${key}`);
    return data ? JSON.parse(data) : [];
  },
  save<T>(key: string, data: T[]) {
    localStorage.setItem(`spark-study-${key}`, JSON.stringify(data));
  },
  addItem<T extends { id: string }>(key: string, item: T) {
    const items = this.get<T>(key);
    items.push(item);
    this.save(key, items);
    return item;
  },
  updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>) {
    const items = this.get<T>(key);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.save(key, items);
      return items[index];
    }
    return null;
  },
  deleteItem(key: string, id: string) {
    const items = this.get<{ id: string }>(key);
    this.save(key, items.filter(i => i.id !== id));
  }
};
