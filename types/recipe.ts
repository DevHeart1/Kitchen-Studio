
export interface RecipeIngredient {
    id: string;
    name: string;
    amount: number;
    unit: string;
    originalString: string;
    image?: string;
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    cookTime: string;
    difficulty: "Easy" | "Medium" | "Hard";
    calories: string;
    image: string;
    tags: string[];
    cuisine: string;
    ingredients: RecipeIngredient[];
    instructions: { step: number; text: string; time?: number }[];

    // Computed fields (not in DB)
    matchPercentage?: number;
    missingIngredients?: string[];
    canCook?: boolean;
}
