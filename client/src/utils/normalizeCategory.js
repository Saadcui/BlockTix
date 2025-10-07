// utils/normalizeCategory.js
export function normalizeCategory(category = "") {
  return category.trim().toLowerCase().replace(/\s+/g, "_"); 
  // e.g., "Food And Drink" → "food_and_drink"
}
