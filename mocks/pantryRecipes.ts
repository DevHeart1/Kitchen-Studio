export interface PantryRecipeIngredient {
  name: string;
  amount: string;
}

export interface PantryRecipe {
  id: string;
  title: string;
  image: string;
  cookTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  ingredients: PantryRecipeIngredient[];
  cuisine: string;
  calories?: number;
}

export const PANTRY_RECIPES: PantryRecipe[] = [
  {
    id: "pr-1",
    title: "Garlic Butter Salmon",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCthHYMUEBYzQ9rYHH68GujT_ynIprHibR2MMnTaUEwM7HBh5qrLfcWvQQcrb_dDIfj5wy7CBQ8cq-PhIVwrjVxSTSFfLAFQs2wxbofQixsF9MiGHGNtv17z8dCXWAR_O2P2qA7TX4ff42hYp_qhlYVnNBQJ4y8WkYMikDsl4x2QWHske5J56ZmTWDYBsiUhjSzgvByD_wUVIbKHA-qMu9jwZ6pxHrQAuoIM0mjO0mrQeBkdWxlYVMsbkUCsru0Sdh59avkYy6ubA",
    cookTime: "25 min",
    difficulty: "Easy",
    servings: 2,
    cuisine: "Mediterranean",
    calories: 420,
    ingredients: [
      { name: "Salmon", amount: "2 fillets" },
      { name: "Butter", amount: "3 tbsp" },
      { name: "Garlic", amount: "4 cloves" },
      { name: "Lemon", amount: "1 whole" },
      { name: "Olive Oil", amount: "2 tbsp" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-2",
    title: "Classic Aglio e Olio",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyBHuo2syefoICrth20zOOkyxJGr7IdioHXX-118lN1ydGbO7e3ZPyodX6okmABO7GfEhV8_swxL0zAeoHPt21YSECsfgKSqfn_KcEABDsgS2qwQtEvVjKVowT4dB_jkoBTD0eqbxJIIV51irecbAEK3FanqFcQ2Dn9hDLHdY6wqtcS6GOnfeXVDFvDPi7Q6xM9vuTawlj6HcvCipskJhvFNrTWJ_r79kTXxoIflzGxRD9a28b9EGLfBKbjqmb8bwEwUoeGb8Zig",
    cookTime: "20 min",
    difficulty: "Easy",
    servings: 4,
    cuisine: "Italian",
    calories: 380,
    ingredients: [
      { name: "Pasta", amount: "400g" },
      { name: "Olive Oil", amount: "1/2 cup" },
      { name: "Garlic", amount: "8 cloves" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-3",
    title: "Lemon Butter Rice Bowl",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFBjVsYo6FI2HtenEQ0CdD7FS-eF3Oag5PxJIgXbPa32CRyiVIZDnvnBhlqRp-f_yPGTwlbIV4-ugkDmG0Wu5__MhnJXabpzmoKB8-ygnCmCwVqSpFXiX38e0P6vffaE1J9Gs8zjtJ8l9ul3Vb5xPcAKXtas4oELv1CUTY-dKAAzBdllbIx_LMn2kzZngy7OM31RwT7zr_az9ePjV4uolVWuHo8ipQxZUC8tmymVyfAbj5LjW717BV1gBy-NWs6WOS17NSnGMRaQ",
    cookTime: "30 min",
    difficulty: "Easy",
    servings: 2,
    cuisine: "Fusion",
    calories: 320,
    ingredients: [
      { name: "Rice", amount: "1 cup" },
      { name: "Butter", amount: "2 tbsp" },
      { name: "Lemon", amount: "1 whole" },
      { name: "Garlic", amount: "2 cloves" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-4",
    title: "Pan-Seared Salmon with Rice",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuARg6uLtked95kTG0C5p5SRtNryHxrdaIGcD1hMIRwlCp2H0Xnt9NIZnbi01naMTFFqqzLxaf97lrt4L4QA-pQA6EXeU4etHmHrYKHgF16LkIENW2mramX5I8INSM_6hI81K7DAmysd4xv2NbQGtqZuLs2L6rNYSE3qvr6MaXqHHVIqAEcPvRDDdpTrF6qHyQe8fBtD409m2x9mwyvuz_w7ivtFS5Abn1DcDGnfASmo3lYm7u62cXCvbvAoDxgvTtTiM3DFdZrZmQ",
    cookTime: "35 min",
    difficulty: "Medium",
    servings: 2,
    cuisine: "Asian",
    calories: 480,
    ingredients: [
      { name: "Salmon", amount: "2 fillets" },
      { name: "Rice", amount: "1 cup" },
      { name: "Olive Oil", amount: "2 tbsp" },
      { name: "Garlic", amount: "3 cloves" },
      { name: "Lemon", amount: "1 whole" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-5",
    title: "Garlic Butter Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
    cookTime: "15 min",
    difficulty: "Easy",
    servings: 2,
    cuisine: "Italian",
    calories: 450,
    ingredients: [
      { name: "Pasta", amount: "200g" },
      { name: "Butter", amount: "4 tbsp" },
      { name: "Garlic", amount: "6 cloves" },
      { name: "Olive Oil", amount: "2 tbsp" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-6",
    title: "Simple Lemon Salmon",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
    cookTime: "20 min",
    difficulty: "Easy",
    servings: 2,
    cuisine: "Mediterranean",
    calories: 350,
    ingredients: [
      { name: "Salmon", amount: "2 fillets" },
      { name: "Lemon", amount: "2 whole" },
      { name: "Olive Oil", amount: "3 tbsp" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-7",
    title: "Buttery Garlic Rice",
    image: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400",
    cookTime: "25 min",
    difficulty: "Easy",
    servings: 4,
    cuisine: "Asian",
    calories: 280,
    ingredients: [
      { name: "Rice", amount: "2 cups" },
      { name: "Butter", amount: "3 tbsp" },
      { name: "Garlic", amount: "4 cloves" },
      { name: "Salt", amount: "to taste" },
    ],
  },
  {
    id: "pr-8",
    title: "Mediterranean Pasta Salad",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400",
    cookTime: "20 min",
    difficulty: "Easy",
    servings: 4,
    cuisine: "Mediterranean",
    calories: 320,
    ingredients: [
      { name: "Pasta", amount: "300g" },
      { name: "Olive Oil", amount: "4 tbsp" },
      { name: "Lemon", amount: "1 whole" },
      { name: "Garlic", amount: "2 cloves" },
      { name: "Salt", amount: "to taste" },
    ],
  },
];
